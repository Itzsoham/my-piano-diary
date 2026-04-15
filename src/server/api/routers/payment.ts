import { type PrismaClient } from "@prisma/client";

import { calculateRemaining, derivePaymentStatus } from "@/lib/payment";
import {
  createDateInTimezone,
  fromUTC,
  getEndOfMonthUTC,
  getStartOfMonthUTC,
} from "@/lib/timezone";
import {
  addPaymentTransactionSchema,
  deletePaymentTransactionSchema,
  getPaymentForMonthSchema,
  getPaymentStudentHistorySchema,
  getPaymentUnpaidSummarySchema,
  updatePaymentTransactionSchema,
} from "@/lib/validations/api-schemas";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

type StudentSummary = {
  id: string;
  name: string;
  avatar: string | null;
  lessonRate: number;
};

type PaymentRow = {
  id: string;
  studentId: string;
  teacherId: string;
  month: number;
  year: number;
  expectedAmount: number;
  createdAt: Date;
  updatedAt: Date;
  student: StudentSummary;
  transactions: Array<{
    id: string;
    paymentMonthId: string;
    studentId: string;
    teacherId: string;
    amount: number;
    method: string | null;
    note: string | null;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
  }>;
  receivedAmount: number;
  remainingAmount: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
};

const getTeacherOrThrow = async (db: PrismaClient, userId: string) => {
  const teacher = await db.teacher.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  return teacher;
};

const parseDateOnlyToUTC = (dateValue: string, timezone: string): Date => {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error("Invalid payment date format");
  }

  return createDateInTimezone(year, month - 1, day, 0, 0, timezone);
};

const normalizePaymentDateInput = (
  dateInput: Date | string | undefined,
  timezone: string,
): Date | undefined => {
  if (dateInput === undefined) {
    return undefined;
  }

  if (typeof dateInput === "string") {
    return parseDateOnlyToUTC(dateInput, timezone);
  }

  return dateInput;
};

const buildMonthPaymentRows = async ({
  db,
  teacherId,
  timezone,
  month,
  year,
  studentId,
}: {
  db: PrismaClient;
  teacherId: string;
  timezone: string;
  month: number;
  year: number;
  studentId?: string;
}): Promise<PaymentRow[]> => {
  const startDate = getStartOfMonthUTC(month, year, timezone);
  const endDate = getEndOfMonthUTC(month, year, timezone);

  const students = await db.student.findMany({
    where: {
      teacherId,
      ...(studentId ? { id: studentId } : {}),
    },
    select: {
      id: true,
      name: true,
      avatar: true,
      lessonRate: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  if (studentId && students.length === 0) {
    throw new Error("Student not found");
  }

  if (students.length === 0) {
    return [];
  }

  const studentIds = students.map((student) => student.id);

  const [lessonCounts, paymentMonths] = await Promise.all([
    db.lesson.groupBy({
      by: ["studentId"],
      where: {
        teacherId,
        studentId: { in: studentIds },
        status: "COMPLETE",
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        _all: true,
      },
    }),
    db.paymentMonth.findMany({
      where: {
        teacherId,
        studentId: { in: studentIds },
        month,
        year,
      },
      include: {
        transactions: {
          orderBy: {
            date: "desc",
          },
        },
      },
    }),
  ]);

  const lessonCountByStudent = new Map(
    lessonCounts.map((entry) => [entry.studentId, entry._count._all]),
  );

  const paymentMonthByStudent = new Map(
    paymentMonths.map((paymentMonth) => [paymentMonth.studentId, paymentMonth]),
  );

  const rows: PaymentRow[] = [];
  const fallbackTimestamp = new Date(0);

  for (const student of students) {
    const completedLessonCount = lessonCountByStudent.get(student.id) ?? 0;
    const expectedAmount = completedLessonCount * student.lessonRate;
    const existingPaymentMonth = paymentMonthByStudent.get(student.id);

    if (!existingPaymentMonth && expectedAmount <= 0 && !studentId) {
      continue;
    }

    const transactions = existingPaymentMonth?.transactions ?? [];

    const receivedAmount = transactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    );

    rows.push({
      id: existingPaymentMonth?.id ?? `${student.id}-${month}-${year}`,
      studentId: student.id,
      teacherId,
      month,
      year,
      expectedAmount,
      createdAt: existingPaymentMonth?.createdAt ?? fallbackTimestamp,
      updatedAt: existingPaymentMonth?.updatedAt ?? fallbackTimestamp,
      student,
      transactions,
      receivedAmount,
      remainingAmount: calculateRemaining(expectedAmount, receivedAmount),
      status: derivePaymentStatus(expectedAmount, receivedAmount),
    });
  }

  return rows;
};

export const paymentRouter = createTRPCRouter({
  getOverallSummary: protectedProcedure.query(async ({ ctx }) => {
    const teacher = await getTeacherOrThrow(ctx.db, ctx.session.user.id);

    const [students, completedLessonsByStudent, receivedByStudent] =
      await Promise.all([
        ctx.db.student.findMany({
          where: {
            teacherId: teacher.id,
          },
          select: {
            id: true,
            lessonRate: true,
          },
        }),
        ctx.db.lesson.groupBy({
          by: ["studentId"],
          where: {
            teacherId: teacher.id,
            status: "COMPLETE",
          },
          _count: {
            _all: true,
          },
        }),
        ctx.db.paymentTransaction.groupBy({
          by: ["studentId"],
          where: {
            teacherId: teacher.id,
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

    const lessonCountByStudent = new Map(
      completedLessonsByStudent.map((entry) => [
        entry.studentId,
        entry._count._all,
      ]),
    );
    const receivedAmountByStudent = new Map(
      receivedByStudent.map((entry) => [
        entry.studentId,
        entry._sum.amount ?? 0,
      ]),
    );

    let totalExpected = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;

    for (const student of students) {
      const lessonCount = lessonCountByStudent.get(student.id) ?? 0;
      const expected = lessonCount * student.lessonRate;
      const received = receivedAmountByStudent.get(student.id) ?? 0;

      totalExpected += expected;
      totalReceived += received;
      totalOutstanding += calculateRemaining(expected, received);
    }

    return {
      totalExpected,
      totalReceived,
      totalOutstanding,
      studentCount: students.length,
    };
  }),

  getForMonth: protectedProcedure
    .input(getPaymentForMonthSchema)
    .query(async ({ ctx, input }) => {
      const teacher = await getTeacherOrThrow(ctx.db, ctx.session.user.id);
      const timezone = ctx.session.user.timezone ?? "UTC";

      const rows = await buildMonthPaymentRows({
        db: ctx.db,
        teacherId: teacher.id,
        timezone,
        month: input.month,
        year: input.year,
        studentId: input.studentId,
      });

      if (!input.status) {
        return rows;
      }

      return rows.filter((row) => row.status === input.status);
    }),

  addTransaction: protectedProcedure
    .input(addPaymentTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const teacher = await getTeacherOrThrow(ctx.db, ctx.session.user.id);
      const timezone = ctx.session.user.timezone ?? "UTC";

      const student = await ctx.db.student.findFirst({
        where: { id: input.studentId, teacherId: teacher.id },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      const startDate = getStartOfMonthUTC(input.month, input.year, timezone);
      const endDate = getEndOfMonthUTC(input.month, input.year, timezone);

      const completedCount = await ctx.db.lesson.count({
        where: {
          studentId: input.studentId,
          teacherId: teacher.id,
          status: "COMPLETE",
          date: { gte: startDate, lte: endDate },
        },
      });

      const expectedAmount = completedCount * student.lessonRate;

      // Create paymentMonth only now — not on page load or dialog open
      const paymentMonth = await ctx.db.paymentMonth.upsert({
        where: {
          studentId_month_year: {
            studentId: input.studentId,
            month: input.month,
            year: input.year,
          },
        },
        create: {
          studentId: input.studentId,
          teacherId: teacher.id,
          month: input.month,
          year: input.year,
          expectedAmount,
        },
        update: { expectedAmount },
      });

      const normalizedDate = normalizePaymentDateInput(input.date, timezone);

      await ctx.db.paymentTransaction.create({
        data: {
          paymentMonthId: paymentMonth.id,
          studentId: input.studentId,
          teacherId: teacher.id,
          amount: input.amount,
          method: input.method,
          note: input.note,
          date: normalizedDate ?? new Date(),
        },
      });

      const refreshed = await ctx.db.paymentMonth.findUnique({
        where: { id: paymentMonth.id },
        include: {
          transactions: { orderBy: { date: "desc" } },
          student: {
            select: { id: true, name: true, avatar: true, lessonRate: true },
          },
        },
      });

      if (!refreshed) {
        throw new Error("Payment month record not found");
      }

      const receivedAmount = refreshed.transactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      );

      return {
        ...refreshed,
        receivedAmount,
        remainingAmount: calculateRemaining(
          refreshed.expectedAmount,
          receivedAmount,
        ),
        status: derivePaymentStatus(refreshed.expectedAmount, receivedAmount),
      };
    }),

  updateTransaction: protectedProcedure
    .input(updatePaymentTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const teacher = await getTeacherOrThrow(ctx.db, ctx.session.user.id);
      const timezone = ctx.session.user.timezone ?? "UTC";

      const transaction = await ctx.db.paymentTransaction.findFirst({
        where: {
          id: input.transactionId,
          teacherId: teacher.id,
        },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      return ctx.db.paymentTransaction.update({
        where: {
          id: input.transactionId,
        },
        data: {
          ...(input.amount !== undefined ? { amount: input.amount } : {}),
          ...(input.method !== undefined ? { method: input.method } : {}),
          ...(input.note !== undefined ? { note: input.note } : {}),
          ...(input.date !== undefined
            ? { date: normalizePaymentDateInput(input.date, timezone) }
            : {}),
        },
      });
    }),

  deleteTransaction: protectedProcedure
    .input(deletePaymentTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const teacher = await getTeacherOrThrow(ctx.db, ctx.session.user.id);

      const transaction = await ctx.db.paymentTransaction.findFirst({
        where: {
          id: input.transactionId,
          teacherId: teacher.id,
        },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      await ctx.db.paymentTransaction.delete({
        where: {
          id: input.transactionId,
        },
      });

      return { success: true };
    }),

  getStudentHistory: protectedProcedure
    .input(getPaymentStudentHistorySchema)
    .query(async ({ ctx, input }) => {
      const teacher = await getTeacherOrThrow(ctx.db, ctx.session.user.id);

      const student = await ctx.db.student.findFirst({
        where: {
          id: input.studentId,
          teacherId: teacher.id,
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      const paymentMonths = await ctx.db.paymentMonth.findMany({
        where: {
          teacherId: teacher.id,
          studentId: input.studentId,
          transactions: {
            some: {},
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
          transactions: {
            orderBy: {
              date: "desc",
            },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: input.limit,
      });

      return paymentMonths.map((paymentMonth) => {
        const receivedAmount = paymentMonth.transactions.reduce(
          (sum, transaction) => sum + transaction.amount,
          0,
        );

        return {
          ...paymentMonth,
          receivedAmount,
          remainingAmount: calculateRemaining(
            paymentMonth.expectedAmount,
            receivedAmount,
          ),
          status: derivePaymentStatus(
            paymentMonth.expectedAmount,
            receivedAmount,
          ),
        };
      });
    }),

  getUnpaidSummary: protectedProcedure
    .input(getPaymentUnpaidSummarySchema)
    .query(async ({ ctx, input }) => {
      const teacher = await getTeacherOrThrow(ctx.db, ctx.session.user.id);
      const timezone = ctx.session.user.timezone ?? "UTC";
      const nowInTimezone = fromUTC(new Date(), timezone);
      const month = input.month ?? nowInTimezone.getMonth() + 1;
      const year = input.year ?? nowInTimezone.getFullYear();

      const rows = await buildMonthPaymentRows({
        db: ctx.db,
        teacherId: teacher.id,
        timezone,
        month,
        year,
      });

      const unpaidRows = rows.filter((row) => row.status !== "PAID");

      return {
        month,
        year,
        unpaidCount: unpaidRows.length,
        totalOutstanding: unpaidRows.reduce(
          (sum, row) => sum + row.remainingAmount,
          0,
        ),
        payments: unpaidRows,
      };
    }),
});
