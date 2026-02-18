import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  createStudentSchema,
  updateStudentSchema,
  idSchema,
} from "@/lib/validations/common-schemas";

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

      return ctx.db.student.update({
        where: { id },
        data,
      });
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
