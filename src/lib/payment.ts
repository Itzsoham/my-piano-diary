import { fromUTC } from "@/lib/timezone";

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export const derivePaymentStatus = (
  expectedAmount: number,
  receivedAmount: number,
): PaymentStatus => {
  if (receivedAmount <= 0) {
    return "UNPAID";
  }

  if (receivedAmount >= expectedAmount) {
    return "PAID";
  }

  return "PARTIAL";
};

export const calculateRemaining = (
  expectedAmount: number,
  receivedAmount: number,
) => {
  return Math.max(expectedAmount - receivedAmount, 0);
};

/**
 * Sum completed-lesson rates into `year-month` buckets, assigning each lesson to
 * a month in the given timezone. Used to recompute a month's expected amount
 * live (rather than trusting the denormalized snapshot).
 */
export const expectedByMonth = (
  completedLessons: { date: Date; rate: number }[],
  timezone: string,
): Map<string, number> => {
  const map = new Map<string, number>();
  for (const lesson of completedLessons) {
    const local = fromUTC(lesson.date, timezone);
    const key = `${local.getFullYear()}-${local.getMonth() + 1}`;
    map.set(key, (map.get(key) ?? 0) + lesson.rate);
  }
  return map;
};

/**
 * All-time totals for the payments dashboard tile. Expected (completed-lesson
 * rates) and received (a month's transactions) are bucketed by
 * student+year+month — assigning lessons to a month in `timezone` — and
 * `remaining` is clamped PER bucket before summing, so an overpaid month can't
 * cancel out an underpaid one.
 */
export const summarizeOutstanding = (
  completedLessons: { studentId: string; date: Date; rate: number }[],
  paymentMonths: {
    studentId: string;
    year: number;
    month: number;
    received: number;
  }[],
  timezone: string,
): { totalExpected: number; totalReceived: number; totalOutstanding: number } => {
  const expectedByBucket = new Map<string, number>();
  for (const lesson of completedLessons) {
    const local = fromUTC(lesson.date, timezone);
    const key = `${lesson.studentId}|${local.getFullYear()}|${local.getMonth() + 1}`;
    expectedByBucket.set(key, (expectedByBucket.get(key) ?? 0) + lesson.rate);
  }

  const receivedByBucket = new Map<string, number>();
  for (const pm of paymentMonths) {
    const key = `${pm.studentId}|${pm.year}|${pm.month}`;
    receivedByBucket.set(key, (receivedByBucket.get(key) ?? 0) + pm.received);
  }

  let totalExpected = 0;
  let totalReceived = 0;
  let totalOutstanding = 0;
  for (const key of new Set([
    ...expectedByBucket.keys(),
    ...receivedByBucket.keys(),
  ])) {
    const expected = expectedByBucket.get(key) ?? 0;
    const received = receivedByBucket.get(key) ?? 0;
    totalExpected += expected;
    totalReceived += received;
    totalOutstanding += calculateRemaining(expected, received);
  }

  return { totalExpected, totalReceived, totalOutstanding };
};
