import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  getStartOfDayUTC,
  getEndOfDayUTC,
  getStartOfMonthUTC,
  getEndOfMonthUTC,
  fromUTC,
} from "@/lib/timezone";
import { rankByAverage, takeWithTies } from "@/lib/ranking";

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

interface StudentScoreData {
  studentId: string;
  studentName: string;
  avatar: string | null;
  avgScore: number;
  ratedCount: number;
  rank: number;
}

interface LeaderboardEntry extends StudentScoreData {
  /** Every COMPLETE lesson, rated or not — the denominator for `ratedShare`. */
  completedCount: number;
  /** Percentage of completed lessons that carry a score, 0-100. */
  ratedShare: number;
  bestScore: number;
  /** How many 1s / 2s / 3s / 4s / 5s — index 0 is score 1. */
  scoreCounts: number[];
  lastRatedAt: Date | null;
  thisMonthAvg: number | null;
  thisMonthRatedCount: number;
  /** `thisMonthAvg - avgScore`, or null when nothing was rated this month. */
  trend: number | null;
}

interface UnratedStudent {
  studentId: string;
  studentName: string;
  avatar: string | null;
  completedCount: number;
}

interface LeaderboardData {
  ranked: LeaderboardEntry[];
  /** Students with zero rated lessons — listed, never ranked at 0. */
  unrated: UnratedStudent[];
  summary: {
    studioAverage: number | null;
    ratedLessons: number;
    completedLessons: number;
    rankedStudents: number;
    totalStudents: number;
    firstRatedAt: Date | null;
  };
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
  isOnline: boolean;
  rate: number;
  cancelReason: string | null;
  pieceId: string | null;
  createdAt: Date;
  earnings: number;
  actualMin: number | null;
  note: string | null;
  score: number | null;
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

      // Get all completed lessons (rate is snapshotted per-lesson)
      const completedLessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          status: "COMPLETE",
        },
        select: {
          rate: true,
        },
      });

      // Get current month completed lessons
      const currentMonthCompletedLessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
          status: "COMPLETE",
        },
        select: {
          rate: true,
        },
      });

      // Get current month cancelled lessons
      const currentMonthCancelledLessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
          status: "CANCELLED",
        },
        select: {
          rate: true,
        },
      });

      // Calculate total earnings (all time)
      const totalEarnings = completedLessons.reduce(
        (sum, lesson) => sum + lesson.rate,
        0,
      );

      // Calculate current month earnings
      const currentMonthEarnings = currentMonthCompletedLessons.reduce(
        (sum, lesson) => sum + lesson.rate,
        0,
      );

      // Calculate current month loss from cancelled lessons
      const currentMonthLoss = currentMonthCancelledLessons.reduce(
        (sum, lesson) => sum + lesson.rate,
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
        select: {
          studentId: true,
          rate: true,
        },
      });

      const expectedByStudent = new Map<string, number>();
      lastMonthLessons.forEach((lesson) => {
        const current = expectedByStudent.get(lesson.studentId) ?? 0;
        expectedByStudent.set(lesson.studentId, current + lesson.rate);
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
        earnings: lesson.status !== "CANCELLED" ? lesson.rate : 0,
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
          const earnings = lesson.rate;

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

  // Get top students for the current month, ranked by average lesson score.
  // Only RATED lessons count — unrated ones (old data, or a lesson the
  // teacher deliberately left unscored) never factor into the average, and a
  // student with zero rated lessons doesn't appear on the board at all.
  // `limit` is a floor, not a ceiling: takeWithTies may return more so the
  // cut never separates two students with the same average.
  getTopStudentsThisMonth: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(10).optional() })
        .optional(),
    )
    .query(async ({ ctx, input }): Promise<StudentScoreData[]> => {
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
          score: { not: null },
        },
        select: {
          score: true,
          student: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      const studentScores = lessons.reduce(
        (acc, lesson) => {
          if (lesson.score == null) {
            return acc;
          }

          const studentId = lesson.student.id;

          acc[studentId] ??= {
            studentId,
            studentName: lesson.student.name,
            avatar: lesson.student.avatar,
            scoreSum: 0,
            ratedCount: 0,
          };

          acc[studentId].scoreSum += lesson.score;
          acc[studentId].ratedCount += 1;

          return acc;
        },
        {} as Record<
          string,
          {
            studentId: string;
            studentName: string;
            avatar: string | null;
            scoreSum: number;
            ratedCount: number;
          }
        >,
      );

      // Rank rules live in @/lib/ranking so this board and the all-time
      // /leaderboard can never drift apart: exact-average comparison, ties
      // share a rank, and the cut never lands inside a tie group.
      const ranked = rankByAverage(Object.values(studentScores)).map(
        (entry): StudentScoreData => ({
          studentId: entry.studentId,
          studentName: entry.studentName,
          avatar: entry.avatar,
          avgScore: entry.avgScore,
          ratedCount: entry.ratedCount,
          rank: entry.rank,
        }),
      );

      return takeWithTies(ranked, input?.limit ?? 5);
    }),

  // All-time board behind the dashboard card: every student the teacher has
  // ever rated, plus the context that makes an average readable (how many
  // lessons it rests on, the score spread, how this month compares).
  getStudentLeaderboard: protectedProcedure.query(
    async ({ ctx }): Promise<LeaderboardData> => {
      const emptyResult: LeaderboardData = {
        ranked: [],
        unrated: [],
        summary: {
          studioAverage: null,
          ratedLessons: 0,
          completedLessons: 0,
          rankedStudents: 0,
          totalStudents: 0,
          firstRatedAt: null,
        },
      };

      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return emptyResult;
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

      const [students, lessons] = await Promise.all([
        ctx.db.student.findMany({
          where: { teacherId: teacher.id },
          select: { id: true, name: true, avatar: true },
        }),
        ctx.db.lesson.findMany({
          where: { teacherId: teacher.id, status: "COMPLETE" },
          select: { score: true, date: true, studentId: true },
          // Ascending so the last rated lesson we visit per student is also
          // the most recent one — no extra max() pass for `lastRatedAt`.
          orderBy: { date: "asc" },
        }),
      ]);

      type Bucket = {
        studentId: string;
        studentName: string;
        avatar: string | null;
        scoreSum: number;
        ratedCount: number;
        completedCount: number;
        bestScore: number;
        scoreCounts: number[];
        lastRatedAt: Date | null;
        monthScoreSum: number;
        monthRatedCount: number;
      };

      const buckets = new Map<string, Bucket>(
        students.map((student) => [
          student.id,
          {
            studentId: student.id,
            studentName: student.name,
            avatar: student.avatar,
            scoreSum: 0,
            ratedCount: 0,
            completedCount: 0,
            bestScore: 0,
            scoreCounts: [0, 0, 0, 0, 0],
            lastRatedAt: null,
            monthScoreSum: 0,
            monthRatedCount: 0,
          },
        ]),
      );

      let ratedLessons = 0;
      let ratedScoreSum = 0;
      let firstRatedAt: Date | null = null;

      for (const lesson of lessons) {
        const bucket = buckets.get(lesson.studentId);
        if (!bucket) {
          continue;
        }

        bucket.completedCount += 1;

        const score = lesson.score;
        if (score == null) {
          continue;
        }

        bucket.scoreSum += score;
        bucket.ratedCount += 1;
        bucket.bestScore = Math.max(bucket.bestScore, score);
        bucket.lastRatedAt = lesson.date;

        const slot = score - 1;
        if (slot >= 0 && slot < bucket.scoreCounts.length) {
          bucket.scoreCounts[slot] = (bucket.scoreCounts[slot] ?? 0) + 1;
        }

        if (lesson.date >= monthStart && lesson.date <= monthEnd) {
          bucket.monthScoreSum += score;
          bucket.monthRatedCount += 1;
        }

        ratedLessons += 1;
        ratedScoreSum += score;
        firstRatedAt ??= lesson.date;
      }

      const allBuckets = [...buckets.values()];

      const ranked = rankByAverage(allBuckets).map(
        (entry): LeaderboardEntry => {
          const thisMonthAvg =
            entry.monthRatedCount > 0
              ? Math.round(
                  (entry.monthScoreSum / entry.monthRatedCount) * 100,
                ) / 100
              : null;

          return {
            studentId: entry.studentId,
            studentName: entry.studentName,
            avatar: entry.avatar,
            avgScore: entry.avgScore,
            ratedCount: entry.ratedCount,
            rank: entry.rank,
            completedCount: entry.completedCount,
            ratedShare:
              entry.completedCount > 0
                ? Math.round((entry.ratedCount / entry.completedCount) * 100)
                : 0,
            bestScore: entry.bestScore,
            scoreCounts: entry.scoreCounts,
            lastRatedAt: entry.lastRatedAt,
            thisMonthAvg,
            thisMonthRatedCount: entry.monthRatedCount,
            trend:
              thisMonthAvg === null
                ? null
                : Math.round((thisMonthAvg - entry.avgScore) * 100) / 100,
          };
        },
      );

      const unrated = allBuckets
        .filter((bucket) => bucket.ratedCount === 0)
        .sort(
          (a, b) =>
            b.completedCount - a.completedCount ||
            a.studentName.localeCompare(b.studentName),
        )
        .map(
          (bucket): UnratedStudent => ({
            studentId: bucket.studentId,
            studentName: bucket.studentName,
            avatar: bucket.avatar,
            completedCount: bucket.completedCount,
          }),
        );

      return {
        ranked,
        unrated,
        summary: {
          studioAverage:
            ratedLessons > 0
              ? Math.round((ratedScoreSum / ratedLessons) * 100) / 100
              : null,
          ratedLessons,
          completedLessons: lessons.length,
          rankedStudents: ranked.length,
          totalStudents: students.length,
          firstRatedAt,
        },
      };
    },
  ),

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
        select: {
          date: true,
          rate: true,
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

        point.earned += lesson.rate;
      }

      return points.filter((point) => point.day <= nowInUserTz.getDate());
    },
  ),
});
