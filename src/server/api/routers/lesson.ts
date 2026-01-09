import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { AttendanceStatus, LessonStatus } from "@prisma/client";

export const lessonRouter = createTRPCRouter({
  // Get lessons for a specific month
  getForMonth: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      // Get teacher
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return [];
      }

      return ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          attendance: true,
        },
        orderBy: {
          date: "asc",
        },
      });
    }),

  // Create a new lesson
  create: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        date: z.date(),
        duration: z.number().min(15),
        pieceId: z.string().optional(),
      }),
    )
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
          id: input.studentId,
          teacherId: teacher.id,
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      return ctx.db.lesson.create({
        data: {
          studentId: input.studentId,
          teacherId: teacher.id,
          date: input.date,
          duration: input.duration,
          status: LessonStatus.COMPLETE,
          pieceId: input.pieceId,
        },
        include: {
          student: true,
        },
      });
    }),

  // Update lesson
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        date: z.date().optional(),
        duration: z.number().min(15).optional(),
        status: z.nativeEnum(LessonStatus).optional(),
        cancelReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      // Verify lesson belongs to teacher
      const lesson = await ctx.db.lesson.findFirst({
        where: {
          id,
          teacherId: teacher.id,
        },
      });

      if (!lesson) {
        throw new Error("Lesson not found");
      }

      return ctx.db.lesson.update({
        where: { id },
        data,
        include: {
          student: true,
        },
      });
    }),

  // Delete lesson
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      // Verify lesson belongs to teacher
      const lesson = await ctx.db.lesson.findFirst({
        where: {
          id: input.id,
          teacherId: teacher.id,
        },
      });

      if (!lesson) {
        throw new Error("Lesson not found");
      }

      return ctx.db.lesson.delete({
        where: { id: input.id },
      });
    }),

  // Mark attendance
  markAttendance: protectedProcedure
    .input(
      z.object({
        lessonId: z.string(),
        status: z.nativeEnum(AttendanceStatus),
        actualMin: z.number().min(0),
        reason: z.string().optional(),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      // Verify lesson belongs to teacher
      const lesson = await ctx.db.lesson.findFirst({
        where: {
          id: input.lessonId,
          teacherId: teacher.id,
        },
      });

      if (!lesson) {
        throw new Error("Lesson not found");
      }

      // Upsert attendance
      return ctx.db.attendance.upsert({
        where: {
          lessonId: input.lessonId,
        },
        create: {
          lessonId: input.lessonId,
          date: lesson.date,
          status: input.status,
          actualMin: input.actualMin,
          reason: input.reason,
          note: input.note,
        },
        update: {
          status: input.status,
          actualMin: input.actualMin,
          reason: input.reason,
          note: input.note,
        },
      });
    }),
});
