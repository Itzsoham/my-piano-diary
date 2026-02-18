import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  createLessonSchema,
  updateLessonSchema,
  idSchema,
  lessonStatusSchema,
} from "@/lib/validations/common-schemas";
import {
  markAttendanceSchema,
  createRecurringLessonSchema,
} from "@/lib/validations/api-schemas";

export const lessonRouter = createTRPCRouter({
  // Get all lessons with filters
  getAll: protectedProcedure
    .input(
      z.object({
        studentId: idSchema.optional(),
        from: z.date().optional(),
        to: z.date().optional(),
        status: lessonStatusSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return [];
      }

      const dateFilter =
        input.from || input.to
          ? {
              date: {
                ...(input.from && { gte: input.from }),
                ...(input.to && { lte: input.to }),
              },
            }
          : {};

      return ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          ...(input.studentId && { studentId: input.studentId }),
          ...(input.status && { status: input.status }),
          ...dateFilter,
        },
        include: {
          student: true,
          piece: true,
        },
        orderBy: { date: "desc" },
      });
    }),
  // Get lessons for a specific month
  getForMonth: protectedProcedure
    .input(
      z.object({
        year: z.number().int().min(1900).max(2100),
        month: z.number().int().min(1).max(12),
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
          piece: true,
        },
        orderBy: {
          date: "asc",
        },
      });
    }),

  // Get lessons for a specific date range
  getInRange: protectedProcedure
    .input(
      z.object({
        start: z.date(),
        end: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
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
            gte: input.start,
            lte: input.end,
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
          piece: true,
        },
        orderBy: {
          date: "asc",
        },
      });
    }),

  // Create a new lesson
  create: protectedProcedure
    .input(createLessonSchema)
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

      // Verify piece belongs to teacher if pieceId is provided
      if (input.pieceId) {
        const piece = await ctx.db.piece.findFirst({
          where: {
            id: input.pieceId,
            teacherId: teacher.id,
          },
        });

        if (!piece) {
          throw new Error("Piece not found");
        }
      }

      return ctx.db.lesson.create({
        data: {
          studentId: input.studentId,
          teacherId: teacher.id,
          date: input.date,
          duration: input.duration,
          status: "PENDING",
          pieceId: input.pieceId,
        },
        include: {
          student: true,
        },
      });
    }),

  // Update lesson
  update: protectedProcedure
    .input(updateLessonSchema)
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

      // Verify piece belongs to teacher if pieceId is being updated
      if (data.pieceId !== undefined && data.pieceId !== null) {
        const piece = await ctx.db.piece.findFirst({
          where: {
            id: data.pieceId,
            teacherId: teacher.id,
          },
        });

        if (!piece) {
          throw new Error("Piece not found");
        }
      }

      return ctx.db.lesson.update({
        where: { id },
        data: {
          ...(data.date && { date: data.date }),
          ...(data.duration && { duration: data.duration }),
          ...(data.status && { status: data.status }),
          ...(data.pieceId !== undefined && { pieceId: data.pieceId }),
        },
        include: {
          student: true,
        },
      });
    }),

  // Delete lesson
  delete: protectedProcedure
    .input(z.object({ id: idSchema }))
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
    .input(markAttendanceSchema)
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

      // Update lesson with attendance information
      return ctx.db.lesson.update({
        where: {
          id: input.lessonId,
        },
        data: {
          status: input.status,
          actualMin: input.actualMin,
          cancelReason: input.cancelReason,
          note: input.note,
        },
        include: {
          student: true,
          piece: true,
        },
      });
    }),

  // Create recurring lessons
  createRecurring: protectedProcedure
    .input(createRecurringLessonSchema)
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

      // Verify piece belongs to teacher if pieceId is provided
      if (input.pieceId) {
        const piece = await ctx.db.piece.findFirst({
          where: {
            id: input.pieceId,
            teacherId: teacher.id,
          },
        });

        if (!piece) {
          throw new Error("Piece not found");
        }
      }

      const lessonsToCreate = [];
      const startDate = new Date(input.startDate);
      const recurrenceMonths = input.recurrenceMonths; // 1 or 2

      // Calculate end date (1 or 2 months from start)
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + recurrenceMonths);

      // Parse time
      const [hours = 0, minutes = 0] = input.time.split(":").map(Number);

      // 1. Find the first matching weekday
      // input.dayOfWeek: 0 (Sunday) - 6 (Saturday)
      const currentDate = new Date(startDate);
      // Reset time to the desired time
      currentDate.setHours(hours, minutes, 0, 0);

      // If currentDate day is not the target day, move forward
      while (currentDate.getDay() !== input.dayOfWeek) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 2. Loop week by week
      while (currentDate < endDate) {
        // Create lesson date object
        const lessonDate = new Date(currentDate);

        // Check if lesson already exists for this student at this time
        // We'll skip if it exists to avoid duplicates/errors
        const existingLesson = await ctx.db.lesson.findFirst({
          where: {
            studentId: input.studentId,
            date: lessonDate,
          },
        });

        if (!existingLesson) {
          lessonsToCreate.push({
            studentId: input.studentId,
            teacherId: teacher.id,
            date: lessonDate,
            duration: input.duration,
            status: "PENDING" as const,
            pieceId: input.pieceId,
          });
        }

        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7);
      }

      if (lessonsToCreate.length === 0) {
        return { count: 0 };
      }

      // Bulk create
      await ctx.db.lesson.createMany({
        data: lessonsToCreate,
      });

      return { count: lessonsToCreate.length };
    }),
});
