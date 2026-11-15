import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";

import {
  createParentAccountSchema,
  deleteParentAccountSchema,
  deletePracticeVideoSchema,
  setParentStudentsSchema,
  setPaymentQrSchema,
  updateParentAccountSchema,
  updatePracticeVideoCommentSchema,
} from "@/lib/validations/api-schemas";
import { createTRPCRouter, teacherProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const parentRouter = createTRPCRouter({
  /**
   * List all parents in the teacher's studio with their linked students.
   */
  list: teacherProcedure.query(async ({ ctx }) => {
    const parents = await ctx.db.parent.findMany({
      where: { teacherId: ctx.teacher.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
        studentLinks: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return parents.map((parent) => ({
      id: parent.id,
      userId: parent.userId,
      name: parent.user.name,
      email: parent.user.email,
      image: parent.user.image,
      createdAt: parent.createdAt,
      students: parent.studentLinks.map((link) => link.student),
    }));
  }),

  /**
   * Create a new parent login linked to specified students.
   */
  create: teacherProcedure
    .input(createParentAccountSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Verify email uniqueness
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      // 2. Verify all students belong to the teacher's studio
      const distinctStudentIds = Array.from(new Set(input.studentIds));
      const validStudents = await ctx.db.student.findMany({
        where: {
          id: { in: distinctStudentIds },
          teacherId: ctx.teacher.id,
        },
        select: { id: true },
      });

      if (validStudents.length !== distinctStudentIds.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "One or more students do not belong to your studio",
        });
      }

      // 3. Hash password
      const hashedPassword = await hash(input.password, 10);

      // 4. Create User (role PARENT) + Parent + ParentStudent records in a transaction
      return ctx.db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: input.name,
            email: input.email,
            password: hashedPassword,
            role: "PARENT",
            timezone: ctx.teacher.timezone ?? "UTC",
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        const parent = await tx.parent.create({
          data: {
            userId: user.id,
            teacherId: ctx.teacher.id,
            studentLinks: {
              create: distinctStudentIds.map((studentId) => ({
                studentId,
              })),
            },
          },
          include: {
            studentLinks: {
              include: {
                student: {
                  select: { id: true, name: true, avatar: true },
                },
              },
            },
          },
        });

        return {
          id: parent.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          students: parent.studentLinks.map((link) => link.student),
        };
      });
    }),

  /**
   * Update parent name or reset password.
   */
  update: teacherProcedure
    .input(updateParentAccountSchema)
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.db.parent.findFirst({
        where: {
          id: input.parentId,
          teacherId: ctx.teacher.id,
        },
      });

      if (!parent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parent account not found",
        });
      }

      const updateData: { name?: string; password?: string } = {};
      if (input.name !== undefined) {
        updateData.name = input.name;
      }
      if (input.password !== undefined && input.password.length > 0) {
        updateData.password = await hash(input.password, 10);
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: parent.userId },
        data: updateData,
        select: { id: true, name: true, email: true },
      });

      return {
        id: parent.id,
        userId: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      };
    }),

  /**
   * Set/replace linked students for a parent.
   */
  setStudents: teacherProcedure
    .input(setParentStudentsSchema)
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.db.parent.findFirst({
        where: {
          id: input.parentId,
          teacherId: ctx.teacher.id,
        },
      });

      if (!parent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parent account not found",
        });
      }

      const distinctStudentIds = Array.from(new Set(input.studentIds));
      if (distinctStudentIds.length > 0) {
        const validStudents = await ctx.db.student.findMany({
          where: {
            id: { in: distinctStudentIds },
            teacherId: ctx.teacher.id,
          },
          select: { id: true },
        });

        if (validStudents.length !== distinctStudentIds.length) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "One or more students do not belong to your studio",
          });
        }
      }

      return ctx.db.$transaction(async (tx) => {
        // Disconnect all existing links
        await tx.parentStudent.deleteMany({
          where: { parentId: parent.id },
        });

        // Insert new links
        if (distinctStudentIds.length > 0) {
          await tx.parentStudent.createMany({
            data: distinctStudentIds.map((studentId) => ({
              parentId: parent.id,
              studentId,
            })),
          });
        }

        const links = await tx.parentStudent.findMany({
          where: { parentId: parent.id },
          include: {
            student: {
              select: { id: true, name: true, avatar: true },
            },
          },
        });

        return links.map((l) => l.student);
      });
    }),

  /**
   * Delete parent account. Deletes the User record which cascades to Parent and ParentStudent.
   */
  delete: teacherProcedure
    .input(deleteParentAccountSchema)
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.db.parent.findFirst({
        where: {
          id: input.parentId,
          teacherId: ctx.teacher.id,
        },
      });

      if (!parent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parent account not found",
        });
      }

      // Delete the User to prevent orphaned logins
      await ctx.db.user.delete({
        where: { id: parent.userId },
      });

      return { success: true };
    }),

  /**
   * Get teacher's own payment QR details.
   */
  getPaymentQr: teacherProcedure.query(async ({ ctx }) => {
    const teacher = await ctx.db.teacher.findUnique({
      where: { id: ctx.teacher.id },
      select: {
        paymentQrData: true,
        paymentQrName: true,
        paymentNote: true,
      },
    });

    return teacher ?? { paymentQrData: null, paymentQrName: null, paymentNote: null };
  }),

  /**
   * Set or update payment QR image and note.
   */
  setPaymentQr: teacherProcedure
    .input(setPaymentQrSchema)
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.teacher.update({
        where: { id: ctx.teacher.id },
        data: {
          paymentQrData: input.dataUrl,
          paymentQrName: input.name ?? null,
          paymentNote: input.note ?? null,
        },
        select: {
          paymentQrData: true,
          paymentQrName: true,
          paymentNote: true,
        },
      });

      return updated;
    }),

  /**
   * Clear payment QR data.
   */
  clearPaymentQr: teacherProcedure.mutation(async ({ ctx }) => {
    await ctx.db.teacher.update({
      where: { id: ctx.teacher.id },
      data: {
        paymentQrData: null,
        paymentQrName: null,
        paymentNote: null,
      },
    });

    return { success: true };
  }),

  /**
   * Teacher view of practice videos across the studio.
   */
  practiceVideos: teacherProcedure
    .input(
      z
        .object({
          studentId: z.string().cuid().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const videos = await ctx.db.practiceVideo.findMany({
        where: {
          teacherId: ctx.teacher.id,
          ...(input?.studentId ? { studentId: input.studentId } : {}),
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          postedBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return videos;
    }),

  /**
   * Update teacher's comment on a practice video.
   */
  updateVideoComment: teacherProcedure
    .input(updatePracticeVideoCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const video = await ctx.db.practiceVideo.findFirst({
        where: {
          id: input.videoId,
          teacherId: ctx.teacher.id,
        },
      });

      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Practice video not found",
        });
      }

      const trimmed = input.teacherComment?.trim();
      const updated = await ctx.db.practiceVideo.update({
        where: { id: input.videoId },
        data: {
          teacherComment: trimmed && trimmed.length > 0 ? trimmed : null,
        },
      });

      return updated;
    }),

  /**
   * Delete a practice post from the studio (teacher moderation).
   */
  deleteVideo: teacherProcedure
    .input(deletePracticeVideoSchema)
    .mutation(async ({ ctx, input }) => {
      const video = await ctx.db.practiceVideo.findFirst({
        where: {
          id: input.videoId,
          teacherId: ctx.teacher.id,
        },
      });

      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Practice post not found in your studio",
        });
      }

      await ctx.db.practiceVideo.delete({
        where: { id: input.videoId },
      });

      return { success: true };
    }),
});
