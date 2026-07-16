/**
 * The demo seeding steps, one exported function per step.
 *
 * Every write is scoped to the demo teacher's id, and `demoTeacher()` refuses
 * to hand back a teacher whose account is protected — so a bug here can never
 * reach a real studio's data.
 *
 * Only the current month and the previous month are seeded: the dashboard's
 * four KPI cards are "This Month" / "Missed This Month" / "Collected Last
 * Month" / "Outstanding Last Month", so two months is the minimum that lights
 * all of them up, and nothing older is created.
 */
import { hash } from "bcryptjs";

import { db } from "@/server/db";
import { effectiveLessonRate } from "@/lib/rate";
import {
  createDateInTimezone,
  fromUTC,
  getStartOfMonthUTC,
} from "@/lib/timezone";
import {
  DEMO_CANCEL_REASONS,
  DEMO_EMAIL,
  DEMO_FAMILIES,
  DEMO_LESSON_NOTES,
  DEMO_NAME,
  DEMO_PASSWORD,
  DEMO_PAYMENT_METHODS,
  DEMO_PIECES,
  DEMO_REPORT_TEXT,
  DEMO_STUDENTS,
  DEMO_TIMEZONE,
  PROTECTED_EMAILS,
} from "./demo-data";

/* ── Deterministic RNG ──────────────────────────────────────────────────────
   Seeded per call so a reseed produces the same studio, and two visitors
   clicking the button never see different demos. */
const makeRng = (seed: number) => {
  let s = seed;
  const next = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  return {
    next,
    pick: <T>(a: readonly T[]): T => a[Math.floor(next() * a.length)]!,
    int: (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)),
  };
};

/** Resolve the demo teacher, refusing to proceed on a protected account. */
async function demoTeacher() {
  const user = await db.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: { teacher: true },
  });
  if (!user?.teacher) throw new Error("Demo studio is not set up yet.");
  if (PROTECTED_EMAILS.includes(user.email ?? "")) {
    throw new Error("Refusing to seed over a protected account.");
  }
  return user.teacher;
}

/**
 * Today's calendar date as the teacher sees it. Everything below works in the
 * teacher's local calendar and converts to UTC on the way into the database —
 * the app renders lesson times in the teacher's zone, so seeding in raw UTC
 * would put lessons at midnight for an Asia/Kolkata studio.
 */
const localToday = () => fromUTC(new Date(), DEMO_TIMEZONE);

/** Start of the month `offset` months from now, in the teacher's zone, as UTC. */
const monthStart = (offset: number) => {
  const t = localToday();
  const d = new Date(t.getFullYear(), t.getMonth() + offset, 1);
  return getStartOfMonthUTC(d.getMonth() + 1, d.getFullYear(), DEMO_TIMEZONE);
};

// ── Step 1: setup ──────────────────────────────────────────────────────────
/** Create (or reset) the demo account and its pieces. Wipes prior demo data. */
export async function seedSetup() {
  if (PROTECTED_EMAILS.includes(DEMO_EMAIL)) {
    throw new Error("Demo email collides with a protected account.");
  }

  const password = await hash(DEMO_PASSWORD, 10);
  const user = await db.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: DEMO_NAME, password, timezone: DEMO_TIMEZONE },
    create: {
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      password,
      timezone: DEMO_TIMEZONE,
    },
  });
  const teacher = await db.teacher.upsert({
    where: { userId: user.id },
    update: { timezone: DEMO_TIMEZONE },
    create: { userId: user.id, timezone: DEMO_TIMEZONE },
  });

  // Clear the previous demo run. Children first: Student.teacher and
  // Piece.teacher are Restrict (no onDelete in the schema).
  await db.$transaction([
    db.lesson.deleteMany({ where: { teacherId: teacher.id } }),
    db.paymentTransaction.deleteMany({ where: { teacherId: teacher.id } }),
    db.paymentMonth.deleteMany({ where: { teacherId: teacher.id } }),
    db.family.deleteMany({ where: { teacherId: teacher.id } }),
    db.student.deleteMany({ where: { teacherId: teacher.id } }), // cascades reports
    db.piece.deleteMany({ where: { teacherId: teacher.id } }),
  ]);

  await db.piece.createMany({
    data: DEMO_PIECES.map((p) => ({ ...p, teacherId: teacher.id })),
  });

  return { pieces: DEMO_PIECES.length };
}

// ── Step 2: students ───────────────────────────────────────────────────────
export async function seedStudents() {
  const teacher = await demoTeacher();
  await db.student.createMany({
    data: DEMO_STUDENTS.map(([name, lessonRate, onlineLessonRate, notes]) => ({
      teacherId: teacher.id,
      name,
      lessonRate,
      onlineLessonRate,
      notes,
    })),
  });
  return { students: DEMO_STUDENTS.length };
}

// ── Step 3: families ───────────────────────────────────────────────────────
export async function seedFamilies() {
  const teacher = await demoTeacher();
  const students = await db.student.findMany({
    where: { teacherId: teacher.id },
    select: { id: true, name: true },
  });
  const byName = new Map(students.map((s) => [s.name, s.id]));

  let members = 0;
  for (const f of DEMO_FAMILIES) {
    const family = await db.family.create({
      data: { teacherId: teacher.id, name: f.name },
    });
    for (let i = 0; i < f.members.length; i++) {
      const studentId = byName.get(f.members[i]!);
      if (!studentId) continue;
      // position drives STT order on the combined tuition sheet.
      await db.familyMember.create({
        data: { familyId: family.id, studentId, position: i },
      });
      members++;
    }
  }
  return { families: DEMO_FAMILIES.length, members };
}

// ── Step 4: lessons ────────────────────────────────────────────────────────
/**
 * A stable weekly slot per student across last month and this month, so the
 * calendar reads like a real timetable rather than scattered noise. Everything
 * lands as PENDING; the attendance step decides what actually happened.
 */
export async function seedLessons() {
  const teacher = await demoTeacher();
  const students = await db.student.findMany({
    where: { teacherId: teacher.id },
    orderBy: { name: "asc" },
  });
  const pieces = await db.piece.findMany({
    where: { teacherId: teacher.id },
    select: { id: true },
  });
  const rng = makeRng(20260716);

  // Walk the teacher's local calendar: 1st of last month → end of this month.
  const t = localToday();
  const cursor = new Date(t.getFullYear(), t.getMonth() - 1, 1);
  const end = new Date(t.getFullYear(), t.getMonth() + 1, 0); // last day, this month

  const slots = students.map((student, i) => ({
    student,
    weekday: (i % 6) + 1, // Mon–Sat
    hour: 14 + (i % 6), // 14:00–19:00 in the teacher's own zone
    onlineOnly: student.name === "Arjun Patel",
    fortnightly: student.name === "Neha Kulkarni",
  }));

  const rows: {
    studentId: string;
    teacherId: string;
    date: Date;
    duration: number;
    status: "PENDING";
    isOnline: boolean;
    rate: number;
    pieceId: string | null;
  }[] = [];

  let week = 0;
  for (const d = new Date(cursor); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 1) week++;
    for (const slot of slots) {
      if (d.getDay() !== slot.weekday) continue;
      if (slot.fortnightly && week % 2) continue;

      const isOnline = slot.onlineOnly || rng.next() < 0.15;
      rows.push({
        studentId: slot.student.id,
        teacherId: teacher.id,
        // Local wall-clock → UTC, so the app renders 4:30 PM, not 11:00 PM.
        date: createDateInTimezone(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          slot.hour,
          rng.next() < 0.5 ? 0 : 30,
          DEMO_TIMEZONE,
        ),
        duration: rng.pick([30, 45, 45, 60]),
        status: "PENDING",
        isOnline,
        // Snapshot the rate exactly like lesson.create does — frozen per lesson.
        rate: effectiveLessonRate(slot.student, isOnline),
        pieceId: rng.next() < 0.75 ? (rng.pick(pieces).id ?? null) : null,
      });
    }
  }

  await db.lesson.createMany({ data: rows });
  return { lessons: rows.length };
}

// ── Step 5: attendance ─────────────────────────────────────────────────────
/**
 * Resolve past lessons into COMPLETE/CANCELLED. Future lessons stay PENDING,
 * which is what the real app does. CANCELLED always carries a reason, because
 * the attendance dialog requires one.
 */
export async function seedAttendance() {
  const teacher = await demoTeacher();
  const now = new Date();
  const past = await db.lesson.findMany({
    where: { teacherId: teacher.id, date: { lt: now } },
    select: { id: true },
    orderBy: { date: "asc" },
  });
  const rng = makeRng(982451653);

  let complete = 0;
  let cancelled = 0;
  const completeIds: string[] = [];
  const cancels: { id: string; reason: string; note: string | null }[] = [];

  for (const l of past) {
    if (rng.next() < 0.85) {
      completeIds.push(l.id);
      complete++;
    } else {
      cancels.push({
        id: l.id,
        reason: rng.pick(DEMO_CANCEL_REASONS),
        note: rng.next() < 0.3 ? rng.pick(DEMO_LESSON_NOTES) : null,
      });
      cancelled++;
    }
  }

  await db.lesson.updateMany({
    where: { id: { in: completeIds } },
    data: { status: "COMPLETE" },
  });
  // A cancelled lesson is never billed, so its rate must not count toward
  // revenue — the app relies on status, not rate, so the snapshot stays put.
  for (const c of cancels) {
    await db.lesson.update({
      where: { id: c.id },
      data: { status: "CANCELLED", cancelReason: c.reason, note: c.note },
    });
  }

  const pending = await db.lesson.count({
    where: { teacherId: teacher.id, status: "PENDING" },
  });
  return { complete, cancelled, pending };
}

// ── Step 6: reports ────────────────────────────────────────────────────────
/** A finished monthly report for last month, for the first eight students. */
export async function seedReports() {
  const teacher = await demoTeacher();
  const students = await db.student.findMany({
    where: { teacherId: teacher.id },
    orderBy: { name: "asc" },
    take: 8,
  });
  const last = fromUTC(monthStart(-1), DEMO_TIMEZONE);
  const month = last.getMonth() + 1;
  const year = last.getFullYear();

  for (const s of students) {
    await db.monthlyReport.upsert({
      where: { studentId_month_year: { studentId: s.id, month, year } },
      update: {},
      create: {
        studentId: s.id,
        month,
        year,
        ...DEMO_REPORT_TEXT,
        lessonMetadata: {},
      },
    });
  }
  return { reports: students.length, month, year };
}

// ── Step 7: payments ───────────────────────────────────────────────────────
/**
 * expectedAmount is the sum of that month's COMPLETE lessons only — the app
 * derives Paid/Partial/Outstanding from expected vs. the sum of transactions,
 * so if this used every lesson the maths on screen would not reconcile.
 *
 * Last month settles almost fully; this month is deliberately left part-paid
 * so all three derived states are visible in the demo.
 */
export async function seedPayments() {
  const teacher = await demoTeacher();
  const students = await db.student.findMany({
    where: { teacherId: teacher.id },
    select: { id: true },
    orderBy: { name: "asc" },
  });
  const rng = makeRng(429496729);

  /**
   * Assign payment states by position rather than by dice roll. A random draw
   * can hand every student a full payment, which leaves "Outstanding Last
   * Month" reading ₹0 and the card looking broken. This guarantees the demo
   * always shows all three derived states.
   *   1 = paid in full · 0.5 = partial · 0 = nothing paid
   */
  const ratioFor = (index: number, offset: number) => {
    if (offset === -1) {
      // Last month mostly settled, but never completely.
      if (index % 6 === 2) return 0.5;
      if (index % 6 === 5) return 0;
      return 1;
    }
    // Current month is deliberately messier.
    if (index % 3 === 0) return 1;
    if (index % 3 === 1) return 0.5;
    return 0;
  };

  let months = 0;
  let transactions = 0;

  for (const offset of [-1, 0]) {
    const start = monthStart(offset);
    const end = monthStart(offset + 1);
    const local = fromUTC(start, DEMO_TIMEZONE);
    const month = local.getMonth() + 1;
    const year = local.getFullYear();

    for (const [index, s] of students.entries()) {
      const complete = await db.lesson.findMany({
        where: {
          studentId: s.id,
          teacherId: teacher.id,
          status: "COMPLETE",
          date: { gte: start, lt: end },
        },
        select: { rate: true },
      });
      if (!complete.length) continue;

      const expected = complete.reduce((sum, l) => sum + l.rate, 0);
      const pm = await db.paymentMonth.create({
        data: {
          studentId: s.id,
          teacherId: teacher.id,
          month,
          year,
          expectedAmount: expected,
        },
      });
      months++;

      const ratio = ratioFor(index, offset);
      if (ratio === 0) continue; // nothing paid → fully outstanding

      const paid = Math.round((expected * ratio) / 10) * 10;
      const parts = ratio === 1 && rng.next() < 0.3 ? 2 : 1;
      for (let i = 0; i < parts; i++) {
        await db.paymentTransaction.create({
          data: {
            paymentMonthId: pm.id,
            studentId: s.id,
            teacherId: teacher.id,
            amount: parts === 2 ? Math.round(paid / 2 / 10) * 10 : paid,
            method: rng.pick(DEMO_PAYMENT_METHODS),
            date: new Date(Date.UTC(year, month - 1, rng.int(3, 26))),
            note: rng.next() < 0.25 ? "Paid at the lesson" : null,
          },
        });
        transactions++;
      }
    }
  }
  return { months, transactions };
}
