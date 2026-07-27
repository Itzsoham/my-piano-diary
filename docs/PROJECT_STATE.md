# My Piano Diary - Current Project State

> A personal piano-lesson management diary. **Single user** — one teacher (you) manages students, schedules lessons, tracks attendance, records payments, and generates monthly reports. Students are records you manage, **not** logins; there is no multi-teacher / multi-tenant mode.

**Version**: 1.0.0 | **Status**: ~90% Complete | **Last Updated**: July 27, 2026

> Known bugs are tracked in `ISSUES_AND_FIXES.md`; planned work is in `FUTURE_FEATURES.md`.

---

## Tech Stack

| Layer         | Technology                                                     |
| ------------- | -------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router), React 19                             |
| Language      | TypeScript 5.8 (strict mode)                                   |
| API           | tRPC 11 with `httpBatchStreamLink` + SuperJSON transformer     |
| Database      | PostgreSQL (Neon) via Prisma 6.19, all datetimes `timestamptz` |
| Auth          | NextAuth.js 5 beta (JWT strategy) — Credentials only           |
| Server State  | React Query 5 (`@tanstack/react-query`) via tRPC adapter       |
| Client State  | Zustand 5 (persisted to `localStorage`) — the **only** Zustand store is the user store; currency/logo-variant use lighter `localStorage` hooks (see Zustand Stores section) |
| UI            | Tailwind CSS 4, Shadcn/UI, Radix UI primitives                 |
| Forms         | React Hook Form 7 + Zod 3 + `@hookform/resolvers`              |
| Charts        | Recharts 2                                                     |
| Calendar      | FullCalendar 6 (daygrid, timegrid, interaction plugins)        |
| Animation     | Framer Motion 12, canvas-confetti                              |
| Date Handling | date-fns 4, date-fns-tz 3 (IANA timezone support)              |
| Notifications | Sonner 2 (toast)                                               |
| Tables        | TanStack React Table 8                                         |
| Serialization | SuperJSON 2 (for tRPC + React Query dehydration)               |
| Testing       | Vitest 4 + `@vitest/coverage-v8` (42 tests, scoped to `src/lib`); CI via GitHub Actions |
| Bundler       | Turbopack — default for both `next dev` and `next build` in this Next version (no `--webpack`/`--turbopack` flag set) |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Providers wrapper, fonts, theme)
│   ├── page.tsx                  # Root → redirect("/dashboard")
│   ├── error.tsx                 # Global error boundary page
│   ├── not-found.tsx             # 404 page
│   ├── loading.tsx               # Global loading state
│   │
│   ├── (auth)/                   # Auth route group (public, no sidebar)
│   │   ├── error.tsx
│   │   ├── login/page.tsx        # Login form (redirects if already authed) + "🎹 Try the demo" seed flow
│   │   ├── register/page.tsx     # Register form (redirects if already authed)
│   │   └── _components/          # LoginForm, RegisterForm, AuthArtPanel, DemoSeedProgress, social-auth/GoogleButton (unused, no provider wired)
│   │
│   ├── (root)/                   # Protected route group (auth-gated, sidebar layout)
│   │   ├── layout.tsx            # AppSidebar + SiteHeader + BottomTabBar layout, birthday ambience
│   │   ├── error.tsx
│   │   ├── _components/          # AppSidebar, NavMain, NavUser, NavAction, SiteHeader, BottomTabBar
│   │   ├── dashboard/             # Own route folder; _components/: dashboard-hero, section-cards, dashboard-intelligence-panel, dashboard-top-students-card (ranked by avg score), dashboard-quick-insights-card, dashboard-earnings-trend-card, today-lessons-table, birthday-countdown-card
│   │   ├── students/               # Student CRUD table + _components/families-manager.tsx (Families tab); [id]/reports/ holds a shared report-view component only (no page.tsx there)
│   │   ├── calendar/               # FullCalendar view with lesson CRUD + attendance dialog (incl. blossom score rating)
│   │   ├── lessons/                # Lessons list with month navigation
│   │   ├── pieces/                 # Music pieces CRUD table
│   │   ├── reports/                # Monthly student reports (+ [studentId]/ detail, + family/[familyId]/ combined sibling report)
│   │   ├── payments/               # Per-student, per-month payment tracking
│   │   ├── profile/                # Profile / Password / Teacher Settings (timezone, rates, currency, logo picker)
│   │   ├── notifications/          # Coming soon placeholder
│   │   └── updates/                # Coming soon + hidden /forever + /birthday-room easter-egg links
│   │
│   ├── forever/                    # Hidden, unrelated personal/romantic easter-egg page
│   ├── birthday-game/, birthday-game/rewards/, birthday-room/  # Hidden birthday easter-egg pages (thin server wrappers → src/components/birthday/*)
│   │
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth route handler
│       └── trpc/[trpc]/          # tRPC fetch handler (httpBatchStreamLink endpoint)
│
├── server/                       # All backend code
│   ├── db.ts                     # Prisma client singleton
│   ├── api/
│   │   ├── trpc.ts               # tRPC init, context, publicProcedure, protectedProcedure
│   │   ├── root.ts               # appRouter: { student, lesson, report, user, piece, earnings, payment, family, demo }
│   │   └── routers/              # Individual feature routers, incl. family.ts + demo.ts (see API section)
│   ├── demo/                      # Demo-studio seeding (unauthenticated, public procedures only)
│   │   ├── demo-data.ts           # DEMO_EMAIL/PROTECTED_EMAILS + seeded students/pieces/families/copy
│   │   └── seed-steps.ts          # The 7 step functions backing the demo router
│   ├── auth/
│   │   ├── config.ts             # NextAuth config (Credentials provider, JWT callbacks)
│   │   └── index.ts              # Exports: auth (cached), handlers, signIn, signOut
│   ├── actions/
│   │   └── auth-actions.ts       # loginAction, registerAction (server actions)
│   ├── api-error-handler.ts      # withApiHandler() wrapper for API routes
│   ├── server-action-error-handler.ts
│   └── validation-middleware.ts
│
├── components/
│   ├── ui/                       # 36 Shadcn/UI + custom components
│   ├── blossom/                   # v2 "Blossom Diary" design system (new) — see UI Components section
│   │   ├── blossom.tsx             # Blossom/Petal/Sparkle/Bow/Squiggle decorative SVGs
│   │   ├── logo-mark.tsx           # LogoMark({variant}) — blossom/mochi/kitty/sakura-keys/diary-keys badge
│   │   └── mochi.tsx                # Mochi/MochiPeek studio-cat mascot; meows via lib/meow-sound on click
│   ├── birthday/                   # Personal easter-egg surface (8 files) — see UI Components section
│   ├── providers/
│   │   ├── index.tsx             # Root Providers tree (see Providers section)
│   │   └── user-store-provider.tsx # Syncs NextAuth session → Zustand
│   ├── error-boundary.tsx        # React error boundary component
│   └── lessons/
│       ├── lesson-dialog.tsx     # Create lesson dialog
│       └── lesson-edit-dialog.tsx # Edit lesson dialog
│
├── lib/
│   ├── utils.ts                  # cn(), misc helpers
│   ├── types.ts                  # Placeholder module (`export {}`)
│   ├── format.ts                 # Date/time + currency formatting utilities
│   ├── currency.ts               # Currency preference — localStorage hook, `useCurrency()`
│   ├── logo-preference.ts        # Logo-variant preference — localStorage hook, `useLogoVariant()`
│   ├── meow-sound.ts             # playMeow() — clones an <audio> template, plays public/sounds/meow.mp3
│   ├── rate.ts                   # Per-lesson rate resolution (online vs in-person)
│   ├── payment.ts                # calculateRemaining / derivePaymentStatus / expectedByMonth / summarizeOutstanding
│   ├── timezone.ts               # Timezone utilities (isValidTimezone, getStartOfMonthUTC, …)
│   ├── error-handler.ts          # logError() centralized error logging
│   ├── use-filter-params.ts      # useFilterParams() — URL query string as source of truth for page filters
│   ├── report/                    # Shared report math — single-student report + family combined report
│   │   ├── attendance.ts           # buildWeeksData / hasSixthWeek / resolveWeeks — weekly attendance grid
│   │   └── tuition.ts              # summarizeGroup / computeTuition — online vs in-person fee totals + rate exceptions
│   └── validations/
│       ├── auth-schemas.ts       # loginSchema, registerSchema
│       ├── common-schemas.ts     # Reusable base schemas (id, date, pagination, student, lesson)
│       └── api-schemas.ts        # Full API-layer schemas (lesson, piece, recurring, payment, markAttendance incl. score)
│
├── trpc/
│   ├── react.tsx                 # api = createTRPCReact<AppRouter>(); TRPCReactProvider
│   ├── server.ts                 # RSC server caller + HydrateClient for SSR hydration
│   └── query-client.ts           # createQueryClient() with 5-min staleTime + SuperJSON dehydration
│
├── store/
│   └── use-user-store.ts         # Zustand: { user } persisted to localStorage (`"user-storage"`) — the only Zustand store
│
├── hooks/
│   ├── use-error-handler.ts      # useErrorHandler(), useAsyncError()
│   ├── use-mobile.ts             # useIsMobile() — watches matchMedia, 1024px breakpoint
│   └── use-table-view-persistence.ts # Persists a list page's viewMode + column filters to sessionStorage
│
├── config/app-config.ts          # App metadata constants + BIRTHDAY_CONFIG
├── proxy.ts                      # Cookie-based auth guard (Next.js proxy/middleware)
├── env.js                        # @t3-oss/env-nextjs: DATABASE_URL, AUTH_SECRET, CLOUDINARY_URL, NEXT_PUBLIC_ERROR_TRACKING_URL
└── styles/globals.css            # Tailwind directives + global styles
```

> `src/components/dashboard-container.tsx` and `src/components/error-test-panel.tsx` exist at the top level but have zero imports anywhere in `src/` — apparently orphaned/dev-only, not part of any route.

---

## Database Schema

**13 models** (9 app + 4 NextAuth) + `LessonStatus` enum. All datetime fields use `@db.Timestamptz` for proper timezone handling.

```
User ──1:1──> Teacher ──1:many──> Student ──1:many──> Lesson
                │                    │                    │
                ├──1:many──> Piece ──┼──── pieceId ───────┘
                │                    ├──1:many──> MonthlyReport
                ├──1:many──> Lesson  ├──1:many──> PaymentMonth ──1:many──> PaymentTransaction
                ├──1:many──> PaymentMonth
                ├──1:many──> PaymentTransaction
                └──1:many──> Family ──1:many──> FamilyMember ──studentId──> Student
```

| Model                | Key Fields                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`               | `id`, `name?`, `email? (unique)`, `emailVerified?`, `image?`, `password?`, `timezone (default "UTC")`, `createdAt`                                                                          |
| `Account`            | Standard NextAuth OAuth fields; `@@unique([provider, providerAccountId])`                                                                                                                   |
| `Session`            | `sessionToken (unique)`, `userId`, `expires`                                                                                                                                                |
| `VerificationToken`  | `identifier`, `token (unique)`, `expires`                                                                                                                                                   |
| `Teacher`            | `id`, `userId (unique → User)`, `timezone (default "UTC")`, `createdAt`. **Note**: `Teacher.timezone` still exists but is legacy — `User.timezone` (carried in the session) is the source of truth actually used. |
| `Student`            | `id`, `teacherId → Teacher`, `name`, `avatar?`, `notes?`, `lessonRate (int, default 0)`, `onlineLessonRate (int, default 0)`, `createdAt`                                                    |
| `Piece`              | `id`, `teacherId → Teacher`, `title`, `description?`, `level?`, `difficulty? (int 1–5)`, `createdAt`                                                                                         |
| `Lesson`             | `id`, `studentId → Student (cascade)`, `teacherId → Teacher (cascade)`, `date (timestamptz)`, `duration (min)`, `status (LessonStatus, default PENDING)`, `isOnline (bool)`, `rate (int, snapshot)`, `actualMin?`, `cancelReason?`, `note?`, `score? (int 1–5, nullable — lesson-quality "blossom" rating, only meaningful when status=COMPLETE)`, `pieceId? → Piece (SetNull)`, `createdAt` |
| `MonthlyReport`      | `id`, `studentId → Student (cascade)`, `month`, `year`, `summary?`, `comments?`, `nextMonthPlan?`, `tuitionNote?`, `lessonMetadata (Json, default {})`, `createdAt`, `updatedAt`; `@@unique([studentId, month, year])` |
| `PaymentMonth`       | `id`, `studentId → Student (cascade)`, `teacherId → Teacher (cascade)`, `month`, `year`, `expectedAmount (int)`, `createdAt`, `updatedAt`; `@@unique([studentId, month, year])`             |
| `PaymentTransaction` | `id`, `paymentMonthId → PaymentMonth (cascade)`, `studentId (cascade)`, `teacherId (cascade)`, `amount (int)`, `method?`, `note?`, `date`, `createdAt`, `updatedAt`                          |
| `Family`             | `id`, `teacherId → Teacher (cascade)`, `name`, `createdAt`, `updatedAt`. **New** — a named bundle of students (e.g. siblings) so their monthly attendance/tuition prints on one combined sheet; purely a reporting/billing convenience, individual students are unaffected elsewhere. |
| `FamilyMember`       | `id`, `familyId → Family (cascade)`, `studentId → Student (cascade)`, `position (int, default 0 — display/print order on the combined sheet)`; `@@unique([familyId, studentId])`. **New**    |

**LessonStatus enum**: `PENDING` | `COMPLETE` | `CANCELLED`

**Rate snapshotting**: each `Lesson.rate` is frozen at create/update time from the student's `lessonRate` (in-person) or `onlineLessonRate` (online). Past months never re-price when a student's rate later changes — except `lesson.update` deliberately re-derives + re-stamps `rate` (even on past lessons) when `isOnline` is toggled; see the `lesson` router reference below.

**Lesson scoring**: `Lesson.score` (1–5, nullable) is the teacher's optional per-lesson quality rating, set via `lesson.markAttendance`. It's force-cleared to `null` whenever a lesson's status isn't `COMPLETE`, and is excluded from the dashboard's "Top Students" ranking when unset.

**DB Indexes**: `@@index([teacherId, date])` / `@@index([studentId, date])` / `@@index([pieceId])` on Lesson; `@@index` on PaymentMonth (`[teacherId, month, year]`, `[studentId, year]`) and PaymentTransaction (`[teacherId, date]`, `[studentId, date]`, `[paymentMonthId]`); `@@index([teacherId])` on Family, `@@index([studentId])` on FamilyMember.

> `Lesson.student` / `Lesson.teacher` are `onDelete: Cascade` and `Lesson.piece` is `onDelete: SetNull` — the old FK-cascade bug (`ISSUES_AND_FIXES.md` #1, deleting a student with lessons used to fail) is fixed; verified directly against `prisma/schema.prisma` this pass. `Family`/`FamilyMember` cascades are consistent the same way.

---

## tRPC Architecture

> tRPC 11 provides end-to-end type safety between server and client. Every procedure is strongly typed from input (Zod schema) through to the React Query hook.

### Transport & Serialization

- **Link**: `httpBatchStreamLink` — batches concurrent calls into one HTTP request; supports streaming
- **Transformer**: SuperJSON — handles `Date`, `Map`, `Set` across the wire
- **Endpoint**: `POST /api/trpc/*` (handled by `fetchRequestHandler`)

### Procedure Types

| Procedure Type       | Usage                                                    | Auth Required |
| -------------------- | -------------------------------------------------------- | ------------- |
| `publicProcedure`    | Timing middleware only, no auth check — used **only** by the `demo` router, which must be callable pre-login from the `/login` page's "🎹 Try the demo" flow | No            |
| `protectedProcedure` | Timing middleware + session check — throws `UNAUTHORIZED` if no session; used by every other router | Yes           |

Every router procedure uses `protectedProcedure` **except** `demo`'s 7 steps, which are all `publicProcedure`. Safety there is enforced inside `src/server/demo/seed-steps.ts` (every write is scoped to one hardcoded demo-teacher record resolved by `DEMO_EMAIL`), not by tRPC auth — see the `demo` router entry below.

### Router Structure (`src/server/api/root.ts`)

```ts
appRouter = createTRPCRouter({
  student,  // student.ts
  lesson,   // lesson.ts
  report,   // report.ts
  user,     // user.ts
  piece,    // piece.ts
  earnings, // earnings.ts
  payment,  // payment.ts
  family,   // family.ts  — new
  demo,     // demo.ts    — new, public procedures
});
```

---

## tRPC Routers — Procedure Reference

### `student` router

| Procedure   | Type     | Notes                                                              |
| ----------- | -------- | ------------------------------------------------------------------ |
| `getAll`    | query    | All students for teacher (with `_count.lessons`)                   |
| `getByGuid` | query    | Single student + recent lessons + teacher info                     |
| `create`    | mutation | `{ name, avatar?, notes?, lessonRate?, onlineLessonRate? }`; auto-creates Teacher if missing |
| `update`    | mutation | Updates student (incl. both rates); verifies ownership. If a rate changed, bulk re-prices that student's **current + future** lessons still billed at the old rate (past months stay frozen; per-lesson manual overrides are left alone) |
| `delete`    | mutation | Deletes student; verifies ownership (FK bug #1 is fixed — see Database Schema section) |

### `lesson` router

`getAll` · `getForMonth` (timezone-aware boundaries) · `getInRange` · `create` (blocks duplicate student+date, snapshots rate) · `update` (re-derives + re-stamps `rate` when `isOnline` changes — deliberately re-prices even past lessons, unlike `student.update`'s bulk re-price) · `delete` · `markAttendance` (`{ status, isOnline?, rate?, actualMin?, cancelReason?, note?, score? }`; rate priority: explicit `rate` input wins > else re-derived from `isOnline` if supplied > else unchanged; **`score`** is the 1–5 "blossom" quality rating — force-cleared to `null` whenever `status !== "COMPLETE"`, otherwise set to whatever was sent, including `null` to explicitly unrate) · `createRecurring` (weekly, 1–2 months, IANA timezone via `date-fns-tz`, UTC civil-calendar walk so occurrences don't shift by host TZ).

### `piece` router

`getAll` · `getById` · `create` · `update` · `delete`.

### `report` router

`getAll` · `generatePreview` (COMPLETE lessons + totals) · `getStudentReport` · `getByMonth` · `upsertReport` · `delete`. Reports carry `tuitionNote` + `lessonMetadata`.

### `earnings` router

| Procedure                  | Notes                                                                        |
| -------------------------- | ---------------------------------------------------------------------------- |
| `getDashboard`             | `{ totalEarnings, currentMonthEarnings, currentMonthLoss, totalStudents, lastMonthCollected, lastMonthOutstanding }` — timezone-aware |
| `getTodayLessons`          | Today's lessons (timezone-aware day) with per-lesson `earnings`              |
| `getByStudent`             | Current-month COMPLETE lessons grouped by student                            |
| `getTopStudentsThisMonth`  | **Changed** — ranks by **average `score`** this month, not lesson count/earnings: only COMPLETE lessons with a non-null `score` count; a student with zero rated lessons this month doesn't appear at all. Sorted by avgScore desc, then ratedCount desc, then name; standard competition ranking (1,1,3,…) so students tied on avgScore share a rank (fixed 2026-07-23, commit `d3d148b`) |
| `getQuickInsights`         | Headline insight metrics for the dashboard panel                             |
| `getEarningsTrendThisMonth`| Trend series for the dashboard chart                                         |

### `payment` router

| Procedure           | Notes                                                                           |
| ------------------- | ------------------------------------------------------------------------------- |
| `getForMonth`       | All students' payment rows for a month (expected vs received, status)           |
| `getOverallSummary` | All-time totals for the dashboard tile (see netting bug #5)                     |
| `getUnpaidSummary`  | Per-month outstanding across students                                           |
| `getStudentHistory` | Payment history for one student (see stale-snapshot bug #4)                     |
| `addTransaction`    | Record a payment against a student's month (creates `PaymentMonth` if needed)   |
| `updateTransaction` | Edit a transaction                                                              |
| `deleteTransaction` | Remove a transaction                                                            |

### `user` router

`getProfile` · `updateProfile` (`{ name, email, image? }`) · `updateTimezone` (validates IANA via `isValidTimezone`) · `updatePassword` (bcrypt verify → rehash).

### `family` router — **new**

| Procedure           | Notes                                                                              |
| -------------------- | ---------------------------------------------------------------------------------- |
| `getAll`             | Teacher's families, each with ordered members (`position` asc) + student summary   |
| `create`             | `{ name (1–100 chars), memberIds: 2–20 ids }`; de-dupes ids, verifies every id belongs to the teacher, throws if fewer than 2 unique students remain |
| `update`             | Rename and/or fully **replace** membership — when `memberIds` is given it wipes and recreates all `FamilyMember` rows (not diffed/patched), inside a transaction |
| `delete`             | Deletes the family (members cascade)                                               |
| `getCombinedReport`  | `{ familyId, month, year }` → per-member lessons for the month (timezone-aware via `teacher.user.timezone`); fee/attendance totals are computed **client-side** using the same `src/lib/report/attendance.ts` + `tuition.ts` helpers as the single-student report, so the numbers always match |

### `demo` router — **new, all `publicProcedure` (no auth)**

Backs the "🎹 Try the demo" one-click flow on `/login` (`src/server/demo/seed-steps.ts` + `demo-data.ts`). None of the 7 steps take input; the client calls them sequentially with live per-step progress (`DemoSeedProgress`). Every write is scoped to one hardcoded demo teacher (`DEMO_EMAIL = "demo@pianodiary.dev"`), which every step but `setup` resolves and refuses to touch if it were ever repointed to an entry in `PROTECTED_EMAILS`:

`setup` (hashes the demo password, upserts the demo User/Teacher, **wipes all prior demo data**, recreates Pieces) → `students` (bulk-creates from `DEMO_STUDENTS`) → `families` (creates `Family`/`FamilyMember` rows) → `lessons` (deterministic seeded RNG assigns each student a stable weekly slot, all `PENDING`, rate snapshotted like `lesson.create`) → `attendance` (seeded RNG resolves past lessons to 85% COMPLETE / 15% CANCELLED) → `reports` (upserts a `MonthlyReport` for last month, first 8 students) → `payments` (seeded RNG creates `PaymentMonth` + `PaymentTransaction` rows with a deliberately mixed UNPAID/PARTIAL/PAID spread).

---

## React Query Integration

> tRPC is wired into React Query 5 via `@trpc/react-query`. All tRPC hooks are React Query hooks under the hood.

### QueryClient Configuration (`src/trpc/query-client.ts`)

- `staleTime: 5 * 60 * 1000` (5 min) — data stays fresh, avoids refetch on re-mount
- `dehydrate` / `hydrate` use `SuperJSON.serialize` / `deserialize`
- `shouldDehydrateQuery` includes `pending` queries → enables streaming SSR

> ⚠️ No global `QueryCache.onError` / `throwOnError` yet, so failed list queries render as empty states rather than errors (see `ISSUES_AND_FIXES.md` #8).

**Singleton pattern**: browser reuses a module-level QueryClient; server creates a fresh instance per request.

### SSR Hydration Pattern

Server components call `void api.procedure.prefetch()` to warm the cache; `HydrateClient` dehydrates and streams it to the client. Pages using SSR prefetch: `lessons`, `students`, `pieces`, `reports`.

### Cache Invalidation

```ts
const utils = api.useUtils();
await utils.lesson.invalidate();        // refetch all lesson queries
await utils.student.getAll.invalidate(); // targeted
```

---

## Providers Tree

```
ErrorBoundary (componentName="RootProviders")
  └── SessionProvider (next-auth/react)
        └── TRPCReactProvider
              └── UserStoreProvider
                    ├── {children}
                    └── Toaster (sonner)
```

**`UserStoreProvider`**: listens to NextAuth session via `useSession`; on `"authenticated"` → `setUser` in Zustand. Has an `isHydrated` gate to prevent SSR hydration mismatch.

---

## Authentication

### Strategy

- **NextAuth v5 beta** — JWT session strategy (no DB sessions)
- **Credentials provider only** — email + bcrypt password (no Google)
- **JWT/session callbacks** copy `id`, `image`, `timezone` between token and `session.user`
- Module augmentation: `Session.user` has `id: string` + `timezone: string`

### Route Protection

**`src/proxy.ts`** uses a fast cookie-check approach (no NextAuth `auth()` call, to avoid edge-runtime issues):

1. Checks for any auth session cookie (`authjs.session-token`, `__Secure-*`, legacy `next-auth.*`)
2. Public paths (`/login`, `/register`, `/forever`) always pass through
3. No cookie + non-public path → redirect `/login`
4. Has cookie + on `/login` or `/register` → redirect `/dashboard`
5. Matcher excludes API routes, `_next/*`, static media

> There is **no** rate limiting / brute-force protection on auth yet (see `ISSUES_AND_FIXES.md` #19–#21).

### Server Actions (`src/server/actions/auth-actions.ts`)

- `loginAction(formData)` — validates via `loginSchema` → `signIn("credentials", …)`
- `registerAction(formData)` — validates via `registerSchema` → checks email uniqueness → bcrypt hash (rounds=10) → creates User → `loginAction`

Both catch `AuthError` and return structured `{ success, message }` — never throw to client.

---

## Timezone Handling

- **Storage**: all datetimes are UTC in `@db.Timestamptz` columns.
- **Source of truth**: `User.timezone` (IANA string), carried in the NextAuth JWT → `ctx.session.user.timezone` (also available client-side via `useSession()`).
- **Helpers** (`src/lib/timezone.ts`): `getStartOfDayUTC`, `getEndOfDayUTC`, `getStartOfMonthUTC`, `getEndOfMonthUTC`, `createDateInTimezone`, `isSameDayInTimezone`, `formatInTimezone`, `toUTC`/`fromUTC`, `isValidTimezone`.
- **Server queries** bucket lessons/reports/earnings by the configured session timezone using those helpers.
- **Client display** reads the configured timezone from the session and renders in it: the dashboard "today" table (`formatInTimezone` / `isSameDayInTimezone`) and the calendar (events/day-counts shifted with `fromUTC`; drag-drop written back with `toUTC`). So a lesson shows on the same day everywhere even when the browser TZ differs from the configured one.

> Note: `formatInTimezone` must convert the instant with `toZonedTime` before formatting — `date-fns-tz`'s `format(instant, …, { timeZone })` alone renders the runtime's local time and only applies `timeZone` to zone-name tokens. The helper does this internally; call it with a raw UTC `Date`.

> `createRecurring` computes occurrences host-independently (a UTC civil-calendar cursor → `createDateInTimezone`), so recurring lessons land on the correct weekday/time in both production (UTC) and non-UTC dev machines. (Formerly `ISSUES_AND_FIXES.md` #7, fixed 2026-07-06.)

---

## Page Routes

| URL                    | Server/Client | Description                                                                    |
| ---------------------- | ------------- | ----------------------------------------------------------------------------- |
| `/`                    | Server        | `redirect("/dashboard")`                                                       |
| `/login` `/register`   | Server        | Redirect to `/dashboard` if already authed; `/login` also renders the "🎹 Try the demo" one-click seed flow (7 sequential `demo.*` mutations) |
| `/dashboard`           | Server shell + Client | Own route folder (`dashboard/_components/`); hero + section cards + intelligence panel (today's lessons, quick insights, earnings trend, **top students ranked by avg lesson score**) |
| `/lessons`             | Server+Client | SSR prefetch `student.getAll` + `lesson.getAll`; client month navigation      |
| `/students`            | Server+Client | SSR prefetch `student.getAll`; TanStack table + **Families manager** (create/edit sibling groupings, links to the combined report) |
| `/calendar`            | Client        | FullCalendar with `lesson.getInRange` + `student.getAll`; attendance dialog now includes the 1–5 "blossom" score rating |
| `/pieces`              | Server+Client | SSR prefetch `piece.getAll`; TanStack table                                   |
| `/reports`             | Server+Client | Month/year + `?studentId`; redirects to `/reports/[studentId]`                 |
| `/reports/[studentId]` | Server+Client | Single student's monthly report view/edit                                      |
| `/reports/family/[familyId]` | Server shell + Client | **New** — combined/printable report for a `Family` (siblings billed together); `CombinedReportView` fetches via `family.getCombinedReport` |
| `/payments`            | Server+Client | Per-student, per-month payment tracking + transactions                         |
| `/profile`            | Client        | Tabs: Profile (name/email/avatar), Password, Teacher Settings (timezone, rates, currency, **logo picker**) |
| `/notifications` `/updates` | Client   | `ComingSoon` placeholders (`/updates` also hides a birthday-card reveal + door link → `/birthday-room` when birthday mode is active) |
| `/forever`             | Client        | Hidden, unrelated personal/romantic easter egg (relationship timer, photo gallery, music player); manual "Enable Birthday Mode" toggle |
| `/birthday-game`, `/birthday-game/rewards`, `/birthday-room` | Server wrapper → Client | Hidden birthday mini-game + rewards + passcode-gated room (`src/components/birthday/`); outside the `(root)` sidebar shell, but still behind the `proxy.ts` login gate (only `/login`, `/register`, `/forever` are public paths) |

---

## UI Components

### `src/components/ui/` (Shadcn/UI + Custom) — 36 files

`app-loader`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `chart`, `checkbox`, `coming-soon`, `confirm-dialog`, `data-table`, `date-picker`, `dialog`, `drawer`, `dropdown-menu`, `error-state`, `form`, `input`, `label`, `popover`, `refresh-overlay`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `star-rating`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip` — plus a shared `DataTable` used by the students & pieces tables.

- **`refresh-overlay.tsx`** (new) — `RefreshOverlay({ active, label })`, a small fading pill shown top-right of a list while a React Query background refetch keeps stale data on screen (`placeholderData: keepPreviousData`), instead of blanking the table.
- **`star-rating.tsx`** now renders the `Blossom` ornament (see below) instead of a star icon internally — it's the widget behind the `Lesson.score` (1–5) "blossom" rating in the attendance dialog; still named/exported as "star rating" in code.

### `src/components/blossom/` — v2 "Blossom Diary" design system (new)

Ported from the design mockups (`public/design-mockups/dashboard-e.html`); load-bearing across ~30+ files, not a one-off:
- **`blossom.tsx`** — `Blossom`, `Petal`, `Sparkle`, `Bow`, `Squiggle`: decorative `aria-hidden` SVGs sized via a `size` prop (default `"1em"`), colored via `currentColor`. Used as heading ornaments, timeline nodes, bullets, podium crowns, chart peaks, and inside `star-rating.tsx`.
- **`logo-mark.tsx`** — `LogoMark({ variant, size })`, a 64×64 gradient badge with 5 selectable variants: `blossom` (default), `mochi`, `kitty`, `sakura-keys`, `diary-keys`. Rendered in the sidebar header and the login art panel via `useLogoVariant()`.
- **`mochi.tsx`** — `Mochi` (full studio cat at a piano, `mood: "content" | "delighted" | "sleepy"`) and `MochiPeek` (head + paws only, positioned over a card's top edge). **Every rendered instance plays `playMeow()` (`src/lib/meow-sound.ts`) on click**, app-wide, across ~24 files.

### `src/components/birthday/` — personal easter-egg surface (new, not a teacher-facing feature)

8 files (~3,300 lines) backing the hidden `/forever`, `/birthday-game`, `/birthday-game/rewards`, `/birthday-room` routes: `birthday-provider.tsx` (`useBirthday()` context + full-screen activation overlay), `birthday-background.tsx` + `floating-elements.tsx` (ambient decoration), `birthday-banner.tsx` (dismissible banner), `birthday-game-page.tsx` (quiz + memory-match mini-game), `birthday-rewards-page.tsx` (flip-to-reveal reward cards), `birthday-room-page.tsx` (passcode-gated gift reveal). `birthday-reveal-page.tsx` is defined but **not imported anywhere in `src/app/`** — dead code as of this pass.

---

## Zustand Stores

- `use-user-store.ts` — `{ user: { id, name?, email?, image? } | null }`, persisted (`"user-storage"`); populated by `UserStoreProvider` from the NextAuth session. **This is the only Zustand store in the app** — `src/store/use-currency-store.ts` does not exist (a previous version of this doc referenced it in error).
- Currency and logo-variant preferences are **not** Zustand — they're lighter per-browser `localStorage` hooks sharing the same hydration pattern (state starts at a fixed default on the server, hydrates from storage in a `useEffect` after mount to avoid an SSR mismatch): `useCurrency()` (`src/lib/currency.ts`, key `"mpd.currency"`) and `useLogoVariant()` (`src/lib/logo-preference.ts`, key `"mpd.logo-variant"`).

---

## Error Handling

| Layer               | Mechanism                                                                    |
| ------------------- | ---------------------------------------------------------------------------- |
| API routes          | `withApiHandler()` wrapper — typed JSON responses                            |
| Server actions      | `tryCatch` wrapper in `server-action-error-handler.ts`                       |
| tRPC procedures     | Standard tRPC error codes (`UNAUTHORIZED`, `NOT_FOUND`, `BAD_REQUEST`, …)    |
| React rendering     | `ErrorBoundary` wrapping layout subtrees                                     |
| Global pages        | `error.tsx` at root, `(auth)`, and `(root)` levels; `not-found.tsx`          |
| Client hooks        | `useErrorHandler` + `useAsyncError`                                          |
| Centralized logging | `logError()` in `src/lib/error-handler.ts`                                   |

---

## Environment Variables (`src/env.js`)

Validated with `@t3-oss/env-nextjs`:

| Variable         | Scope  | Required                  | Purpose                             |
| ---------------- | ------ | ------------------------- | ----------------------------------- |
| `DATABASE_URL`   | Server | Yes                       | PostgreSQL connection string (Neon) |
| `AUTH_SECRET`    | Server | Prod only                 | NextAuth JWT signing secret         |
| `CLOUDINARY_URL` | Server | No                        | Image upload (future feature)       |
| `NODE_ENV`       | Server | No (default: development) | Environment flag                    |
| `NEXT_PUBLIC_ERROR_TRACKING_URL` | Client | No | **New** — optional error-tracking sink; when set, `logError()` (`src/lib/error-handler.ts`) POSTs error payloads here from both server and client. Swap for a Sentry DSN later. |

Exactly one `NEXT_PUBLIC_*` client variable (`NEXT_PUBLIC_ERROR_TRACKING_URL`, optional — the doc previously said there were none). Empty strings treated as `undefined`. Skip validation with `SKIP_ENV_VALIDATION=true`.

---

## Implemented Features

- **Auth** ✅ — email/password register + login, bcrypt (10 rounds), JWT sessions, cookie-check route guard, auto Teacher creation, per-user timezone.
- **Student management** ✅ — CRUD via shared `DataTable`; avatar, notes, in-person + online lesson rates.
- **Lesson scheduling** ✅ — create/update/cancel, link to pieces, block duplicate student+date, recurring creation (weekly, 1–2 months, IANA-timezone), filter by range/status.
- **Attendance** ✅ — `PENDING`/`COMPLETE`/`CANCELLED`, actual duration, cancel reason + notes, inline `markAttendance`.
- **Calendar** ✅ — FullCalendar 6, `getInRange` windowed fetch, create/edit/delete, color-coded by status; events render in the configured timezone.
- **Monthly reports** ✅ — summary / comments / next-month plan / tuition note, auto-save upsert, preview with attendance + fee totals, print-to-PDF, per-student route.
- **Music pieces** ✅ — CRUD, star difficulty (1–5), lesson-link count.
- **Earnings dashboard** ✅ — live section cards + intelligence panel (today, quick insights, trend chart, top students); timezone-aware.
- **Payment tracking** ✅ — per-student, per-month expected vs received, partial payments, transactions, history, unpaid/outstanding summaries. *(See money-correctness bugs #4/#5/#10.)*
- **Currency** ✅ — selectable display currency (persisted) with shared formatters.
- **Profile/settings** ✅ — edit profile, timezone selector, change password, lesson rates.
- **Error handling** ✅ — multi-layer with user-friendly toasts.
- **UI/UX** ✅ — responsive sidebar shell (full sidebar ≥1280px → icon rail 1024–1279px → off-canvas sheet + fixed bottom tab bar <1024px), dark/light theme (next-themes), Sonner toasts, inline validation, skeletons, Framer Motion.
- **Families / combined billing** ✅ — group siblings into a `Family`, printable combined attendance + tuition sheet at `/reports/family/[familyId]`, shares fee/attendance math with the single-student report via `src/lib/report/`.
- **Lesson quality scoring** ✅ — rate a `COMPLETE` lesson 1–5 (the "blossom" rating) from the attendance dialog; the dashboard "Top Students" leaderboard ranks by average score among rated lessons, with tie-aware ranking.
- **One-click demo studio** ✅ — "🎹 Try the demo" on `/login` seeds a full demo teacher (students, families, lessons, attendance, reports, payments) via 7 sequential `demo.*` mutations with live per-step progress.
- **Blossom Diary v2 redesign** ✅ — full visual redesign: blossom ornament set, Mochi mascot (meows on click), 5-variant logo picker, the responsive sidebar shell above.
- **Easter eggs** 🎹 — `/forever` (unrelated personal page) + `/birthday-game` + `/birthday-game/rewards` + `/birthday-room`; Mochi meows when clicked, app-wide.

---

## Not Yet Implemented

| Feature                 | Notes                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| Student detail page     | `students/[id]/reports/` has a report-view component but no `page.tsx` |
| Notifications           | Placeholder page only                                              |
| Updates / changelog     | Placeholder page only                                              |
| Cloudinary image upload | `CLOUDINARY_URL` defined but not wired up                          |
| Server-side pagination  | Lists fetch all rows + paginate client-side (deferred; fine at single-user scale — `ISSUES_AND_FIXES.md` #23); also true of the new `family.getAll` |

See `FUTURE_FEATURES.md` for the planned roadmap.

---

## Quick Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build (Turbopack by default in this Next version)
npm run preview      # Production build + start, in one step
npm start            # Start production server
npm run db:push      # Push schema to DB (prisma db push) — USE THIS
npm run db:studio    # Open Prisma Studio
npm run lint         # Run ESLint
npm run lint:fix     # Fix lint issues
npm run format:write # Format with Prettier
npm run check        # lint + tsc --noEmit
npm run test         # run the Vitest suite (42 tests: lib / schema / money-logic)
npm run test:cov     # Vitest with coverage (v8, scoped to src/lib, no hard threshold yet)
npm run test:tz      # timezone suite under a forced non-UTC zone
```

> ⚠️ **Never run `db:generate` / `db:migrate`** (they call `prisma migrate dev` / `migrate deploy`). This repo syncs schema with **`prisma db push`** only — the Neon migration history is intentionally out of sync, so `migrate` will fail or diverge. Stop the dev server before running `prisma generate`. The `prisma` CLI devDependency (`^6.6.0`) currently trails `@prisma/client` (`^6.19.2`) — prefer the local binary (`node_modules/.bin/prisma.cmd`) over `npx prisma`, which silently no-ops in some shells.

> **CI**: `.github/workflows/ci.yml` runs `npm run check` + `npm run test` on every push/PR to `main` (Node 22; no DB needed — `SKIP_ENV_VALIDATION=true` + dummy env vars).

---

## Key Code Patterns

### tRPC + React Query on Server (SSR Prefetch)

```ts
const { api, HydrateClient } = await import("@/trpc/server");
void api.student.getAll.prefetch();
return <HydrateClient><ClientPage /></HydrateClient>;
```

### tRPC + React Query on Client

```ts
const { data, isLoading } = api.student.getAll.useQuery();
const utils = api.useUtils();
const createMutation = api.student.create.useMutation({
  onSuccess: () => utils.student.invalidate(),
});
```

### Protected Procedure Pattern

```ts
export const lessonRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createLessonSchema)
    .mutation(async ({ ctx, input }) => {
      // ctx.session.user.id guaranteed; ctx.db is Prisma
    }),
});
```

### Form Pattern

```ts
const form = useForm<Schema>({ resolver: zodResolver(schema) });
const mutation = api.xxx.create.useMutation({ onSuccess, onError });
const onSubmit = form.handleSubmit((data) => mutation.mutate(data));
```
