<div align="center">
  <br />

  <div>
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
    <img src="https://img.shields.io/badge/-Next_JS_16-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000" alt="nextdotjs" />
    <img src="https://img.shields.io/badge/-React_19-black?style=for-the-badge&logoColor=white&logo=react&color=61DAFB" alt="react" />
    <img src="https://img.shields.io/badge/-tRPC_11-black?style=for-the-badge&logoColor=white&logo=trpc&color=2596BE" alt="trpc" />
    <img src="https://img.shields.io/badge/-Prisma_6-black?style=for-the-badge&logoColor=white&logo=prisma&color=2D3748" alt="prisma" />
  </div>
  <div>
    <img src="https://img.shields.io/badge/-PostgreSQL-black?style=for-the-badge&logoColor=white&logo=postgresql&color=4169E1" alt="postgresql" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS_4-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
    <img src="https://img.shields.io/badge/-ShadCN_UI-black?style=for-the-badge&logoColor=white&logo=shadcnui&color=000000" alt="shadcnui" />
    <img src="https://img.shields.io/badge/-Zod-black?style=for-the-badge&logoColor=white&logo=zod&color=3E67B1" alt="zod" />
    <img src="https://img.shields.io/badge/-Vitest-black?style=for-the-badge&logoColor=white&logo=vitest&color=6E9F18" alt="vitest" />
  </div>

  <h3 align="center">🌸 My Piano Diary</h3>

   <div align="center">
     A lesson-management diary for piano teachers — students, scheduling, attendance,
     <br />
     lesson scoring, tuition tracking and printable monthly reports, in one place.
    </div>
</div>

## 📋 <a name="table">Table of Contents</a>

1. 🤖 [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🤸 [Quick Start](#quick-start)
5. 🗂️ [Project Structure](#structure)
6. 🗄️ [Data Model](#data-model)
7. 🧰 [Scripts](#scripts)
8. 🧪 [Testing & CI](#testing)
9. 📚 [Docs](#docs)
10. 🚀 [Deploy](#deploy)

## <a name="introduction">🤖 Introduction</a>

**My Piano Diary** is a full-stack studio diary built for a single piano teacher. Students are records you manage — not logins — so there is no multi-tenant mode, no student portal, and no invitations to chase. You log in, and the whole studio is yours: who is coming today, who showed up, how the lesson went, who still owes for last month, and what to hand a parent at the end of it.

It is built on the [T3 Stack](https://create.t3.gg/) — Next.js 16 App Router, tRPC 11, Prisma 6 and NextAuth 5 — with end-to-end type safety from the Zod input schema all the way to the React Query hook. Every datetime is stored as UTC `timestamptz` and rendered back through the teacher's configured IANA timezone, so a lesson lands on the same calendar day whether you open it at home, on tour, or from a server in another hemisphere.

The interface is a bespoke design system called **Blossom Diary** — a soft paper-diary aesthetic with hand-drawn blossom ornaments, a studio-cat mascot (Mochi, who meows when you click her), and a shell that reflows from a full sidebar to an icon rail to a mobile bottom tab bar.

Want to look around before signing up? The login page has a **🎹 Try the demo** button that seeds a complete sample studio — twelve students, sibling families, two months of lessons, resolved attendance, monthly reports, and a deliberately messy payment ledger — in seven visible steps.

## <a name="tech-stack">⚙️ Tech Stack</a>

| Layer        | Technology                                                  |
| ------------ | ----------------------------------------------------------- |
| Framework    | Next.js 16 (App Router, Turbopack), React 19                |
| Language     | TypeScript 5.8 (strict)                                     |
| API          | tRPC 11 — `httpBatchStreamLink` + SuperJSON                 |
| Database     | PostgreSQL ([Neon](https://neon.tech)) via Prisma 6         |
| Auth         | NextAuth.js 5 (Credentials, JWT sessions, bcrypt)           |
| Server state | TanStack React Query 5 (SSR prefetch + streaming hydration) |
| Client state | Zustand 5 + lightweight `localStorage` preference hooks     |
| UI           | Tailwind CSS 4, Shadcn/UI, Radix UI                         |
| Forms        | React Hook Form 7 + Zod 3                                   |
| Calendar     | FullCalendar 6 (daygrid · timegrid · interaction)           |
| Charts       | Recharts 2                                                  |
| Tables       | TanStack React Table 8                                      |
| Dates        | date-fns 4 + date-fns-tz 3 (full IANA timezone support)     |
| Motion       | Framer Motion 12, canvas-confetti                           |
| Env safety   | `@t3-oss/env-nextjs` — validated at build time              |
| Testing      | Vitest 4 + v8 coverage, GitHub Actions CI                   |

## <a name="features">🔋 Features</a>

👉 **Authentication**: Email/password register and login with bcrypt hashing, JWT sessions, and a fast cookie-check route guard that never blocks the edge runtime.

👉 **One-Click Demo Studio**: "🎹 Try the demo" seeds an entire sample studio through seven sequential steps with honest per-step progress — no fake spinner, no signup.

👉 **Dashboard**: Live KPI cards (this month's earnings, missed lessons, collected last month, outstanding last month) plus an intelligence panel with today's lessons, quick insights, and an earnings-trend chart.

👉 **Interactive Calendar**: A FullCalendar month view with drag-and-drop rescheduling, colour-coded statuses, a day-detail panel, and windowed fetching so only the visible range loads.

👉 **Lesson Scheduling**: Create, edit, cancel, and delete lessons, link them to repertoire, and block accidental duplicates for the same student and slot.

👉 **Recurring Lessons**: Generate a weekly slot across one or two months, computed on a UTC civil-calendar walk so occurrences land on the right weekday and time regardless of the host machine's timezone.

👉 **Attendance**: Mark a lesson `PENDING` / `COMPLETE` / `CANCELLED` with actual duration, a required cancellation reason, and free-text notes.

👉 **Blossom Scoring**: Optionally rate a completed lesson 1–5 blossoms. Unrated is a real state, not a zero — unrated lessons are excluded from every ranking rather than dragging an average down.

👉 **Ranking Board**: An all-time leaderboard with a podium, score-spread bars, thin-evidence flags, and search/sort. Ranks are decided by the _exact_ average via integer cross-multiplication, so ties are genuine ties and share a rank (1, 1, 3…).

👉 **Students**: Full CRUD on a TanStack table with search, sorting, filters, and persisted view state — plus avatars, notes, and separate in-person and online lesson rates.

👉 **Frozen Rate Snapshots**: Every lesson stores the rate it was booked at. Raise a student's rate and current/future lessons re-price automatically; past months stay exactly as they were billed.

👉 **Families**: Group siblings (or a parent and child) into a named family so their month prints on one combined attendance-and-tuition sheet, ordered however you like.

👉 **Monthly Reports**: Per-student reports with summary, comments, next-month plan, and tuition note — auto-upserted, with a weekly attendance grid and fee totals, and print-to-PDF straight from the browser.

👉 **Combined Family Reports**: One printable sheet per family, sharing the exact same attendance and tuition maths as the single-student report so the numbers can never disagree.

👉 **Payment Tracking**: Per-student, per-month expected vs. received, with multiple transactions, partial payments, methods and notes, payment history, and unpaid/outstanding summaries.

👉 **Repertoire**: A pieces library with level, description, and a 1–5 difficulty rating, plus a count of how many lessons reference each piece.

👉 **Studio Settings**: Profile and avatar, password change, IANA timezone selector, default lesson rates, display currency (VND · IDR · USD · INR), and a five-variant logo picker.

👉 **Timezone Correctness**: Everything is stored in UTC `timestamptz` and bucketed by the teacher's configured timezone on the server — month boundaries, "today", calendar day-counts, and drag-drop writebacks all agree.

👉 **Blossom Diary Design System**: A bespoke ornament set (blossom, petal, sparkle, bow, squiggle), the Mochi studio-cat mascot with three moods, and five swappable logo marks.

👉 **Responsive Shell**: Full sidebar at ≥1280px, an icon rail from 1024–1279px, and an off-canvas sheet with a fixed bottom tab bar below that.

👉 **Layered Error Handling**: Error boundaries, route-level `error.tsx` pages, typed tRPC error codes, a `tryCatch` wrapper for server actions, friendly toasts, and a centralized `logError()` with an optional remote sink.

👉 **Tested Money Logic**: 59 Vitest tests pinning down the parts that are expensive to get wrong — rate resolution, payment maths, ranking ties, attendance weeks, tuition totals, timezone boundaries, and validation schemas.

👉 **Easter Eggs** 🎹: A few hidden rooms are tucked away for whoever finds them. Click Mochi.

## <a name="quick-start">🤸 Quick Start</a>

**Prerequisites**

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en) 22+
- [npm](https://www.npmjs.com/)
- A PostgreSQL database — [Neon](https://neon.tech) works well, local Postgres is fine too

**Cloning the Repository**

```bash
git clone https://github.com/Itzsoham/my-piano-diary.git
cd my-piano-diary
```

**Installation**

```bash
npm install
```

> `postinstall` runs `prisma generate` for you.

**Set Up Environment Variables**

Create a `.env` in the project root (or copy `.env.example`):

```env
# Prisma — PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/my-piano-diary"

# NextAuth — generate one with `npx auth secret`
AUTH_SECRET=""

# Cloudinary — optional, reserved for image upload
CLOUDINARY_URL=""

# Optional error-tracking sink; logError() POSTs here when set
NEXT_PUBLIC_ERROR_TRACKING_URL=""
```

Only `DATABASE_URL` is required in development (`AUTH_SECRET` becomes required in production). Everything is validated at build time by `src/env.js` — pass `SKIP_ENV_VALIDATION=true` to bypass it in Docker-style builds.

**Set Up the Database**

```bash
npm run db:push     # sync the Prisma schema to your database
npm run db:studio   # optional — browse the data
```

> ⚠️ **This repo syncs schema with `prisma db push` only.** The migration history is intentionally out of sync, so `npm run db:generate` / `npm run db:migrate` (`prisma migrate dev` / `deploy`) must **not** be used here. Stop the dev server before running `prisma generate`.

**Running the Project**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on `/login`. Register an account, or hit **🎹 Try the demo** to seed a full sample studio instantly.

## <a name="structure">🗂️ Project Structure</a>

```
src/
├── app/
│   ├── (auth)/               # login · register (public) + the demo seed flow
│   ├── (root)/               # protected shell: sidebar + header + bottom tab bar
│   │   ├── dashboard/        # KPI cards + intelligence panel
│   │   ├── calendar/         # FullCalendar + attendance dialog
│   │   ├── leaderboard/      # all-time ranking board
│   │   ├── lessons/          # month-by-month lesson list
│   │   ├── students/         # student table + families manager
│   │   ├── pieces/           # repertoire table
│   │   ├── reports/          # monthly + family/[familyId] combined reports
│   │   ├── payments/         # per-student, per-month ledger
│   │   └── profile/          # profile · password · studio settings
│   └── api/                  # NextAuth + tRPC route handlers
│
├── server/
│   ├── api/routers/          # student · lesson · report · user · piece
│   │                         # earnings · payment · family · demo
│   ├── auth/                 # NextAuth config (Credentials, JWT callbacks)
│   ├── demo/                 # demo-studio seed data + the 7 seed steps
│   └── db.ts                 # Prisma client singleton
│
├── components/
│   ├── ui/                   # Shadcn/UI + custom primitives
│   ├── blossom/              # Blossom Diary design system + Mochi mascot
│   ├── ranking/              # score podium
│   └── providers/            # provider tree
│
├── lib/
│   ├── ranking.ts            # exact-average ranking + tie handling
│   ├── rate.ts               # online vs. in-person rate resolution
│   ├── payment.ts            # remaining / status / expected / outstanding
│   ├── timezone.ts           # IANA-aware UTC boundary helpers
│   ├── report/               # shared attendance-grid + tuition maths
│   └── validations/          # Zod schemas (auth · common · API)
│
├── trpc/                     # React client, RSC caller, query client
├── proxy.ts                  # cookie-based auth guard
└── env.js                    # validated environment schema
```

## <a name="data-model">🗄️ Data Model</a>

Nine application models plus four NextAuth tables. Every datetime column is `@db.Timestamptz`.

```
User ──1:1──> Teacher ──1:many──> Student ──1:many──> Lesson
                │                    │                   │
                ├──1:many──> Piece ──┼──── pieceId ──────┘
                │                    ├──1:many──> MonthlyReport
                │                    └──1:many──> PaymentMonth ──1:many──> PaymentTransaction
                └──1:many──> Family ──1:many──> FamilyMember ──> Student
```

Three details worth knowing before you touch the schema:

- **`Lesson.rate` is a snapshot**, frozen when the lesson is created from the student's in-person or online rate. Past months never re-price.
- **`Lesson.score` is nullable on purpose.** `null` means "not rated" and is excluded from ranking; it is force-cleared whenever a lesson isn't `COMPLETE`.
- **`Family` is a reporting convenience only.** Grouping siblings changes how a month _prints_; individual students behave identically everywhere else.

## <a name="scripts">🧰 Scripts</a>

| Command                | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`          | Start the dev server (Turbopack)                         |
| `npm run build`        | Production build                                         |
| `npm run preview`      | Build and start, in one step                             |
| `npm start`            | Start the production server                              |
| `npm run db:push`      | Sync the Prisma schema to the database — **use this**    |
| `npm run db:studio`    | Open Prisma Studio                                       |
| `npm run db:generate`  | ⚠️ `prisma migrate dev` — do **not** use in this repo    |
| `npm run db:migrate`   | ⚠️ `prisma migrate deploy` — do **not** use in this repo |
| `npm run check`        | ESLint + `tsc --noEmit` (what CI runs)                   |
| `npm run lint:fix`     | Fix ESLint issues                                        |
| `npm run typecheck`    | TypeScript only                                          |
| `npm run format:write` | Format with Prettier                                     |
| `npm run test`         | Run the Vitest suite                                     |
| `npm run test:watch`   | Vitest in watch mode                                     |
| `npm run test:cov`     | Vitest with v8 coverage                                  |
| `npm run test:tz`      | Timezone suite under a forced non-UTC zone               |

## <a name="testing">🧪 Testing & CI</a>

```bash
npm run test      # 59 tests across 7 files
npm run test:tz   # re-runs the timezone suite under TZ=America/New_York
```

The suite is scoped to `src/lib` — the pure logic where a quiet bug costs real money or credibility: rate resolution, payment status, ranking ties, attendance weeks, tuition totals, timezone boundaries, and Zod schemas. No database is required.

[.github/workflows/ci.yml](.github/workflows/ci.yml) runs `npm run check` and `npm run test` on every push and pull request to `main` (Node 22, no secrets needed — `prisma generate` never touches the database and the tests are pure).

## <a name="docs">📚 Docs</a>

| Document                                             | What's in it                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md)       | Architecture, tech stack, full schema, every tRPC procedure, implemented features |
| [docs/ISSUES_AND_FIXES.md](docs/ISSUES_AND_FIXES.md) | Known issues and bugs, with the fix for each                                      |
| [docs/FUTURE_FEATURES.md](docs/FUTURE_FEATURES.md)   | Roadmap and implementation guides for planned work                                |

Static HTML mockups of every screen live in [public/design-mockups/](public/design-mockups/) — open `index.html` for the gallery, or `styleguide.html` for the Blossom Diary tokens.

## <a name="deploy">🚀 Deploy</a>

Deploy to [Vercel](https://create.t3.gg/en/deployment/vercel): connect the repository, add `DATABASE_URL` and `AUTH_SECRET` as environment variables, and point it at a hosted Postgres such as Neon. Run `npm run db:push` against the production database once before the first deploy — remember, this project does not use `prisma migrate`.
