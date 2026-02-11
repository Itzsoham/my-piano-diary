import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { endOfMonth } from "date-fns";
import { startOfMonth } from "date-fns";
import { idSchema } from "@/lib/validations/common-schemas";

export const reportRouter = createTRPCRouter({
  // Generate monthly preview data
  generatePreview: protectedProcedure
    .input(
      z.object({
        studentId: idSchema,
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(1900).max(2100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      const student = await ctx.db.student.findFirst({
        where: {
          id: input.studentId,
          teacherId: teacher.id,
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      const startDate = startOfMonth(new Date(input.year, input.month - 1, 1));
      const endDate = endOfMonth(startDate);

      const lessons = await ctx.db.lesson.findMany({
        where: {
          studentId: input.studentId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: "COMPLETE",
        },
        orderBy: {
          date: "asc",
        },
      });

      const totalLessons = lessons.length;
      const totalFee = totalLessons * teacher.hourlyRate;

      return {
        lessons,
        totalLessons,
        totalFee,
        teacherHourlyRate: teacher.hourlyRate,
      };
    }),
  // Get student report for a specific month
  getStudentReport: protectedProcedure
    .input(
      z.object({
        studentId: idSchema,
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(1900).max(2100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
        include: { user: true },
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

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = endOfMonth(startDate);

      const [report, lessons] = await Promise.all([
        ctx.db.monthlyReport.findUnique({
          where: {
            studentId_month_year: {
              studentId: input.studentId,
              month: input.month,
              year: input.year,
            },
          },
        }),
        ctx.db.lesson.findMany({
          where: {
            studentId: input.studentId,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            date: "asc",
          },
        }),
      ]);

      return {
        report,
        lessons,
        student,
        teacherHourlyRate: teacher.hourlyRate,
        teacherName: teacher.user?.name ?? null,
      };
    }),

  // Get existing monthly report
  getByMonth: protectedProcedure
    .input(
      z.object({
        studentId: idSchema,
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(1900).max(2100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      const student = await ctx.db.student.findFirst({
        where: {
          id: input.studentId,
          teacherId: teacher.id,
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      return ctx.db.monthlyReport.findUnique({
        where: {
          studentId_month_year: {
            studentId: input.studentId,
            month: input.month,
            year: input.year,
          },
        },
      });
    }),

  // Upsert monthly report
  upsertReport: protectedProcedure
    .input(
      z.object({
        studentId: idSchema,
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(1900).max(2100),
        summary: z.string().max(5000).optional(),
        comments: z.string().max(5000).optional(),
        nextMonthPlan: z.string().max(5000).optional(),
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

      const { studentId, month, year, ...data } = input;

      return ctx.db.monthlyReport.upsert({
        where: {
          studentId_month_year: {
            studentId,
            month,
            year,
          },
        },
        create: {
          studentId,
          month,
          year,
          ...data,
        },
        update: {
          ...data,
        },
      });
    }),

  // Save monthly report (alias for upsert)
  createOrUpdate: protectedProcedure
    .input(
      z.object({
        studentId: idSchema,
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(1900).max(2100),
        summary: z.string().max(5000).optional(),
        comments: z.string().max(5000).optional(),
        nextMonthPlan: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      const student = await ctx.db.student.findFirst({
        where: {
          id: input.studentId,
          teacherId: teacher.id,
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      const { studentId, month, year, ...data } = input;

      return ctx.db.monthlyReport.upsert({
        where: {
          studentId_month_year: {
            studentId,
            month,
            year,
          },
        },
        create: {
          studentId,
          month,
          year,
          ...data,
        },
        update: {
          ...data,
        },
      });
    }),
});
