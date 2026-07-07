# My Piano Diary - Current Project State

> A personal piano-lesson management diary. **Single user** — one teacher (you) manages students, schedules lessons, tracks attendance, records payments, and generates monthly reports. Students are records you manage, **not** logins; there is no multi-teacher / multi-tenant mode.

**Version**: 0.1.0 | **Status**: ~85% Complete | **Last Updated**: July 6, 2026

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
| Client State  | Zustand 5 (persisted to `localStorage`) — user + currency      |
| UI            | Tailwind CSS 4, Shadcn/UI, Radix UI primitives                 |
| Forms         | React Hook Form 7 + Zod 3 + `@hookform/resolvers`              |
| Charts        | Recharts 2                                                     |
| Calendar      | FullCalendar 6 (daygrid, timegrid, interaction plugins)        |
| Animation     | Framer Motion 12, canvas-confetti                              |
| Date Handling | date-fns 4, date-fns-tz 3 (IANA timezone support)              |
| Notifications | Sonner 2 (toast)                                               |
| Tables        | TanStack React Table 8                                         |
| Serialization | SuperJSON 2 (for tRPC + React Query dehydration)               |
| Bundler       | Turbopack (dev)                                                |

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
│   │   ├── login/page.tsx        # Login form (redirects if already authed)
│   │   ├── register/page.tsx     # Register form (redirects if already authed)
│   │   └── _components/          # LoginForm, RegisterForm
│   │
│   ├── (root)/                   # Protected route group (auth-gated, sidebar layout)
│   │   ├── layout.tsx            # AppSidebar + SiteHeader layout
│   │   ├── error.tsx
│   │   ├── _components/          # AppSidebar, NavMain, NavUser, NavAction, SiteHeader
│   │   ├── dashboard/            # SectionCards + DashboardIntelligencePanel (live earnings)
│   │   ├── students/             # Student CRUD table (+ [id]/reports/ report-view component)
│   │   ├── calendar/             # FullCalendar view with lesson CRUD
│   │   ├── lessons/              # Lessons list with month navigation
│   │   ├── pieces/               # Music pieces CRUD table
│   │   ├── reports/              # Monthly student reports (+ [studentId]/ detail)
│   │   ├── payments/             # Per-student, per-month payment tracking
│   │   ├── profile/              # Profile / Password / Settings (timezone, rates, currency)
│   │   ├── notifications/        # Coming soon placeholder
│   │   └── updates/              # Coming soon + hidden /forever easter egg link
│   │
│   ├── forever/                  # Hidden anniversary page (easter egg)
│   ├── birthday-game/, birthday-room/   # Hidden birthday easter-egg pages
│   │
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth route handler
│       └── trpc/[trpc]/          # tRPC fetch handler (httpBatchStreamLink endpoint)
│
├── server/                       # All backend code
│   ├── db.ts                     # Prisma client singleton
│   ├── api/
│   │   ├── trpc.ts               # tRPC init, context, protectedProcedure
│   │   ├── root.ts               # appRouter: { student, lesson, report, user, piece, earnings, payment }
│   │   └── routers/              # Individual feature routers (see API section)
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
│   ├── ui/                       # 35+ Shadcn/UI + custom components
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
│   ├── types.ts                  # Shared TypeScript types
│   ├── format.ts                 # Date/time formatting utilities
│   ├── currency.ts               # Currency formatting helpers
│   ├── rate.ts                   # Per-lesson rate resolution (online vs in-person)
│   ├── payment.ts                # calculateRemaining / derivePaymentStatus helpers
│   ├── timezone.ts               # Timezone utilities (isValidTimezone, getStartOfMonthUTC, …)
│   ├── error-handler.ts          # logError() centralized error logging
│   └── validations/
│       ├── auth-schemas.ts       # loginSchema, registerSchema
│       ├── common-schemas.ts     # Reusable base schemas (id, date, pagination, student, lesson)
│       └── api-schemas.ts        # Full API-layer schemas (lesson, piece, recurring, payment)
│
├── trpc/
│   ├── react.tsx                 # api = createTRPCReact<AppRouter>(); TRPCReactProvider
│   ├── server.ts                 # RSC server caller + HydrateClient for SSR hydration
│   └── query-client.ts           # createQueryClient() with 5-min staleTime + SuperJSON dehydration
│
├── store/
│   ├── use-user-store.ts         # Zustand: { user } persisted to localStorage
│   └── use-currency-store.ts     # Zustand: selected display currency (persisted)
│
├── hooks/
│   ├── use-error-handler.ts      # useErrorHandler(), useAsyncError()
│   └── use-mobile.ts             # useIsMobile() — watches matchMedia max-width: 767px
│
├── config/app-config.ts          # App metadata constants
├── proxy.ts                      # Cookie-based auth guard (Next.js proxy/middleware)
├── env.js                        # @t3-oss/env-nextjs: DATABASE_URL, AUTH_SECRET, CLOUDINARY_URL
└── styles/globals.css            # Tailwind directives + global styles
```

---

## Database Schema

**11 models** (7 app + 4 NextAuth) + `LessonStatus` enum. All datetime fields use `@db.Timestamptz` for proper timezone handling.

```
User ──1:1──> Teacher ──1:many──> Student ──1:many──> Lesson
                │                    │                    │
                ├──1:many──> Piece ──┼──── pieceId ───────┘
                │                    ├──1:many──> MonthlyReport
                ├──1:many──> Lesson  ├──1:many──> PaymentMonth ──1:many──> PaymentTransaction
                ├──1:many──> PaymentMonth
                └──1:many──> PaymentTransaction
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
| `Lesson`             | `id`, `studentId → Student`, `teacherId → Teacher`, `date (timestamptz)`, `duration (min)`, `status (LessonStatus, default PENDING)`, `isOnline (bool)`, `rate (int, snapshot)`, `actualMin?`, `cancelReason?`, `note?`, `pieceId? → Piece`, `createdAt` |
| `MonthlyReport`      | `id`, `studentId → Student (cascade)`, `month`, `year`, `summary?`, `comments?`, `nextMonthPlan?`, `tuitionNote?`, `lessonMetadata (Json, default {})`, `createdAt`, `updatedAt`; `@@unique([studentId, month, year])` |
| `PaymentMonth`       | `id`, `studentId → Student (cascade)`, `teacherId → Teacher (cascade)`, `month`, `year`, `expectedAmount (int)`, `createdAt`, `updatedAt`; `@@unique([studentId, month, year])`             |
| `PaymentTransaction` | `id`, `paymentMonthId → PaymentMonth (cascade)`, `studentId (cascade)`, `teacherId (cascade)`, `amount (int)`, `method?`, `note?`, `date`, `createdAt`, `updatedAt`                          |

**LessonStatus enum**: `PENDING` | `COMPLETE` | `CANCELLED`

**Rate snapshotting**: each `Lesson.rate` is frozen at create/update time from the student's `lessonRate` (in-person) or `onlineLessonRate` (online). Past months never re-price when a student's rate later changes.

**DB Indexes**: `@@index([teacherId, date])` / `@@index([studentId, date])` on Lesson; `@@index` on PaymentMonth (`[teacherId, month, year]`, `[studentId, year]`) and PaymentTransaction (`[teacherId, date]`, `[studentId, date]`, `[paymentMonthId]`).

> ⚠️ `Lesson.student` / `Lesson.teacher` / `Lesson.piece` still lack `onDelete: Cascade` — deleting a student with lessons currently fails (see `ISSUES_AND_FIXES.md` #1).

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
| `publicProcedure`    | Base — never used directly in any router                 | No            |
| `protectedProcedure` | All app procedures — throws `UNAUTHORIZED` if no session | Yes           |

Every router procedure uses `protectedProcedure`. There are no public tRPC endpoints.

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
| `update`    | mutation | Updates student (incl. both rates); verifies ownership             |
| `delete`    | mutation | Deletes student; verifies ownership (see FK bug #1)                |

### `lesson` router

`getAll` · `getForMonth` (timezone-aware boundaries) · `getInRange` · `create` (blocks duplicate student+date, snapshots rate) · `update` · `delete` · `markAttendance` · `createRecurring` (weekly, 1–2 months, IANA timezone via `date-fns-tz`).

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
| `getTopStudentsThisMonth`  | Top students by earnings this month                                          |
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
| `/login` `/register`   | Server        | Redirect to `/dashboard` if already authed                                    |
| `/dashboard`           | Client        | `SectionCards` (earnings metrics) + `DashboardIntelligencePanel` (today, insights, trend, top students) |
| `/lessons`             | Server+Client | SSR prefetch `student.getAll` + `lesson.getAll`; client month navigation      |
| `/students`            | Server+Client | SSR prefetch `student.getAll`; TanStack table                                 |
| `/calendar`            | Client        | FullCalendar with `lesson.getInRange` + `student.getAll`                       |
| `/pieces`              | Server+Client | SSR prefetch `piece.getAll`; TanStack table                                   |
| `/reports`             | Server+Client | Month/year + `?studentId`; redirects to `/reports/[studentId]`                 |
| `/reports/[studentId]` | Server+Client | Single student's monthly report view/edit                                      |
| `/payments`            | Server+Client | Per-student, per-month payment tracking + transactions                         |
| `/profile`            | Client        | Tabs: Profile (name/email/avatar), Password, Settings (timezone, rates, currency) |
| `/notifications` `/updates` | Client   | `ComingSoon` placeholders (`/updates` hides a link → `/forever`)              |
| `/forever` + birthday-* | Client       | Hidden anniversary/birthday easter eggs                                        |

---

## UI Components

### `src/components/ui/` (Shadcn/UI + Custom)

`app-loader`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `chart`, `checkbox`, `coming-soon`, `confirm-dialog`, `data-table`, `date-picker`, `dialog`, `drawer`, `dropdown-menu`, `error-state`, `form`, `input`, `label`, `popover`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `star-rating`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip` — plus a shared `DataTable` used by the students & pieces tables.

---

## Zustand Stores

- `use-user-store.ts` — `{ user: { id, name?, email?, image? } | null }`, persisted (`"user-storage"`); populated by `UserStoreProvider` from the NextAuth session.
- `use-currency-store.ts` — selected display currency, persisted; consumed via `useCurrency()` and `src/lib/currency.ts` formatters.

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

No `NEXT_PUBLIC_*` client variables. Empty strings treated as `undefined`. Skip validation with `SKIP_ENV_VALIDATION=true`.

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
- **UI/UX** ✅ — responsive collapsible sidebar, dark/light theme (next-themes), Sonner toasts, inline validation, skeletons, Framer Motion, mobile drawer.
- **Easter eggs** 🎹 — `/forever` anniversary page + birthday-game/room pages.

---

## Not Yet Implemented

| Feature                 | Notes                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| Student detail page     | `students/[id]/reports/` has a report-view component but no `page.tsx` |
| Notifications           | Placeholder page only                                              |
| Updates / changelog     | Placeholder page only                                              |
| Cloudinary image upload | `CLOUDINARY_URL` defined but not wired up                          |
| Server-side pagination  | Lists fetch all rows + paginate client-side (deferred; fine at single-user scale — `ISSUES_AND_FIXES.md` #23) |

See `FUTURE_FEATURES.md` for the planned roadmap.

---

## Quick Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm start            # Start production server
npm run db:push      # Push schema to DB (prisma db push) — USE THIS
npm run db:studio    # Open Prisma Studio
npm run lint         # Run ESLint
npm run lint:fix     # Fix lint issues
npm run format:write # Format with Prettier
npm run check        # lint + tsc --noEmit
npm run test         # run the Vitest suite (lib / schema / money-logic)
npm run test:tz      # timezone suite under a forced non-UTC zone
```

> ⚠️ **Never run `db:generate` / `db:migrate`** (they call `prisma migrate dev` / `migrate deploy`). This repo syncs schema with **`prisma db push`** only — the Neon migration history is intentionally out of sync, so `migrate` will fail or diverge. Stop the dev server before running `prisma generate`.

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
