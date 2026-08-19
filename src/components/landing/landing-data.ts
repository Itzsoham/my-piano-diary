/**
 * Every word and link on the landing page. Sections import from here so copy
 * can be edited in one file without opening nine components, and so nothing on
 * the page can claim a feature the product does not actually ship.
 *
 * Deliberately free of React and icon imports — `icon` is a lucide name that
 * each section maps to a component itself, which keeps this module importable
 * from anywhere, server components included.
 */

export const LINKS = {
  github: "https://github.com/Itzsoham/my-piano-diary",
  githubStars: "https://github.com/Itzsoham/my-piano-diary/stargazers",
  x: "https://x.com/sohammaury",
  portfolio: "https://itzsoham.vercel.app/",
  email: "mailto:sohammaury@gmail.com",
  demo: "/login",
  register: "/register",
  dashboard: "/dashboard",
  mockups: "/design-mockups/index.html",
  styleguide: "/design-mockups/styleguide.html",
  docsProjectState:
    "https://github.com/Itzsoham/my-piano-diary/blob/main/docs/PROJECT_STATE.md",
  docsFutureFeatures:
    "https://github.com/Itzsoham/my-piano-diary/blob/main/docs/FUTURE_FEATURES.md",
  docsIssues:
    "https://github.com/Itzsoham/my-piano-diary/blob/main/docs/ISSUES_AND_FIXES.md",
} as const;

export const NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "Studio", href: "#studio" },
  { label: "Scoring", href: "#scoring" },
  { label: "How it works", href: "#how" },
  { label: "FAQ", href: "#faq" },
] as const;

/** Count-up strip. Every number here is a fact about the shipped app. */
export const STATS = [
  {
    value: 12,
    label: "students in the demo studio",
    hint: "One click seeds sibling families, two months of lessons and a messy payment ledger.",
  },
  {
    value: 59,
    label: "Vitest tests over the maths",
    hint: "Rates, tuition totals, ranking ties and timezone boundaries. CI runs them on every push.",
  },
  {
    value: 4,
    label: "currencies you can bill in",
    hint: "VND, IDR, USD and INR — set it once in Settings.",
  },
  {
    value: 100,
    suffix: "%",
    label: "TypeScript, strict mode",
    hint: "Lint and tsc run in GitHub Actions alongside the tests.",
  },
] as const;

export const FEATURES = [
  {
    icon: "CalendarDays",
    title: "A calendar you can drag",
    body: "Month view, colour-coded statuses, a day panel. Move a lesson to Thursday by dragging it there — the new time is saved in your timezone, not the server's.",
    accent: "pink",
  },
  {
    icon: "ClipboardCheck",
    title: "Attendance in three taps",
    body: "Pending, complete or cancelled, plus the real duration and a note. Cancelling asks for a reason, because in March you will want to know why.",
    accent: "mint",
  },
  {
    icon: "Flower2",
    title: "Blossom scoring",
    body: "Rate a finished lesson one to five blossoms. Leaving it unrated is a real answer — unrated lessons stay out of the ranking instead of counting as a zero.",
    accent: "pink",
  },
  {
    icon: "Trophy",
    title: "An honest leaderboard",
    body: "All-time podium, score spread, and a flag when a student has too few rated lessons to judge. Ties are compared exactly, so two students can genuinely share first.",
    accent: "sand",
  },
  {
    icon: "Users",
    title: "Students, sortable",
    body: "Search, sort and filter a real table that remembers how you left it. Avatars, notes, and separate in-person and online rates per student.",
    accent: "mint",
  },
  {
    icon: "HeartHandshake",
    title: "Siblings on one sheet",
    body: "Group a family and their month prints as a single combined attendance and tuition sheet — one paper for one parent.",
    accent: "pink",
  },
  {
    icon: "Wallet",
    title: "Payments as they really arrive",
    body: "Expected against received, per student per month, with partial payments, several transactions, methods, notes and an outstanding summary.",
    accent: "sand",
  },
  {
    icon: "Music4",
    title: "A repertoire library",
    body: "Pieces with level, description and a one-to-five difficulty, each showing how many lessons you have spent on it.",
    accent: "mint",
  },
  {
    icon: "Globe2",
    title: "Timezones that agree",
    body: "Everything is stored as UTC and bucketed by your IANA zone on the server, so month totals, today's lessons and drag-drop reschedules never disagree.",
    accent: "pink",
  },
] as const;

export const STEPS = [
  {
    n: 1,
    title: "Seed the demo, or add your own",
    body: "One click builds a sample studio in seven visible steps: 12 students, sibling families, two months of history. Or skip it and type in your real Tuesday.",
  },
  {
    n: 2,
    title: "Schedule the week",
    body: "Book lessons on the calendar, or generate a weekly recurring slot across the next month or two. Double-booking the same slot is blocked.",
  },
  {
    n: 3,
    title: "Mark attendance, score the lesson",
    body: "After the lesson: complete, cancelled with a reason, or still pending. Then one to five blossoms while you still remember how it went.",
  },
  {
    n: 4,
    title: "Print the month, chase what is owed",
    body: "A per-student report with comments and next month's plan, printed straight from the browser — plus an outstanding list so nothing quietly goes unpaid.",
  },
] as const;

export const TECH_STACK = [
  { name: "Next.js 16", hint: "App Router, React Server Components" },
  { name: "React 19", hint: "Server components and transitions" },
  { name: "TypeScript", hint: "Strict, no escape hatches" },
  { name: "tRPC 11", hint: "End-to-end typed API, no codegen" },
  { name: "Prisma 6", hint: "Typed schema and queries" },
  { name: "PostgreSQL", hint: "UTC timestamptz for every moment" },
  { name: "NextAuth 5", hint: "Email and password, bcrypt, JWT sessions" },
  { name: "Tailwind CSS 4", hint: "CSS-first tokens, no config file" },
  { name: "shadcn/ui", hint: "Components owned in the repo" },
  { name: "TanStack Query", hint: "Caching and optimistic updates" },
  { name: "TanStack Table", hint: "Students table, view state persisted" },
  { name: "FullCalendar", hint: "Month view with drag-and-drop" },
  { name: "Zod", hint: "One schema for the form and the server" },
  { name: "Vitest", hint: "59 tests over the maths in src/lib" },
] as const;

export const FAQS = [
  {
    q: "Do my students get logins?",
    a: "No. This is a diary for one teacher — students are records you keep, not accounts they sign into. Nothing to onboard, no passwords to reset for a nine-year-old.",
  },
  {
    q: "Can I try it without signing up?",
    a: "Yes. The login page has a Try the demo button that seeds a full sample studio in seven visible steps: 12 students, sibling families, two months of lessons, reports and a payment ledger you can poke at.",
  },
  {
    q: "Where does my data live?",
    a: "Wherever you put it. It is open source and bring-your-own Postgres — the setup it was built against is Vercel plus a Neon database, and nothing stops you running it on your own server instead.",
  },
  {
    q: "What happens to past months if I raise a rate?",
    a: "Nothing. Every lesson stores the rate it was booked at, so raising a student's rate only re-prices lessons from then on. A month you already billed stays exactly as you billed it.",
  },
  {
    q: "Which currencies does it handle?",
    a: "VND, IDR, USD and INR, chosen once in Settings along with your default in-person and online rates.",
  },
  {
    q: "Does it get timezones right?",
    a: "Yes, and that took the most care. Times are stored as UTC timestamptz and bucketed by your IANA timezone on the server, so month boundaries, today's lessons and drag-drop reschedules all agree — even when you teach online across zones.",
  },
] as const;
