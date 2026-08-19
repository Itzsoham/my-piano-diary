import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

/**
 * The canonical origin the site is served from. Metadata, robots.txt and the
 * sitemap all resolve their absolute URLs against this, so it has to be a real
 * origin rather than a relative path. Set NEXT_PUBLIC_SITE_URL for a custom
 * domain; on Vercel the deployment URL is used automatically; locally we fall
 * back to the dev server. Read straight from process.env rather than src/env.js
 * because next.config.js and the metadata files load before validation runs.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const APP_CONFIG = {
  name: "My Piano Diary",
  version: packageJson.version,
  copyright: `© ${currentYear}, My Piano Diary.`,
  url: SITE_URL,
  author: {
    name: "Soham Maury",
    url: "https://itzsoham.vercel.app/",
    twitter: "@sohammaury",
    github: "https://github.com/Itzsoham/my-piano-diary",
  },
  meta: {
    title: "My Piano Diary – Piano Lessons, Attendance & Earnings Tracker",
    description:
      "My Piano Diary is a modern, elegant tool for music teachers to manage students, track lesson attendance, calculate earnings, and organize their teaching studio effortlessly.",
    /** Used as the <title> suffix for every page below the root. */
    titleTemplate: "%s · My Piano Diary",
    /** Shorter than meta.description — share cards truncate around 200 chars. */
    shareDescription:
      "Students, attendance, blossom scoring, tuition and printable monthly reports — one warm diary for a piano teaching studio.",
    keywords: [
      "piano teacher software",
      "music lesson scheduling",
      "student attendance tracker",
      "piano studio management",
      "music teacher app",
      "lesson planner",
      "tuition tracking",
      "monthly student reports",
      "music school admin",
      "private music teacher",
    ],
  },
} as const;

/**
 * Routes that must never be indexed. Everything here is either behind auth
 * (so a crawler only ever sees the login redirect), a personal easter egg, or
 * a static design artefact — none of it belongs in search results.
 */
export const PRIVATE_ROUTES = [
  "/api/",
  "/dashboard",
  "/calendar",
  "/lessons",
  "/students",
  "/pieces",
  "/reports",
  "/payments",
  "/profile",
  "/leaderboard",
  "/notifications",
  "/updates",
  "/birthday-game",
  "/birthday-room",
  "/forever",
  "/design-mockups",
] as const;

/** Public, indexable routes — the sitemap is built from exactly this list. */
export const PUBLIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/login", priority: 0.5, changeFrequency: "yearly" },
  { path: "/register", priority: 0.5, changeFrequency: "yearly" },
] as const;

// ─── Birthday Mode ────────────────────────────────────────────────────────────
export const BIRTHDAY_CONFIG = {
  /** Master toggle — set false to disable entirely */
  enabled: true,
  /** The birthday date string (YYYY-MM-DD) */
  birthdayDate: "2026-04-24", // TEMP: testing — change back to 2026-04-24
} as const;

/** Returns true if today is the actual birthday or if manual override is active */
export function isBirthdayToday(): boolean {
  // Check for manual override (client-side only)
  if (typeof window !== "undefined") {
    if (localStorage.getItem("manual_birthday_mode") === "true") {
      return true;
    }
  }

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
