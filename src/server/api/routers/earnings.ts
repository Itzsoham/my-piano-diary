import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  getStartOfDayUTC,
  getEndOfDayUTC,
  getStartOfMonthUTC,
  getEndOfMonthUTC,
  fromUTC,
} from "@/lib/timezone";

// Type definitions for return values
interface DashboardData {
  totalEarnings: number;
  currentMonthEarnings: number;
  currentMonthLoss: number;
  totalStudents: number;
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
          totalStudents: 0,
        };
      }

      const timezone = ctx.session.user.timezone ?? "UTC";

      // Get current date/time in user's timezone to determine their "now" month/year
      const nowInUserTz = fromUTC(new Date(), timezone);
      const currentMonth = nowInUserTz.getMonth() + 1;
      const currentYear = nowInUserTz.getFullYear();

      // Use timezone-aware month boundaries
      const currentMonthStart = getStartOfMonthUTC(
        currentMonth,
        currentYear,
        timezone,
      );
      const currentMonthEnd = getEndOfMonthUTC(
        currentMonth,
        currentYear,
        timezone,
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

      // Get count of all students for this teacher
      const totalStudents = await ctx.db.student.count({
        where: { teacherId: teacher.id },
      });

      return {
        totalEarnings,
        currentMonthEarnings,
        currentMonthLoss,
        totalStudents,
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
      const timezone = ctx.session.user.timezone ?? "UTC";

      // Convert to proper UTC boundaries for the teacher's timezone
      const todayStart = getStartOfDayUTC(referenceDate, timezone);
      const todayEnd = getEndOfDayUTC(referenceDate, timezone);

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

      const timezone = ctx.session.user.timezone ?? "UTC";

      // Get current date/time in user's timezone to determine their "now" month/year
      const nowInUserTz = fromUTC(new Date(), timezone);
      const currentMonth = nowInUserTz.getMonth() + 1;
      const currentYear = nowInUserTz.getFullYear();

      // Use timezone-aware month boundaries
      const currentMonthStart = getStartOfMonthUTC(
        currentMonth,
        currentYear,
        timezone,
      );
      const currentMonthEnd = getEndOfMonthUTC(
        currentMonth,
        currentYear,
        timezone,
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
