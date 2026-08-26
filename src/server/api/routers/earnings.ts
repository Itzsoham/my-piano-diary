import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  getStartOfDayUTC,
  getEndOfDayUTC,
  getStartOfMonthUTC,
  getEndOfMonthUTC,
  fromUTC,
} from "@/lib/timezone";
import {
  compareMonthScopeDesc,
  monthScopeKey,
  previousMonthScope,
  type MonthScope,
} from "@/lib/month-scope";
import { rankByAverage, takeWithTies } from "@/lib/ranking";

/**
 * Every month-scoped board here takes the same optional `{ month, year }`.
 * Omit it and the procedure answers for the teacher's *current* month, exactly
 * as it did before the month picker existed — so a caller that only ever wants
 * "now" never has to compute a month, and the timezone maths stays server-side
 * where the teacher's IANA zone actually lives.
 */
const monthScopeInput = z
  .object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000).max(2100),
  })
  .optional();

type ResolvedMonth = MonthScope & {
  /** UTC instant of the first millisecond of the month in the teacher's zone. */
  start: Date;
  /** UTC instant of the last millisecond of the month in the teacher's zone. */
  end: Date;
  isCurrentMonth: boolean;
  /** A month that has not started yet — reachable only by a hand-edited URL. */
  isFuture: boolean;
  /**
   * Days of the month that have actually happened: the whole month once it is
   * over, today's date while it is running, and zero before it begins. The cut
   * for anything that would otherwise draw a not-yet-lived day as an empty one.
   */
  elapsedDays: number;
  /** "Now" as a wall clock in the teacher's zone. */
  nowInUserTz: Date;
};

function resolveMonth(timezone: string, scope?: MonthScope): ResolvedMonth {
  const nowInUserTz = fromUTC(new Date(), timezone);
  const currentMonth = nowInUserTz.getMonth() + 1;
  const currentYear = nowInUserTz.getFullYear();

  const month = scope?.month ?? currentMonth;
  const year = scope?.year ?? currentYear;

  const isCurrentMonth = month === currentMonth && year === currentYear;
  const isFuture =
    year > currentYear || (year === currentYear && month > currentMonth);
  const daysInMonth = new Date(year, month, 0).getDate();

  return {
    month,
    year,
    start: getStartOfMonthUTC(month, year, timezone),
    end: getEndOfMonthUTC(month, year, timezone),
    isCurrentMonth,
    isFuture,
    elapsedDays: isCurrentMonth
      ? nowInUserTz.getDate()
      : isFuture
        ? 0
        : daysInMonth,
    nowInUserTz,
  };
}

const withinMonth = (date: Date, { start, end }: { start: Date; end: Date }) =>
  date >= start && date <= end;

// Type definitions for return values
interface DashboardData {
  /** The month these figures describe — echoed back so the UI can label them. */
  month: number;
  year: number;
  isCurrentMonth: boolean;
  /** All-time billed revenue. Never month-scoped. */
  totalEarnings: number;
  totalStudents: number;
  /** COMPLETE lessons dated inside the selected month. */
  monthEarnings: number;
  /** CANCELLED lessons dated inside the selected month — revenue not billed. */
  monthLoss: number;
  /** Transactions recorded against the selected billing month. */
  monthCollected: number;
  /** Expected minus received for the selected billing month, floored at 0. */
  monthOutstanding: number;
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
  /** Every COMPLETE lesson in scope, rated or not — `ratedShare`'s denominator. */
  completedCount: number;
  /** Percentage of completed lessons that carry a score, 0-100. */
  ratedShare: number;
  bestScore: number;
  /** How many 1s / 2s / 3s / 4s / 5s — index 0 is score 1. */
  scoreCounts: number[];
  lastRatedAt: Date | null;
  /**
   * Average over the comparison window described by `summary.comparison` —
   * this month when the board is all-time, the previous month when the board
   * is scoped to a single month.
   */
  comparisonAvg: number | null;
  comparisonRatedCount: number;
  /**
   * Which way the student is moving. On an all-time board that is this month
   * against the all-time average; on a month board, the selected month against
   * the month before it. Null when the comparison window holds no rated lesson.
   */
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
  /** Students with zero rated lessons in scope — listed, never ranked at 0. */
  unrated: UnratedStudent[];
  summary: {
    studioAverage: number | null;
    ratedLessons: number;
    completedLessons: number;
    rankedStudents: number;
    totalStudents: number;
    firstRatedAt: Date | null;
    /** Null when the board covers every rated lesson ever. */
    scope: MonthScope | null;
    isCurrentMonth: boolean;
    /** What `entry.trend` is measured against, so the UI can name it. */
    comparison:
      | { kind: "this-month" }
      | { kind: "previous-month"; month: number; year: number };
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
  /**
   * Names the window `inactiveCount` was counted over. The current month asks
   * "who has gone quiet lately" (a rolling 14 days); a past month can only ask
   * "who never showed up that month", and the copy has to say which.
   */
  inactiveLabel: string;
  completionRate: number;
}

/** One month the teacher actually has lessons in — a month picker's option. */
interface ActivityMonth extends MonthScope {
  lessons: number;
  rated: number;
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
  // Get earnings dashboard data for one month (defaults to the current one)
  getDashboard: protectedProcedure
    .input(monthScopeInput)
    .query(async ({ ctx, input }): Promise<DashboardData> => {
      const timezone = ctx.session.user.timezone ?? "UTC";
      const month = resolveMonth(timezone, input);

      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return {
          month: month.month,
          year: month.year,
          isCurrentMonth: month.isCurrentMonth,
          totalEarnings: 0,
          totalStudents: 0,
          monthEarnings: 0,
          monthLoss: 0,
          monthCollected: 0,
          monthOutstanding: 0,
        };
      }

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

      // Get the selected month's completed lessons
      const monthCompletedLessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: month.start,
            lte: month.end,
          },
          status: "COMPLETE",
        },
        select: {
          studentId: true,
          rate: true,
        },
      });

      // Get the selected month's cancelled lessons
      const monthCancelledLessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: month.start,
            lte: month.end,
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

      // Calculate the selected month's earnings
      const monthEarnings = monthCompletedLessons.reduce(
        (sum, lesson) => sum + lesson.rate,
        0,
      );

      // Calculate the selected month's loss from cancelled lessons
      const monthLoss = monthCancelledLessons.reduce(
        (sum, lesson) => sum + lesson.rate,
        0,
      );

      // Get count of all students for this teacher
      const totalStudents = await ctx.db.student.count({
        where: { teacherId: teacher.id },
      });

      // Payment months are keyed by month/year rather than by lesson date, so
      // the billing month the teacher is looking at *is* the selected month.
      const monthPayments = await ctx.db.paymentMonth.findMany({
        where: {
          teacherId: teacher.id,
          month: month.month,
          year: month.year,
        },
        include: {
          transactions: true,
        },
      });

      const monthCollected = monthPayments.reduce(
        (sum, paymentMonth) =>
          sum +
          paymentMonth.transactions.reduce((txSum, tx) => txSum + tx.amount, 0),
        0,
      );

      // Outstanding = what each student was billed for the month minus what
      // they have actually paid against it. Floored per student, so one
      // family's overpayment never cancels out another family's arrears.
      const expectedByStudent = new Map<string, number>();
      monthCompletedLessons.forEach((lesson) => {
        const current = expectedByStudent.get(lesson.studentId) ?? 0;
        expectedByStudent.set(lesson.studentId, current + lesson.rate);
      });

      const receivedByStudent = new Map<string, number>();
      monthPayments.forEach((pm) => {
        const received = pm.transactions.reduce((s, t) => s + t.amount, 0);
        receivedByStudent.set(pm.studentId, received);
      });

      const allStudentIds = new Set([
        ...expectedByStudent.keys(),
        ...receivedByStudent.keys(),
      ]);

      let monthOutstanding = 0;
      allStudentIds.forEach((studentId) => {
        const expected = expectedByStudent.get(studentId) ?? 0;
        const received = receivedByStudent.get(studentId) ?? 0;
        monthOutstanding += Math.max(0, expected - received);
      });

      return {
        month: month.month,
        year: month.year,
        isCurrentMonth: month.isCurrentMonth,
        totalEarnings,
        totalStudents,
        monthEarnings,
        monthLoss,
        monthCollected,
        monthOutstanding,
      };
    }),

  /**
   * Every month the teacher has lessons in, newest first — the option list
   * behind both month pickers. The current month is always present, even in a
   * brand-new studio, so the picker can always offer the way back home.
   *
   * Months later than the current one are dropped even when they already hold
   * scheduled lessons: every board these pickers drive reports on what has
   * happened (revenue billed, lessons taught, scores given), so a future month
   * could only ever render as a completed month of zeros.
   */
  getActivityMonths: protectedProcedure.query(
    async ({ ctx }): Promise<ActivityMonth[]> => {
      const timezone = ctx.session.user.timezone ?? "UTC";
      const nowInUserTz = fromUTC(new Date(), timezone);
      const current: MonthScope = {
        month: nowInUserTz.getMonth() + 1,
        year: nowInUserTz.getFullYear(),
      };

      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return [{ ...current, lessons: 0, rated: 0 }];
      }

      const lessons = await ctx.db.lesson.findMany({
        where: { teacherId: teacher.id },
        select: { date: true, status: true, score: true },
      });

      const months = new Map<string, ActivityMonth>();
      const ensure = (scope: MonthScope) => {
        const key = monthScopeKey(scope);
        const existing = months.get(key);
        if (existing) return existing;

        const created: ActivityMonth = { ...scope, lessons: 0, rated: 0 };
        months.set(key, created);
        return created;
      };

      ensure(current);

      for (const lesson of lessons) {
        // Bucket by the teacher's wall clock, not by UTC — a 23:30 lesson on
        // the last of the month belongs to that month for the teacher,
        // whatever the stored UTC date rolls over to.
        const zoned = fromUTC(lesson.date, timezone);
        const scope = {
          month: zoned.getMonth() + 1,
          year: zoned.getFullYear(),
        };

        // compareMonthScopeDesc orders newest first, so a negative result puts
        // `scope` ahead of `current` — meaning it has not happened yet.
        if (compareMonthScopeDesc(scope, current) < 0) {
          continue;
        }

        const bucket = ensure(scope);

        bucket.lessons += 1;
        if (lesson.status === "COMPLETE" && lesson.score != null) {
          bucket.rated += 1;
        }
      }

      return [...months.values()].sort(compareMonthScopeDesc);
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

  // Get earnings by student for one month (defaults to the current one)
  getByStudent: protectedProcedure
    .input(monthScopeInput)
    .query(async ({ ctx, input }): Promise<StudentEarningsData[]> => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return [];
      }

      const timezone = ctx.session.user.timezone ?? "UTC";
      const month = resolveMonth(timezone, input);

      const lessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: month.start,
            lte: month.end,
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
    }),

  // Top students for one month, ranked by average lesson score. Only RATED
  // lessons count — unrated ones (old data, or a lesson the teacher
  // deliberately left unscored) never factor into the average, and a student
  // with zero rated lessons doesn't appear on the board at all.
  // `limit` is a floor, not a ceiling: takeWithTies may return more so the
  // cut never separates two students with the same average.
  getTopStudentsForMonth: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(10).optional(),
          month: z.number().int().min(1).max(12).optional(),
          year: z.number().int().min(2000).max(2100).optional(),
        })
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
      const month = resolveMonth(
        timezone,
        input?.month != null && input?.year != null
          ? { month: input.month, year: input.year }
          : undefined,
      );

      const lessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: month.start,
            lte: month.end,
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

      // Rank rules live in @/lib/ranking so this board and the /leaderboard
      // page can never drift apart: exact-average comparison, ties share a
      // rank, and the cut never lands inside a tie group.
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

  // The board behind the dashboard card: every student the teacher has rated,
  // plus the context that makes an average readable (how many lessons it rests
  // on, the score spread, which way it is moving).
  //
  // With no input the board is all-time and `trend` reads "this month against
  // your all-time average". Pass a month and the whole board narrows to it —
  // averages, ranks, counts and spread are that month's alone — and `trend`
  // switches to "this month against the month before", the only honest
  // comparison once the all-time average is out of frame.
  getStudentLeaderboard: protectedProcedure
    .input(monthScopeInput)
    .query(async ({ ctx, input }): Promise<LeaderboardData> => {
      const timezone = ctx.session.user.timezone ?? "UTC";
      const month = resolveMonth(timezone, input);
      const isScoped = input != null;

      const previous = previousMonthScope({
        month: month.month,
        year: month.year,
      });

      // Where `trend` is measured. All-time board: the current month against
      // the all-time average. Month board: the month before the selected one.
      const comparisonWindow = isScoped
        ? {
            start: getStartOfMonthUTC(previous.month, previous.year, timezone),
            end: getEndOfMonthUTC(previous.month, previous.year, timezone),
          }
        : { start: month.start, end: month.end };

      const scope = isScoped ? { month: month.month, year: month.year } : null;

      const comparison: LeaderboardData["summary"]["comparison"] = isScoped
        ? {
            kind: "previous-month",
            month: previous.month,
            year: previous.year,
          }
        : { kind: "this-month" };

      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return {
          ranked: [],
          unrated: [],
          summary: {
            studioAverage: null,
            ratedLessons: 0,
            completedLessons: 0,
            rankedStudents: 0,
            totalStudents: 0,
            firstRatedAt: null,
            scope,
            isCurrentMonth: month.isCurrentMonth,
            comparison,
          },
        };
      }

      const [students, lessons] = await Promise.all([
        ctx.db.student.findMany({
          where: { teacherId: teacher.id },
          select: { id: true, name: true, avatar: true },
        }),
        ctx.db.lesson.findMany({
          where: {
            teacherId: teacher.id,
            status: "COMPLETE",
            // A month board still needs the month before it to compute the
            // trend, so the fetch spans both windows and the loop below
            // separates them. The all-time board fetches everything, as ever.
            ...(isScoped
              ? { date: { gte: comparisonWindow.start, lte: month.end } }
              : {}),
          },
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
        comparisonScoreSum: number;
        comparisonRatedCount: number;
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
            comparisonScoreSum: 0,
            comparisonRatedCount: 0,
          },
        ]),
      );

      let ratedLessons = 0;
      let ratedScoreSum = 0;
      let completedLessons = 0;
      let firstRatedAt: Date | null = null;

      for (const lesson of lessons) {
        const bucket = buckets.get(lesson.studentId);
        if (!bucket) {
          continue;
        }

        const score = lesson.score;

        // The comparison window is tallied first because on a month board it
        // sits *outside* the board's own scope — those lessons contribute the
        // trend and nothing else.
        if (score != null && withinMonth(lesson.date, comparisonWindow)) {
          bucket.comparisonScoreSum += score;
          bucket.comparisonRatedCount += 1;
        }

        if (isScoped && !withinMonth(lesson.date, month)) {
          continue;
        }

        bucket.completedCount += 1;
        completedLessons += 1;

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

        ratedLessons += 1;
        ratedScoreSum += score;
        firstRatedAt ??= lesson.date;
      }

      const allBuckets = [...buckets.values()];

      const ranked = rankByAverage(allBuckets).map(
        (entry): LeaderboardEntry => {
          const comparisonAvg =
            entry.comparisonRatedCount > 0
              ? Math.round(
                  (entry.comparisonScoreSum / entry.comparisonRatedCount) * 100,
                ) / 100
              : null;

          // Sign convention is the same either way: positive means the newer
          // of the two windows is the better one.
          const trend =
            comparisonAvg === null
              ? null
              : isScoped
                ? Math.round((entry.avgScore - comparisonAvg) * 100) / 100
                : Math.round((comparisonAvg - entry.avgScore) * 100) / 100;

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
            comparisonAvg,
            comparisonRatedCount: entry.comparisonRatedCount,
            trend,
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
          completedLessons,
          rankedStudents: ranked.length,
          totalStudents: students.length,
          firstRatedAt,
          scope,
          isCurrentMonth: month.isCurrentMonth,
          comparison,
        },
      };
    }),

  // Get quick insights for one month (defaults to the current one)
  getQuickInsights: protectedProcedure
    .input(monthScopeInput)
    .query(async ({ ctx, input }): Promise<QuickInsightsData> => {
      const timezone = ctx.session.user.timezone ?? "UTC";
      const month = resolveMonth(timezone, input);

      // The rolling window only means something while the month is running.
      // Looking back at June, "not seen in 14 days" would be measured from
      // today — a number about now, printed on a card about June.
      const inactiveLabel = month.isCurrentMonth
        ? "in the last 14 days"
        : "that month";

      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return {
          bestDay: "No best day yet",
          completed: 0,
          cancelled: 0,
          inactiveCount: 0,
          inactiveLabel,
          completionRate: 0,
        };
      }

      const recentFrom = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const [monthLessons, recentCompletedLessons, totalStudents] =
        await Promise.all([
          ctx.db.lesson.findMany({
            where: {
              teacherId: teacher.id,
              date: {
                gte: month.start,
                lte: month.end,
              },
            },
            select: {
              status: true,
              date: true,
              studentId: true,
            },
          }),
          month.isCurrentMonth
            ? ctx.db.lesson.findMany({
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
              })
            : Promise.resolve([]),
          // Only students who already existed by the end of the month can be
          // said to have skipped it — counting everyone on the roster today
          // would bill a student who joined in August as a no-show for June.
          ctx.db.student.count({
            where: {
              teacherId: teacher.id,
              createdAt: { lte: month.end },
            },
          }),
        ]);

      const completedLessons = monthLessons.filter(
        (lesson) => lesson.status === "COMPLETE",
      );
      const completed = completedLessons.length;
      const cancelled = monthLessons.filter(
        (lesson) => lesson.status === "CANCELLED",
      ).length;
      const scheduled = monthLessons.length;

      const weekdayCounts = new Map<string, number>();
      for (const lesson of completedLessons) {
        const weekday = fromUTC(
          new Date(lesson.date),
          timezone,
        ).toLocaleDateString("en-US", { weekday: "long" });
        weekdayCounts.set(weekday, (weekdayCounts.get(weekday) ?? 0) + 1);
      }

      const bestDay =
        [...weekdayCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
        "No best day yet";

      const activeIds = new Set(
        (month.isCurrentMonth ? recentCompletedLessons : completedLessons).map(
          (lesson) => lesson.studentId,
        ),
      );

      return {
        bestDay,
        completed,
        cancelled,
        inactiveCount: Math.max(0, totalStudents - activeIds.size),
        inactiveLabel,
        completionRate:
          scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
      };
    }),

  // Daily billed revenue across one month (defaults to the current one)
  getEarningsTrendForMonth: protectedProcedure
    .input(monthScopeInput)
    .query(async ({ ctx, input }): Promise<TrendPoint[]> => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return [];
      }

      const timezone = ctx.session.user.timezone ?? "UTC";
      const month = resolveMonth(timezone, input);

      const completedLessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          status: "COMPLETE",
          date: {
            gte: month.start,
            lte: month.end,
          },
        },
        select: {
          date: true,
          rate: true,
        },
      });

      const daysInMonth = new Date(month.year, month.month, 0).getDate();
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

      // Only days that have happened are plotted — a flat line across days
      // still to come reads as "you earned nothing", not "not yet". A finished
      // month is drawn end to end; a month that has not started is empty.
      return points.filter((point) => point.day <= month.elapsedDays);
    }),
});
