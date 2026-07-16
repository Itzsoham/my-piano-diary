/**
 * Demo seed — a full, realistic studio for interviews and demos.
 *
 *   npm run db:seed
 *
 * SAFETY: everything is scoped to DEMO_EMAIL's teacher row. The script wipes
 * and rebuilds ONLY that teacher's data, so real accounts are never touched.
 * Re-running is idempotent.
 *
 * Written in plain ESM (.mjs) because the repo has no tsx/ts-node.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

// Bare node doesn't load .env the way Next does.
try {
  for (const line of readFileSync(
    new URL("../.env", import.meta.url),
    "utf8",
  ).split("\n")) {
    const m = /^([A-Z_][A-Z0-9_]*)="?([^"]*)"?\s*$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* CI provides env directly */
}

const DEMO_EMAIL = "demo@pianodiary.dev";
const DEMO_PASSWORD = "demo1234";
const DEMO_NAME = "Demo Teacher";
const TZ = "Asia/Ho_Chi_Minh";

/** Accounts this script must never touch, whatever happens. */
const PROTECTED = ["thuydan685@gmail.com"];

const db = new PrismaClient();

// ── Deterministic RNG so re-seeding produces the same studio ────────────────
let _s = 20260716;
const rnd = () => (_s = (_s * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// ── Reference data ──────────────────────────────────────────────────────────
const PIECES = [
  {
    title: "Für Elise",
    level: "Grade 3",
    difficulty: 3,
    description:
      "Beethoven's bagatelle in A minor. The A section is approachable; the B section needs a steady left hand.",
  },
  {
    title: "Clair de Lune",
    level: "Grade 6",
    difficulty: 5,
    description: "Debussy. Rubato and pedalling are the whole lesson here.",
  },
  {
    title: "Nocturne Op.9 No.2",
    level: "Grade 6",
    difficulty: 5,
    description: "Chopin. Ornamentation and a singing right-hand line.",
  },
  {
    title: "Turkish March",
    level: "Grade 5",
    difficulty: 4,
    description: "Mozart's Rondo alla Turca. Evenness at speed.",
  },
  {
    title: "Gymnopédie No.1",
    level: "Grade 3",
    difficulty: 2,
    description: "Satie. Slow, but the voicing is deceptively hard.",
  },
  {
    title: "Minuet in G",
    level: "Grade 2",
    difficulty: 2,
    description: "Petzold. A first taste of Baroque phrasing.",
  },
  {
    title: "Arabesque No.1",
    level: "Grade 5",
    difficulty: 4,
    description: "Debussy. Cross-rhythms — 3 against 2.",
  },
  {
    title: "River Flows in You",
    level: "Grade 4",
    difficulty: 3,
    description: "Yiruma. Popular request; good for pedal control.",
  },
  {
    title: "Prelude in C",
    level: "Grade 2",
    difficulty: 1,
    description: "Bach, WTC Book I. Broken chords, steady pulse.",
  },
  {
    title: "Sonatina in G",
    level: "Grade 3",
    difficulty: 2,
    description: "Beethoven, Anh. 5. Clean classical articulation.",
  },
];

// name, in-person rate, online rate, notes
const STUDENTS = [
  [
    "Nguyễn Minh Anh",
    250000,
    200000,
    "Prefers morning slots. Working toward Grade 5.",
  ],
  [
    "Nguyễn Gia Hân",
    250000,
    200000,
    "Minh Anh's younger sister. Same lesson slot, back to back.",
  ],
  [
    "Trần Bảo Ngọc",
    300000,
    250000,
    "Very quick reader. Needs pushing on dynamics.",
  ],
  [
    "Lê Gia Hân",
    250000,
    200000,
    "Nervous in recitals — build repertoire she feels safe with.",
  ],
  ["Emma Thompson", 350000, 300000, "Expat family. Lessons in English."],
  [
    "Phạm Quốc Bảo",
    200000,
    160000,
    "Beginner, 8 years old. Short attention span — keep it playful.",
  ],
  ["Olivia Nguyen", 300000, 250000, "Preparing ABRSM Grade 6 for spring."],
  [
    "Đỗ Khánh Linh",
    250000,
    200000,
    "Strong left hand, rushes the right. Metronome every lesson.",
  ],
  ["Liam Carter", 280000, 240000, "Online only — family moved to Hanoi."],
  ["Vũ Thanh Trúc", 220000, 180000, "Loves film music. Bribe with Yiruma."],
  ["Hoàng Nam Phong", 200000, 160000, "Beginner. Learning to read bass clef."],
  [
    "Bùi Thu Hà",
    300000,
    250000,
    "Returning adult student. Two lessons a month.",
  ],
];

const FAMILIES = [
  { name: "Gia đình Nguyễn", members: ["Nguyễn Minh Anh", "Nguyễn Gia Hân"] },
  { name: "Gia đình Trần", members: ["Trần Bảo Ngọc", "Vũ Thanh Trúc"] },
];

const CANCEL_REASONS = [
  "Sick",
  "Family emergency",
  "School exam",
  "Travelling",
  "Teacher unwell",
];
const METHODS = ["Cash", "Bank transfer", "Momo"];

const REPORT_TEXT = {
  summary:
    "Con đã hoàn thành phần gam Đô trưởng và Sol trưởng với tốc độ ổn định. Bài Für Elise đã thuộc đoạn A, tay trái giữ nhịp tốt hơn tháng trước.",
  comments:
    "Con tiến bộ rõ ở phần đọc nốt khoá Fa. Cần chú ý hơn về sắc thái to nhỏ và giữ cổ tay mềm khi chơi đoạn nhanh.",
  nextMonthPlan:
    "Tháng tới sẽ hoàn thiện đoạn B của Für Elise, bắt đầu gam Rê trưởng và luyện thêm bài đọc tấu ngắn mỗi buổi.",
  tuitionNote: "Học phí đã bao gồm 1 buổi học bù ngày 12.",
};

async function main() {
  console.log("Seeding demo studio…\n");

  // ── 1. Demo user + teacher ────────────────────────────────────────────────
  const password = await hash(DEMO_PASSWORD, 10);
  const user = await db.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: DEMO_NAME, password, timezone: TZ },
    create: { email: DEMO_EMAIL, name: DEMO_NAME, password, timezone: TZ },
  });
  const teacher = await db.teacher.upsert({
    where: { userId: user.id },
    update: { timezone: TZ },
    create: { userId: user.id, timezone: TZ },
  });

  if (PROTECTED.includes(DEMO_EMAIL))
    throw new Error("demo email collides with a protected account");
  console.log(`  user    ${DEMO_EMAIL}`);
  console.log(`  teacher ${teacher.id}`);

  // ── 2. Wipe ONLY this teacher's data (idempotent re-seed) ─────────────────
  await db.$transaction([
    db.lesson.deleteMany({ where: { teacherId: teacher.id } }),
    db.paymentTransaction.deleteMany({ where: { teacherId: teacher.id } }),
    db.paymentMonth.deleteMany({ where: { teacherId: teacher.id } }),
    db.family.deleteMany({ where: { teacherId: teacher.id } }),
    db.student.deleteMany({ where: { teacherId: teacher.id } }), // cascades reports
    db.piece.deleteMany({ where: { teacherId: teacher.id } }),
  ]);
  console.log("  cleared previous demo data");

  // ── 3. Pieces ─────────────────────────────────────────────────────────────
  const pieces = [];
  for (const p of PIECES) {
    pieces.push(
      await db.piece.create({ data: { ...p, teacherId: teacher.id } }),
    );
  }
  console.log(`  pieces   ${pieces.length}`);

  // ── 4. Students ───────────────────────────────────────────────────────────
  const students = [];
  for (const [name, lessonRate, onlineLessonRate, notes] of STUDENTS) {
    students.push(
      await db.student.create({
        data: {
          teacherId: teacher.id,
          name,
          lessonRate,
          onlineLessonRate,
          notes,
        },
      }),
    );
  }
  console.log(`  students ${students.length}`);

  // ── 5. Families — the combined tuition sheet has no real-world data yet, so
  //      the demo is the only place this feature can be shown off. ───────────
  for (const f of FAMILIES) {
    const fam = await db.family.create({
      data: { teacherId: teacher.id, name: f.name },
    });
    for (let i = 0; i < f.members.length; i++) {
      const s = students.find((x) => x.name === f.members[i]);
      if (s)
        await db.familyMember.create({
          data: { familyId: fam.id, studentId: s.id, position: i },
        });
    }
  }
  console.log(`  families ${FAMILIES.length}`);

  // ── 6. Lessons — 4 months back, plus 2 weeks of scheduled future ──────────
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const future = new Date(now.getTime() + 14 * 864e5);

  // Each student gets a stable weekly slot, so the calendar reads like a real timetable.
  const slots = students.map((s, i) => ({
    student: s,
    weekday: (i % 6) + 1, // Mon–Sat
    hour: 14 + (i % 6), // 14:00–19:00
    online: s.name === "Liam Carter",
    everyOtherWeek: s.name === "Bùi Thu Hà",
  }));

  const lessons = [];
  for (let d = new Date(start); d <= future; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    for (const slot of slots) {
      if (dow !== slot.weekday) continue;
      const weekIdx = Math.floor((d - start) / (7 * 864e5));
      if (slot.everyOtherWeek && weekIdx % 2) continue;

      const date = new Date(d);
      date.setHours(slot.hour, rnd() < 0.5 ? 0 : 30, 0, 0);

      const isPast = date < now;
      const isOnline = slot.online || rnd() < 0.15;

      // Past: mostly COMPLETE, some CANCELLED. Future: always PENDING.
      let status = "PENDING";
      if (isPast) status = rnd() < 0.82 ? "COMPLETE" : "CANCELLED";

      const rate = isOnline
        ? slot.student.onlineLessonRate
        : slot.student.lessonRate;

      lessons.push({
        studentId: slot.student.id,
        teacherId: teacher.id,
        date,
        duration: pick([30, 45, 45, 60]),
        status,
        isOnline,
        rate, // frozen snapshot, exactly like lesson.create does
        cancelReason: status === "CANCELLED" ? pick(CANCEL_REASONS) : null,
        pieceId: rnd() < 0.75 ? pick(pieces).id : null,
        note:
          status === "COMPLETE" && rnd() < 0.2
            ? "Good progress — keep the metronome on for the fast section."
            : null,
      });
    }
  }
  await db.lesson.createMany({ data: lessons });
  const byStatus = lessons.reduce(
    (a, l) => ({ ...a, [l.status]: (a[l.status] ?? 0) + 1 }),
    {},
  );
  console.log(
    `  lessons  ${lessons.length}  (${Object.entries(byStatus)
      .map(([k, v]) => `${k}=${v}`)
      .join(" ")})`,
  );

  // ── 7. Payments — expected = sum of that month's COMPLETE lessons, so the
  //      derived Paid/Partial/Outstanding maths actually reconciles. ─────────
  let months = 0;
  let txCount = 0;
  for (const s of students) {
    for (let back = 3; back >= 0; back--) {
      const m = new Date(now.getFullYear(), now.getMonth() - back, 1);
      const month = m.getMonth() + 1;
      const year = m.getFullYear();

      const mine = lessons.filter(
        (l) =>
          l.studentId === s.id &&
          l.status === "COMPLETE" &&
          l.date.getMonth() === m.getMonth() &&
          l.date.getFullYear() === year,
      );
      if (!mine.length) continue;

      const expected = mine.reduce((sum, l) => sum + l.rate, 0);
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

      // Older months settle; the current month is deliberately messy so the
      // Paid / Partial / Outstanding states are all visible in the demo.
      const roll = rnd();
      const ratio =
        back === 0
          ? roll < 0.4
            ? 1
            : roll < 0.75
              ? 0.5
              : 0
          : roll < 0.9
            ? 1
            : 0.6;
      if (ratio === 0) continue;

      const paid = Math.round((expected * ratio) / 1000) * 1000;
      const parts = ratio === 1 && rnd() < 0.3 ? 2 : 1; // sometimes paid in two instalments
      for (let i = 0; i < parts; i++) {
        await db.paymentTransaction.create({
          data: {
            paymentMonthId: pm.id,
            studentId: s.id,
            teacherId: teacher.id,
            amount: parts === 2 ? Math.round(paid / 2 / 1000) * 1000 : paid,
            method: pick(METHODS),
            date: new Date(year, month - 1, int(3, 26)),
            note: rnd() < 0.25 ? "Paid at the lesson" : null,
          },
        });
        txCount++;
      }
    }
  }
  console.log(`  payments ${months} months · ${txCount} transactions`);

  // ── 8. Monthly reports for the last full month ────────────────────────────
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  let reports = 0;
  for (const s of students.slice(0, 8)) {
    await db.monthlyReport.create({
      data: {
        studentId: s.id,
        month: last.getMonth() + 1,
        year: last.getFullYear(),
        summary: REPORT_TEXT.summary,
        comments: REPORT_TEXT.comments,
        nextMonthPlan: REPORT_TEXT.nextMonthPlan,
        tuitionNote: REPORT_TEXT.tuitionNote,
        lessonMetadata: {},
      },
    });
    reports++;
  }
  console.log(`  reports  ${reports}`);

  console.log(`\nDone. Log in with  ${DEMO_EMAIL}  /  ${DEMO_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
