import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  createStudentSchema,
  updateStudentSchema,
  idSchema,
} from "@/lib/validations/common-schemas";
import { fromUTC, getStartOfMonthUTC } from "@/lib/timezone";

export const studentRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const teacher = await ctx.db.teacher.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!teacher) {
      return [];
    }

    return ctx.db.student.findMany({
      where: {
        teacherId: teacher.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });
  }),

  getByGuid: protectedProcedure
    .input(z.object({ id: idSchema }))
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      const student = await ctx.db.student.findFirst({
        where: {
          id: input.id,
          teacherId: teacher.id,
        },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          lessons: {
            orderBy: { date: "desc" },
            take: 10,
          },
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      return student;
    }),

  create: protectedProcedure
    .input(createStudentSchema)
    .mutation(async ({ ctx, input }) => {
      let teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      teacher ??= await ctx.db.teacher.create({
        data: {
          userId: ctx.session.user.id,
        },
      });

      return ctx.db.student.create({
        data: {
          name: input.name,
          ...(input.notes && { notes: input.notes }),
          ...(input.avatar && { avatar: input.avatar }),
          ...(input.lessonRate !== undefined && {
            lessonRate: input.lessonRate,
          }),
          ...(input.onlineLessonRate !== undefined && {
            onlineLessonRate: input.onlineLessonRate,
          }),
          teacher: { connect: { id: teacher.id } },
        },
      });
    }),

  update: protectedProcedure
    .input(updateStudentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      // Verify student belongs to teacher
      const student = await ctx.db.student.findFirst({
        where: {
          id,
          teacherId: teacher.id,
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      // Only write real Student columns (the input schema also carries
      // form-only fields like email/phoneNumber that aren't on the model).
      const updated = await ctx.db.student.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.avatar !== undefined && { avatar: data.avatar }),
          ...(data.lessonRate !== undefined && { lessonRate: data.lessonRate }),
          ...(data.onlineLessonRate !== undefined && {
            onlineLessonRate: data.onlineLessonRate,
          }),
        },
      });

      // When a rate changes, re-price the CURRENT month and all FUTURE lessons.
      // Past months are never touched, so their snapshots stay frozen.
      const offlineRateChanged = updated.lessonRate !== student.lessonRate;
      const onlineRateChanged =
        updated.onlineLessonRate !== student.onlineLessonRate;

      if (offlineRateChanged || onlineRateChanged) {
        const timezone = ctx.session.user.timezone ?? "UTC";
        const now = fromUTC(new Date(), timezone);
        const monthStart = getStartOfMonthUTC(
          now.getMonth() + 1,
          now.getFullYear(),
          timezone,
        );

        // Only re-stamp lessons still priced at the OLD rate. Lessons given a
        // manual per-lesson override (a different rate) are left untouched.
        const restampOps = [];
        if (offlineRateChanged) {
          restampOps.push(
            ctx.db.lesson.updateMany({
              where: {
                studentId: id,
                isOnline: false,
                date: { gte: monthStart },
                rate: student.lessonRate,
              },
              data: { rate: updated.lessonRate },
            }),
          );
        }
        if (onlineRateChanged) {
          restampOps.push(
            ctx.db.lesson.updateMany({
              where: {
                studentId: id,
                isOnline: true,
                date: { gte: monthStart },
                rate: student.onlineLessonRate,
              },
              data: { rate: updated.onlineLessonRate },
            }),
          );
        }
        await Promise.all(restampOps);
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      // Verify student belongs to teacher
      const student = await ctx.db.student.findFirst({
        where: {
          id: input.id,
          teacherId: teacher.id,
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      return ctx.db.student.delete({
        where: { id: input.id },
      });
    }),
});
