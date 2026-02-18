import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

// Type definitions for return values
interface DashboardData {
  totalEarnings: number;
  currentMonthEarnings: number;
  currentMonthLoss: number;
}

interface StudentEarningsData {
  studentId: string;
  studentName: string;
  avatar: string | null;
  lessonCount: number;
  earnings: number;
  lessonRate: number;
}

interface TodayLesson {
  id: string;
  studentId: string;
  teacherId: string;
  date: Date;
  duration: number;
  status: string;
  cancelReason: string | null;
  pieceId: string | null;
  createdAt: Date;
  earnings: number;
  actualMin: number | null;
  note: string | null;
  piece: {
    title: string;
  } | null;
  student: {
    id: string;
    name: string;
    avatar: string | null;
    lessonRate: number;
  };
}

export const earningsRouter = createTRPCRouter({
  // Get earnings dashboard data
  getDashboard: protectedProcedure.query(
    async ({ ctx }): Promise<DashboardData> => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return {
          totalEarnings: 0,
          currentMonthEarnings: 0,
          currentMonthLoss: 0,
        };
      }

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      // Get all completed lessons with student data
      const completedLessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          status: "COMPLETE",
        },
        include: {
          student: {
            select: {
              lessonRate: true,
            },
          },
        },
      });

      // Get current month completed lessons with student data
      const currentMonthCompletedLessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
          status: "COMPLETE",
        },
        include: {
          student: {
            select: {
              lessonRate: true,
            },
          },
        },
      });

      // Get current month cancelled lessons with student data
      const currentMonthCancelledLessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
          status: "CANCELLED",
        },
        include: {
          student: {
            select: {
              lessonRate: true,
            },
          },
        },
      });

      // Calculate total earnings (all time)
      const totalEarnings = completedLessons.reduce(
        (sum, lesson) => sum + lesson.student.lessonRate,
        0,
      );

      // Calculate current month earnings
      const currentMonthEarnings = currentMonthCompletedLessons.reduce(
        (sum, lesson) => sum + lesson.student.lessonRate,
        0,
      );

      // Calculate current month loss from cancelled lessons
      const currentMonthLoss = currentMonthCancelledLessons.reduce(
        (sum, lesson) => sum + lesson.student.lessonRate,
        0,
      );

      return {
        totalEarnings,
        currentMonthEarnings,
        currentMonthLoss,
      };
    },
  ),

  // Get today's lessons with earnings
  getTodayLessons: protectedProcedure
    .input(z.object({ date: z.date().optional() }).optional())
    .query(async ({ ctx, input }): Promise<TodayLesson[]> => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return [];
      }

      const referenceDate = input?.date ?? new Date();
      const todayStart = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate(),
        0,
        0,
        0,
      );
      const todayEnd = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate(),
        23,
        59,
        59,
      );

      const lessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              avatar: true,
              lessonRate: true,
            },
          },
          piece: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      return lessons.map((lesson) => ({
        ...lesson,
        earnings: lesson.status !== "CANCELLED" ? lesson.student.lessonRate : 0,
      }));
    }),

  // Get earnings by student for current month
  getByStudent: protectedProcedure.query(
    async ({ ctx }): Promise<StudentEarningsData[]> => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return [];
      }

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      const lessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
          status: "COMPLETE",
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              avatar: true,
              lessonRate: true,
            },
          },
        },
      });

      // Group by student and calculate earnings
      const studentEarnings = lessons.reduce(
        (acc, lesson) => {
          const studentId = lesson.student.id;
          const earnings = lesson.student.lessonRate;

          acc[studentId] ??= {
            studentId,
            studentName: lesson.student.name,
            avatar: lesson.student.avatar,
            lessonCount: 0,
            earnings: 0,
            lessonRate: lesson.student.lessonRate,
          };

          acc[studentId].earnings += earnings;
          acc[studentId].lessonCount += 1;

          return acc;
        },
        {} as Record<
          string,
          {
            studentId: string;
            studentName: string;
            avatar: string | null;
            lessonCount: number;
            earnings: number;
            lessonRate: number;
          }
        >,
      );

      return Object.values(studentEarnings).sort(
        (a, b) => b.earnings - a.earnings,
      );
    },
  ),
});
