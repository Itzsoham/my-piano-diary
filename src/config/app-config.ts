import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "My Piano Diary",
  version: packageJson.version,
  copyright: `© ${currentYear}, My Piano Diary.`,
  meta: {
    title: "My Piano Diary – Piano Lessons, Attendance & Earnings Tracker",
    description:
      "My Piano Diary is a modern, elegant tool for music teachers to manage students, track lesson attendance, calculate earnings, and organize their teaching studio effortlessly.",
  },
};

// ─── Birthday Mode ────────────────────────────────────────────────────────────
export const BIRTHDAY_CONFIG = {
  /** Master toggle — set false to disable entirely */
  enabled: true,
  /** The birthday date string (YYYY-MM-DD) */
  birthdayDate: "2026-04-21", // TEMP: testing — change back to 2026-04-24
} as const;

/** Returns true if today is the actual birthday */
export function isBirthdayToday(): boolean {
  if (!BIRTHDAY_CONFIG.enabled) return false;
  const today = new Date();
  const [year, month, day] = BIRTHDAY_CONFIG.birthdayDate
    .split("-")
    .map(Number);
  return (
    today.getFullYear() === year &&
    today.getMonth() + 1 === month &&
    today.getDate() === day
  );
}
