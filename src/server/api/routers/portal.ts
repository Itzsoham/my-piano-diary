import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@/env";
import {
  calculateRemaining,
  derivePaymentStatus,
  expectedByMonth,
} from "@/lib/payment";
import { parseVideoUrl } from "@/lib/practice-video";
import {
  fromUTC,
  getEndOfMonthUTC,
  getStartOfMonthUTC,
} from "@/lib/timezone";
import {
  addPracticeVideoSchema,
  deletePracticeVideoSchema,
} from "@/lib/validations/api-schemas";
import { createTRPCRouter, parentProcedure } from "@/server/api/trpc";

export const portalRouter = createTRPCRouter({
  /**
   * High-level overview for parent home:
   * - Parent info (name, email)
   * - Teacher contact info (name, image, email, timezone)
   * - Linked children details with current month payment + past overdue balance + all months summary
   * - Upcoming pending lessons (next 7 days)
   * - Studio practice video count
   */
  overview: parentProcedure.query(async ({ ctx }) => {
    const parentWithTeacher = await ctx.db.parent.findUnique({
      where: { id: ctx.parent.id },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
                email: true,
                timezone: true,
              },
            },
          },
        },
        studentLinks: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!parentWithTeacher) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Parent not found" });
    }

    const teacher = parentWithTeacher.teacher;
    const teacherTimezone = teacher.user.timezone || teacher.timezone || "UTC";
    const students = parentWithTeacher.studentLinks.map((l) => l.student);

    const parentInfo = {
      id: ctx.parent.id,
      name: ctx.session.user.name ?? "Parent",
      email: ctx.session.user.email ?? "",
    };

    if (students.length === 0) {
      return {
        parent: parentInfo,
        teacher: {
          name: teacher.user.name,
          image: teacher.user.image,
          email: teacher.user.email,
          timezone: teacherTimezone,
        },
        children: [],
        upcomingLessons: [],
        videoCount: 0,
        studioVideoCount: 0,
      };
    }

    const studentIds = students.map((s) => s.id);
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const nowInTeacherTz = fromUTC(now, teacherTimezone);
    const currentMonth = nowInTeacherTz.getMonth() + 1;
    const currentYear = nowInTeacherTz.getFullYear();

    const [
      upcomingLessons,
      completedLessons,
      paymentMonths,
      studioVideoCount,
      ownVideoCount,
    ] = await Promise.all([
      ctx.db.lesson.findMany({
        where: {
          studentId: { in: studentIds },
          status: "PENDING",
          date: { gte: now, lte: in7Days },
        },
        include: {
          student: { select: { id: true, name: true, avatar: true } },
          piece: { select: { id: true, title: true } },
        },
        orderBy: { date: "asc" },
      }),
      ctx.db.lesson.findMany({
        where: {
          studentId: { in: studentIds },
          status: "COMPLETE",
        },
        select: {
          studentId: true,
          date: true,
          rate: true,
        },
      }),
      ctx.db.paymentMonth.findMany({
        where: {
          studentId: { in: studentIds },
        },
        include: {
          transactions: { select: { amount: true } },
        },
      }),
      ctx.db.practiceVideo.count({
        where: { teacherId: ctx.parent.teacherId },
      }),
      ctx.db.practiceVideo.count({
        where: { studentId: { in: studentIds } },
      }),
    ]);

    // Group completed lessons by studentId -> Map of "year-month" -> expected
    const studentExpectedMap = new Map<string, Map<string, number>>();
    for (const sId of studentIds) {
      const studentLessons = completedLessons.filter(
        (l) => l.studentId === sId,
      );
      studentExpectedMap.set(
        sId,
        expectedByMonth(studentLessons, teacherTimezone),
      );
    }

    const childrenWithStatus = students.map((student) => {
      const expMap =
        studentExpectedMap.get(student.id) ?? new Map<string, number>();
      const studentPms = paymentMonths.filter(
        (pm) => pm.studentId === student.id,
      );

      // Collect all (year, month) pairs
      const allMonths = new Set<string>();
      for (const pm of studentPms) {
        allMonths.add(`${pm.year}-${pm.month}`);
      }
      for (const ym of expMap.keys()) {
        allMonths.add(ym);
      }
      // Always include current month
      allMonths.add(`${currentYear}-${currentMonth}`);

      const sortedMonths = Array.from(allMonths).sort((a, b) => {
        const [yA, mA] = a.split("-").map(Number);
        const [yB, mB] = b.split("-").map(Number);
        if (yA !== yB) return (yB ?? 0) - (yA ?? 0);
        return (mB ?? 0) - (mA ?? 0);
      });

      const pmByYm = new Map(
        studentPms.map((pm) => [`${pm.year}-${pm.month}`, pm]),
      );

      let previousUnpaidTotal = 0;
      const allMonthsSummary = sortedMonths.map((ym) => {
        const [year, month] = ym.split("-").map(Number);
        const pm = pmByYm.get(ym);
        const expected = expMap.get(ym) ?? 0;
        const transactions = pm?.transactions ?? [];
        const received = transactions.reduce((acc, t) => acc + t.amount, 0);
        const status = derivePaymentStatus(expected, received);
        const remaining = calculateRemaining(expected, received);

        const isPrevious =
          (year ?? 0) < currentYear ||
          ((year ?? 0) === currentYear && (month ?? 0) < currentMonth);

        if (isPrevious && remaining > 0) {
          previousUnpaidTotal += remaining;
        }

        return {
          month: month ?? 1,
          year: year ?? currentYear,
          expected,
          received,
          remaining,
          status,
          isPrevious,
        };
      });

      const currentMonthYm = `${currentYear}-${currentMonth}`;
      const currentMonthExpected = expMap.get(currentMonthYm) ?? 0;
      const currentMonthPm = pmByYm.get(currentMonthYm);
      const currentMonthReceived =
        currentMonthPm?.transactions.reduce((acc, t) => acc + t.amount, 0) ?? 0;
      const currentMonthStatus = derivePaymentStatus(
        currentMonthExpected,
        currentMonthReceived,
      );
      const currentMonthRemaining = calculateRemaining(
        currentMonthExpected,
        currentMonthReceived,
      );

      return {
        ...student,
        currentMonthPayment: {
          month: currentMonth,
          year: currentYear,
          expected: currentMonthExpected,
          received: currentMonthReceived,
          remaining: currentMonthRemaining,
          status: currentMonthStatus,
        },
        previousUnpaidTotal,
        allMonthsSummary,
      };
    });

    return {
      parent: parentInfo,
      teacher: {
        name: teacher.user.name,
        image: teacher.user.image,
        email: teacher.user.email,
        timezone: teacherTimezone,
      },
      children: childrenWithStatus,
      upcomingLessons,
      videoCount: ownVideoCount,
      studioVideoCount,
    };
  }),

  /**
   * Month-wise lessons log for linked student(s).
   * Displays all completed lessons, cancellations (with reasons), and scheduled lessons.
   */
  lessons: parentProcedure
    .input(
      z.object({
        studentId: z.string().optional(),
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(2000).max(2100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const parent = await ctx.db.parent.findUnique({
        where: { id: ctx.parent.id },
        include: {
          teacher: {
            include: {
              user: { select: { timezone: true } },
            },
          },
        },
      });

      if (!parent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Parent not found" });
      }

      const teacherTz =
        parent.teacher.user.timezone || parent.teacher.timezone || "UTC";

      const targetStudentIds = input.studentId
        ? ctx.studentIds.includes(input.studentId)
          ? [input.studentId]
          : []
        : ctx.studentIds;

      if (targetStudentIds.length === 0) {
        return {
          lessons: [],
          stats: {
            completedCount: 0,
            cancelledCount: 0,
            pendingCount: 0,
            totalCount: 0,
            totalMinutes: 0,
          },
        };
      }

      const startOfMonth = getStartOfMonthUTC(
        input.month,
        input.year,
        teacherTz,
      );
      const endOfMonth = getEndOfMonthUTC(input.month, input.year, teacherTz);

      const lessons = await ctx.db.lesson.findMany({
        where: {
          studentId: { in: targetStudentIds },
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        include: {
          student: { select: { id: true, name: true, avatar: true } },
          piece: { select: { id: true, title: true } },
        },
        orderBy: { date: "desc" },
      });

      let completedCount = 0;
      let cancelledCount = 0;
      let pendingCount = 0;
      let totalMinutes = 0;

      for (const l of lessons) {
        if (l.status === "COMPLETE") {
          completedCount += 1;
          totalMinutes += l.actualMin ?? l.duration;
        } else if (l.status === "CANCELLED") {
          cancelledCount += 1;
        } else if (l.status === "PENDING") {
          pendingCount += 1;
        }
      }

      return {
        lessons,
        stats: {
          completedCount,
          cancelledCount,
          pendingCount,
          totalCount: lessons.length,
          totalMinutes,
        },
      };
    }),

  /**
   * Payments history & dues for linked students.
   * Recalculates expected amounts from completed lessons in teacher's timezone.
   */
  payments: parentProcedure
    .input(
      z
        .object({
          all: z.boolean().optional(),
          limitMonths: z.number().int().min(1).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
    const parentWithTeacher = await ctx.db.parent.findUnique({
      where: { id: ctx.parent.id },
      include: {
        teacher: {
          include: {
            user: { select: { timezone: true } },
          },
        },
        studentLinks: {
          include: { student: true },
        },
      },
    });

    if (!parentWithTeacher) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Parent not found" });
    }

    const teacher = parentWithTeacher.teacher;
    const teacherTimezone = teacher.user.timezone || teacher.timezone || "UTC";
    const students = parentWithTeacher.studentLinks.map((l) => l.student);

    if (students.length === 0) {
      return [];
    }

    const studentIds = students.map((s) => s.id);

    // Fetch all completed lessons and payment months
    const [completedLessons, paymentMonths] = await Promise.all([
      ctx.db.lesson.findMany({
        where: {
          studentId: { in: studentIds },
          status: "COMPLETE",
        },
        select: {
          studentId: true,
          date: true,
          rate: true,
        },
      }),
      ctx.db.paymentMonth.findMany({
        where: {
          studentId: { in: studentIds },
        },
        include: {
          transactions: {
            orderBy: { date: "desc" },
          },
        },
      }),
    ]);

    // Group completed lessons by studentId -> Map of "year-month" -> expected
    const studentExpectedMap = new Map<string, Map<string, number>>();
    for (const sId of studentIds) {
      const studentLessons = completedLessons.filter(
        (l) => l.studentId === sId,
      );
      studentExpectedMap.set(
        sId,
        expectedByMonth(studentLessons, teacherTimezone),
      );
    }

    // Build per-student results
    const results = students.map((student) => {
      const expMap =
        studentExpectedMap.get(student.id) ?? new Map<string, number>();
      const studentPms = paymentMonths.filter(
        (pm) => pm.studentId === student.id,
      );

      const allMonths = new Set<string>();
      for (const pm of studentPms) {
        allMonths.add(`${pm.year}-${pm.month}`);
      }
      for (const ym of expMap.keys()) {
        allMonths.add(ym);
      }

      const sortedMonths = Array.from(allMonths).sort((a, b) => {
        const [yA, mA] = a.split("-").map(Number);
        const [yB, mB] = b.split("-").map(Number);
        if (yA !== yB) return (yB ?? 0) - (yA ?? 0);
        return (mB ?? 0) - (mA ?? 0);
      });

      const pmByYm = new Map(
        studentPms.map((pm) => [`${pm.year}-${pm.month}`, pm]),
      );

      const totalMonthsCount = sortedMonths.length;
      const showAll = input?.all ?? false;
      const limit = showAll ? undefined : (input?.limitMonths ?? 3);
      const targetMonths =
        limit !== undefined ? sortedMonths.slice(0, limit) : sortedMonths;
      const hasMore = totalMonthsCount > targetMonths.length;

      const months = targetMonths.map((ym) => {
        const [year, month] = ym.split("-").map(Number);
        const pm = pmByYm.get(ym);
        const expected = expMap.get(ym) ?? 0;
        const transactions = pm?.transactions ?? [];
        const received = transactions.reduce((acc, t) => acc + t.amount, 0);
        const status = derivePaymentStatus(expected, received);
        const remaining = calculateRemaining(expected, received);

        return {
          id: pm?.id ?? `${student.id}-${month}-${year}`,
          month: month ?? 1,
          year: year ?? 2026,
          expectedAmount: expected,
          receivedAmount: received,
          remainingAmount: remaining,
          status,
          transactions,
        };
      });

      return {
        student,
        hasMore,
        totalMonthsCount,
        months,
      };
    });

    return results;
  }),

  /**
   * Teacher's payment QR and note for parents to scan and pay.
   */
  qr: parentProcedure.query(async ({ ctx }) => {
    const teacher = await ctx.db.teacher.findUnique({
      where: { id: ctx.parent.teacherId },
      select: {
        paymentQrData: true,
        paymentQrName: true,
        paymentNote: true,
      },
    });

    return (
      teacher ?? {
        paymentQrData: null,
        paymentQrName: null,
        paymentNote: null,
      }
    );
  }),

  /**
   * Studio practice video & photo feed.
   * Allows parents to view peer practice posts from across the teacher's studio for inspiration and motivation,
   * while tagging which posts belong to their own children.
   */
  videos: parentProcedure.query(async ({ ctx }) => {
    const videos = await ctx.db.practiceVideo.findMany({
      where: {
        teacherId: ctx.parent.teacherId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        postedBy: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return videos.map((v) => ({
      ...v,
      isOwnChild: ctx.studentIds.includes(v.studentId),
      isOwnPost: v.postedById === ctx.session.user.id,
    }));
  }),

  /**
   * Post a new practice video or photo (link or Cloudinary upload).
   */
  addVideo: parentProcedure
    .input(addPracticeVideoSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.studentIds.includes(input.studentId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only post videos for your linked children",
        });
      }

      // Infer provider safely server-side
      const parsed = parseVideoUrl(
        input.url,
        env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      );

      const trimmedNote = input.note?.trim();
      const video = await ctx.db.practiceVideo.create({
        data: {
          studentId: input.studentId,
          teacherId: ctx.parent.teacherId,
          postedById: ctx.session.user.id,
          title: input.title.trim(),
          note: trimmedNote && trimmedNote.length > 0 ? trimmedNote : null,
          url: input.url.trim(),
          provider: parsed.provider,
        },
        include: {
          student: {
            select: { id: true, name: true, avatar: true },
          },
          postedBy: {
            select: { id: true, name: true, image: true, role: true },
          },
        },
      });

      return {
        ...video,
        isOwnChild: true,
        isOwnPost: true,
      };
    }),

  /**
   * Delete practice video (own posts only).
   */
  deleteVideo: parentProcedure
    .input(deletePracticeVideoSchema)
    .mutation(async ({ ctx, input }) => {
      const video = await ctx.db.practiceVideo.findFirst({
        where: {
          id: input.videoId,
        },
      });

      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Practice post not found",
        });
      }

      if (video.postedById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own practice video posts",
        });
      }

      await ctx.db.practiceVideo.delete({
        where: { id: input.videoId },
      });

      return { success: true };
    }),
});
