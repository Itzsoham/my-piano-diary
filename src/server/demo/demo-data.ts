/**
 * Demo studio — the reference data behind the login page's "Try the demo"
 * button. An Indian teacher's studio, billed in INR, in English.
 *
 * Seeding runs as discrete steps (see src/server/demo/seed-steps.ts) so the
 * login page can report honest progress instead of a fake spinner.
 */

/** The one shared demo account. Reseeded on every click. */
export const DEMO_EMAIL = "demo@pianodiary.dev";
export const DEMO_PASSWORD = "demo1234";
export const DEMO_NAME = "Ananya Rao";
export const DEMO_TIMEZONE = "Asia/Kolkata";

/**
 * Accounts the demo seeder must never touch, whatever happens. Every write
 * below is scoped to the demo teacher's id, but this is the backstop.
 */
export const PROTECTED_EMAILS = ["thuydan685@gmail.com"];

/** name · in-person rate (INR) · online rate (INR) · notes */
export const DEMO_STUDENTS: [string, number, number, string][] = [
  [
    "Aarav Sharma",
    1200,
    1000,
    "Prefers morning slots. Working toward Grade 5.",
  ],
  ["Diya Sharma", 1000, 800, "Aarav's younger sister — back-to-back slot."],
  ["Rohan Mehta", 1500, 1200, "Quick reader. Needs pushing on dynamics."],
  [
    "Ananya Iyer",
    1200,
    1000,
    "Nervous in recitals — build repertoire she feels safe with.",
  ],
  ["Vihaan Reddy", 800, 700, "Beginner, 8 years old. Keep it playful."],
  ["Saanvi Nair", 1500, 1200, "Preparing Trinity Grade 6 for spring."],
  [
    "Kabir Singh",
    1200,
    1000,
    "Strong left hand, rushes the right. Metronome every lesson.",
  ],
  ["Meera Joshi", 1000, 800, "Loves film music. Bribe with Yiruma."],
  ["Arjun Patel", 1400, 1200, "Online only — family moved to Bengaluru."],
  ["Priya Patel", 1000, 800, "Arjun's cousin. Same family sheet."],
  ["Ishaan Gupta", 800, 700, "Beginner. Learning to read the bass clef."],
  [
    "Neha Kulkarni",
    1500,
    1200,
    "Returning adult student. Two lessons a month.",
  ],
];

export const DEMO_PIECES = [
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
    description: "Debussy. Cross-rhythms — three against two.",
  },
  {
    title: "River Flows in You",
    level: "Grade 4",
    difficulty: 3,
    description: "Yiruma. A popular request, and good for pedal control.",
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

/** Siblings/cousins billed on one combined tuition sheet. */
export const DEMO_FAMILIES = [
  { name: "Sharma Family", members: ["Aarav Sharma", "Diya Sharma"] },
  { name: "Patel Family", members: ["Arjun Patel", "Priya Patel"] },
];

export const DEMO_CANCEL_REASONS = [
  "Unwell",
  "Family function",
  "School exam",
  "Travelling",
  "Teacher unwell",
];

export const DEMO_PAYMENT_METHODS = ["Cash", "Bank transfer", "UPI"];

export const DEMO_LESSON_NOTES = [
  "Good progress — keep the metronome on for the fast section.",
  "Scales are solid now. Move on to arpeggios next week.",
  "Sight-reading improving. Same again next lesson.",
  "Pedalling much cleaner today.",
];

export const DEMO_REPORT_TEXT = {
  summary:
    "Completed the C major and G major scales at a steady tempo this month. The A section of Für Elise is memorised, and the left hand is holding time far better than last month.",
  comments:
    "Clear progress on reading the bass clef. Needs to pay more attention to dynamics, and to keep the wrist relaxed through the faster passages.",
  nextMonthPlan:
    "Next month we will finish the B section of Für Elise, start the D major scale, and add a short sight-reading exercise to every lesson.",
  tuitionNote: "Tuition includes one make-up lesson.",
};

/**
 * The steps the login page renders, in order. Keys match the demo router's
 * mutations so the UI and the server can never drift apart.
 */
export const DEMO_STEPS = [
  { key: "setup", label: "Setting up the studio" },
  { key: "students", label: "Adding students" },
  { key: "families", label: "Creating families" },
  { key: "lessons", label: "Scheduling lessons" },
  { key: "attendance", label: "Marking attendance" },
  { key: "reports", label: "Generating reports" },
  { key: "payments", label: "Recording payments" },
] as const;

export type DemoStepKey = (typeof DEMO_STEPS)[number]["key"];
