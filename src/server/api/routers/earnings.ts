import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

// Type definitions for return values
interface DashboardData {
  totalEarnings: number;
  currentMonthEarnings: number;
  currentMonthLoss: number;
  hourlyRate: number;
}

interface StudentEarningsData {
  studentId: string;
  studentName: string;
  avatar: string | null;
  totalMinutes: number;
  earnings: number;
  lessonCount: number;
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
          hourlyRate: 0,
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

      // Get all completed and makeup lessons
      const completedLessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          status: {
            in: ["COMPLETE", "MAKEUP"],
          },
        },
        select: {
          duration: true,
        },
      });

      // Get current month completed and makeup lessons
      const currentMonthCompletedLessons = await ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
          status: {
            in: ["COMPLETE", "MAKEUP"],
          },
        },
        select: {
          duration: true,
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
          duration: true,
        },
      });

      // Calculate total earnings (all time)
      const totalMinutes = completedLessons.reduce(
        (sum, lesson) => sum + lesson.duration,
        0,
      );
      const totalEarnings = (totalMinutes / 60) * teacher.hourlyRate;

      // Calculate current month earnings
      const currentMonthMinutes = currentMonthCompletedLessons.reduce(
        (sum, lesson) => sum + lesson.duration,
        0,
      );
      const currentMonthEarnings =
        (currentMonthMinutes / 60) * teacher.hourlyRate;

      // Calculate current month loss from cancelled lessons
      const cancelledMinutes = currentMonthCancelledLessons.reduce(
        (sum, lesson) => sum + lesson.duration,
        0,
      );
      const currentMonthLoss = (cancelledMinutes / 60) * teacher.hourlyRate;

      return {
        totalEarnings,
        currentMonthEarnings,
        currentMonthLoss,
        hourlyRate: teacher.hourlyRate,
      };
    },
  ),

  // Get today's lessons with earnings
  getTodayLessons: protectedProcedure.query(
    async ({ ctx }): Promise<TodayLesson[]> => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return [];
      }

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
      );
      const todayEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
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
        earnings:
          lesson.status !== "CANCELLED"
            ? (lesson.duration / 60) * teacher.hourlyRate
            : 0,
      }));
    },
  ),

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
          status: {
            in: ["COMPLETE", "MAKEUP"],
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
        },
      });

      // Group by student and calculate earnings
      const studentEarnings = lessons.reduce(
        (acc, lesson) => {
          const studentId = lesson.student.id;
          const earnings = (lesson.duration / 60) * teacher.hourlyRate;

          acc[studentId] ??= {
            studentId,
            studentName: lesson.student.name,
            avatar: lesson.student.avatar,
            totalMinutes: 0,
            earnings: 0,
            lessonCount: 0,
          };

          acc[studentId].totalMinutes += lesson.duration;
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
            totalMinutes: number;
            earnings: number;
            lessonCount: number;
          }
        >,
      );

      return Object.values(studentEarnings).sort(
        (a, b) => b.earnings - a.earnings,
      );
    },
  ),
});
