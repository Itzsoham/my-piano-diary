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
  lastMonthCollected: number;
  lastMonthOutstanding: number;
}

interface StudentEarningsData {
  studentId: string;
  studentName: string;
  avatar: string | null;
  lessonCount: number;
  earnings: number;
  lessonRate: number;
}

interface TrendPoint {
  day: number;
  label: string;
  earned: number;
}

interface QuickInsightsData {
  bestDay: string;
  completed: number;
  cancelled: number;
  inactiveCount: number;
  completionRate: number;
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
          lastMonthCollected: 0,
          lastMonthOutstanding: 0,
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

      // Get Last Month boundaries
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      const lastMonthStart = getStartOfMonthUTC(
        lastMonth,
        lastMonthYear,
        timezone,
      );
      const lastMonthEnd = getEndOfMonthUTC(lastMonth, lastMonthYear, timezone);

      // Calculate total collected for last billing month (sum transactions under that month record)
      const lastMonthPaymentsForCollected = await ctx.db.paymentMonth.findMany({
        where: {
          teacherId: teacher.id,
          month: lastMonth,
          year: lastMonthYear,
        },
        include: {
          transactions: true,
        },
      });

      const lastMonthCollected = lastMonthPaymentsForCollected.reduce(
        (sum, paymentMonth) =>
          sum +
          paymentMonth.transactions.reduce((txSum, tx) => txSum + tx.amount, 0),
        0,
      );

      // Calculate outstanding for last month
      // 1. Get all completed lessons for last month to know the expected amount
      const lastMonthLessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
          status: "COMPLETE",
        },
        include: {
          student: {
            select: {
              id: true,
              lessonRate: true,
            },
          },
        },
      });

      const expectedByStudent = new Map<string, number>();
      lastMonthLessons.forEach((lesson) => {
        const current = expectedByStudent.get(lesson.studentId) ?? 0;
        expectedByStudent.set(
          lesson.studentId,
          current + lesson.student.lessonRate,
        );
      });

      // 2. Get all payment month records for last month to know received amount by student
      const lastMonthPayments = await ctx.db.paymentMonth.findMany({
        where: {
          teacherId: teacher.id,
          month: lastMonth,
          year: lastMonthYear,
        },
        include: {
          transactions: true,
        },
      });

      const receivedByStudent = new Map<string, number>();
      lastMonthPayments.forEach((pm) => {
        const received = pm.transactions.reduce((s, t) => s + t.amount, 0);
        receivedByStudent.set(pm.studentId, received);
      });

      // 3. Sum up the difference for each student
      const allStudentIds = new Set([
        ...expectedByStudent.keys(),
        ...receivedByStudent.keys(),
      ]);

      let lastMonthOutstanding = 0;
      allStudentIds.forEach((studentId) => {
        const expected = expectedByStudent.get(studentId) ?? 0;
        const received = receivedByStudent.get(studentId) ?? 0;
        const remaining = Math.max(0, expected - received);
        lastMonthOutstanding += remaining;
      });

      return {
        totalEarnings,
        currentMonthEarnings,
        currentMonthLoss,
        totalStudents,
        lastMonthCollected,
        lastMonthOutstanding,
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

  // Get top students for the current month
  getTopStudentsThisMonth: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(10).optional() })
        .optional(),
    )
    .query(async ({ ctx, input }): Promise<StudentEarningsData[]> => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return [];
      }

      const timezone = ctx.session.user.timezone ?? "UTC";
      const nowInUserTz = fromUTC(new Date(), timezone);
      const currentMonth = nowInUserTz.getMonth() + 1;
      const currentYear = nowInUserTz.getFullYear();

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

      const studentEarnings = lessons.reduce(
        (acc, lesson) => {
          const studentId = lesson.student.id;

          acc[studentId] ??= {
            studentId,
            studentName: lesson.student.name,
            avatar: lesson.student.avatar,
            lessonCount: 0,
            earnings: 0,
            lessonRate: lesson.student.lessonRate,
          };

          acc[studentId].earnings += lesson.student.lessonRate;
          acc[studentId].lessonCount += 1;

          return acc;
        },
        {} as Record<string, StudentEarningsData>,
      );

      const sorted = Object.values(studentEarnings).sort((a, b) => {
        // Primary rank: most completed classes this month.
        if (b.lessonCount !== a.lessonCount) {
          return b.lessonCount - a.lessonCount;
        }

        // Tie-breaker: alphabetical for stable order.
        return a.studentName.localeCompare(b.studentName);
      });

      return sorted.slice(0, input?.limit ?? 5);
    }),

  // Get quick insights for the dashboard panel
  getQuickInsights: protectedProcedure.query(
    async ({ ctx }): Promise<QuickInsightsData> => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return {
          bestDay: "No best day yet",
          completed: 0,
          cancelled: 0,
          inactiveCount: 0,
          completionRate: 0,
        };
      }

      const timezone = ctx.session.user.timezone ?? "UTC";
      const nowInUserTz = fromUTC(new Date(), timezone);
      const currentMonth = nowInUserTz.getMonth() + 1;
      const currentYear = nowInUserTz.getFullYear();

      const monthStart = getStartOfMonthUTC(
        currentMonth,
        currentYear,
        timezone,
      );
      const monthEnd = getEndOfMonthUTC(currentMonth, currentYear, timezone);
      const recentFrom = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const [monthLessons, recentCompletedLessons, totalStudents] =
        await Promise.all([
          ctx.db.lesson.findMany({
            where: {
              teacherId: teacher.id,
              date: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
            select: {
              status: true,
              date: true,
            },
          }),
          ctx.db.lesson.findMany({
            where: {
              teacherId: teacher.id,
              date: {
                gte: recentFrom,
                lte: new Date(),
              },
              status: "COMPLETE",
            },
            select: {
              studentId: true,
            },
          }),
          ctx.db.student.count({
            where: { teacherId: teacher.id },
          }),
        ]);

      const completed = monthLessons.filter(
        (lesson) => lesson.status === "COMPLETE",
      ).length;
      const cancelled = monthLessons.filter(
        (lesson) => lesson.status === "CANCELLED",
      ).length;
      const scheduled = monthLessons.length;

      const weekdayCounts = new Map<string, number>();
      for (const lesson of monthLessons) {
        if (lesson.status !== "COMPLETE") {
          continue;
        }

        const weekday = fromUTC(
          new Date(lesson.date),
          timezone,
        ).toLocaleDateString("en-US", { weekday: "long" });
        weekdayCounts.set(weekday, (weekdayCounts.get(weekday) ?? 0) + 1);
      }

      const bestDay =
        [...weekdayCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
        "No best day yet";

      const recentActiveIds = new Set(
        recentCompletedLessons.map((lesson) => lesson.studentId),
      );

      return {
        bestDay,
        completed,
        cancelled,
        inactiveCount: Math.max(0, totalStudents - recentActiveIds.size),
        completionRate:
          scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
      };
    },
  ),

  // Get line chart data for earnings trend in the current month
  getEarningsTrendThisMonth: protectedProcedure.query(
    async ({ ctx }): Promise<TrendPoint[]> => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return [];
      }

      const timezone = ctx.session.user.timezone ?? "UTC";
      const nowInUserTz = fromUTC(new Date(), timezone);
      const currentMonth = nowInUserTz.getMonth() + 1;
      const currentYear = nowInUserTz.getFullYear();

      const monthStart = getStartOfMonthUTC(
        currentMonth,
        currentYear,
        timezone,
      );
      const monthEnd = getEndOfMonthUTC(currentMonth, currentYear, timezone);

      const completedLessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          status: "COMPLETE",
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: {
          student: {
            select: {
              lessonRate: true,
            },
          },
        },
      });

      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const points = Array.from({ length: daysInMonth }, (_, index) => ({
        day: index + 1,
        label: String(index + 1),
        earned: 0,
      }));

      for (const lesson of completedLessons) {
        const dayInTimezone = fromUTC(
          new Date(lesson.date),
          timezone,
        ).getDate();
        const point = points[dayInTimezone - 1];
        if (!point) {
          continue;
        }

        point.earned += lesson.student.lessonRate;
      }

      return points.filter((point) => point.day <= nowInUserTz.getDate());
    },
  ),
});
