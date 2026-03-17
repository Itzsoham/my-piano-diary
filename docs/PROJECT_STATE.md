# My Piano Diary - Current Project State

> A piano lesson management system for teachers to manage students, schedule lessons, track attendance, and generate reports.

**Version**: 0.1.0 | **Status**: ~70% Complete | **Last Updated**: March 17, 2026

---

## Tech Stack

| Layer         | Technology                                                     |
| ------------- | -------------------------------------------------------------- |
| Framework     | Next.js 15.2 (App Router), React 19                            |
| Language      | TypeScript 5.8 (strict mode)                                   |
| API           | tRPC 11 with `httpBatchStreamLink` + SuperJSON transformer     |
| Database      | PostgreSQL (Neon) via Prisma 6.19, all datetimes `timestamptz` |
| Auth          | NextAuth.js 5 beta (JWT strategy) — Credentials only           |
| Server State  | React Query 5 (`@tanstack/react-query`) via tRPC adapter       |
| Client State  | Zustand 5 (persisted to `localStorage`)                        |
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
│   │   └── _components/          # LoginForm, RegisterForm, GoogleOAuthButton
│   │
│   ├── (root)/                   # Protected route group (auth-gated, sidebar layout)
│   │   ├── layout.tsx            # AppSidebar + SiteHeader layout
│   │   ├── error.tsx
│   │   ├── _components/          # AppSidebar, NavMain, NavUser, NavAction, SiteHeader
│   │   ├── dashboard/            # Earnings dashboard (SectionCards + TodayLessonsTable)
│   │   ├── students/             # Student CRUD table + /[id]/reports sub-route
│   │   ├── calendar/             # FullCalendar view with lesson CRUD
│   │   ├── lessons/              # Lessons list with month navigation
│   │   ├── pieces/               # Music pieces CRUD table
│   │   ├── reports/              # Monthly student reports
│   │   ├── profile/              # Profile / Password / Teacher settings tabs
│   │   ├── notifications/        # Coming soon placeholder
│   │   └── updates/              # Coming soon + hidden /forever easter egg link
│   │
│   ├── forever/                  # Hidden anniversary page (easter egg)
│   │   └── page.tsx
│   │
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth route handler
│       └── trpc/[trpc]/          # tRPC fetch handler (httpBatchStreamLink endpoint)
│
├── server/                       # All backend code
│   ├── db.ts                     # Prisma client singleton
│   ├── api/
│   │   ├── trpc.ts               # tRPC init, context, protectedProcedure
│   │   ├── root.ts               # appRouter: { student, lesson, report, user, piece, earnings }
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
│   ├── dashboard-container.tsx
│   ├── error-test-panel.tsx
│   └── lessons/
│       ├── lesson-dialog.tsx     # Create lesson dialog
│       └── lesson-edit-dialog.tsx # Edit lesson dialog
│
├── lib/
│   ├── utils.ts                  # cn(), misc helpers
│   ├── types.ts                  # Shared TypeScript types
│   ├── format.ts                 # Date/time formatting utilities
│   ├── currency.ts               # Currency formatting helpers
│   ├── timezone.ts               # Timezone utilities (isValidTimezone, etc.)
│   ├── error-handler.ts          # logError() centralized error logging
│   └── validations/
│       ├── auth-schemas.ts       # loginSchema, registerSchema
│       ├── common-schemas.ts     # Reusable base schemas (id, date, pagination, student, lesson)
│       └── api-schemas.ts        # Full API-layer schemas (lesson, piece, recurring, attendance)
│
├── trpc/
│   ├── react.tsx                 # api = createTRPCReact<AppRouter>(); TRPCReactProvider
│   ├── server.ts                 # RSC server caller + HydrateClient for SSR hydration
│   └── query-client.ts           # createQueryClient() with 5-min staleTime + SuperJSON dehydration
│
├── store/
│   └── use-user-store.ts         # Zustand store: { user, setUser, clearUser } persisted to localStorage
│
├── hooks/
│   ├── use-error-handler.ts      # useErrorHandler(), useAsyncError()
│   └── use-mobile.ts             # useIsMobile() — watches matchMedia max-width: 767px
│
├── config/app-config.ts          # App metadata constants
├── middleware.ts                  # Cookie-based auth guard (no NextAuth overhead)
├── env.js                        # @t3-oss/env-nextjs: DATABASE_URL, AUTH_SECRET, CLOUDINARY_URL
└── styles/globals.css             # Tailwind directives + global styles
```

---

## Database Schema

**7 models** (6 app + NextAuth) + `LessonStatus` enum. All datetime fields use `@db.Timestamptz` for proper timezone handling.

```
User ──1:1──> Teacher ──1:many──> Student ──1:many──> Lesson
                │                    │                    │
                ├──1:many──> Piece ──┼──── pieceId ────────┘
                │                    │
                └──1:many──> Lesson  └──1:many──> MonthlyReport
```

| Model           | Key Fields                                                                                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`          | `id (cuid)`, `name?`, `email? (unique)`, `emailVerified?`, `image?`, `password?`, `timezone (default "UTC")`, `createdAt`                                                                                              |
| `Account`       | Standard NextAuth OAuth fields; `@@unique([provider, providerAccountId])`                                                                                                                                              |
| `Session`       | `sessionToken (unique)`, `userId`, `expires`                                                                                                                                                                           |
| `Teacher`       | `id`, `userId (unique → User)`, `createdAt`                                                                                                                                                                            |
| `Student`       | `id`, `teacherId → Teacher`, `name`, `avatar?`, `notes?`, `lessonRate (int, default 0)`, `createdAt`                                                                                                                   |
| `Piece`         | `id`, `teacherId → Teacher`, `title`, `description?`, `level?`, `difficulty? (int 1–5)`, `createdAt`                                                                                                                   |
| `Lesson`        | `id`, `studentId → Student`, `teacherId → Teacher`, `date (timestamptz)`, `duration (int, minutes)`, `status (LessonStatus, default PENDING)`, `actualMin?`, `cancelReason?`, `note?`, `pieceId? → Piece`, `createdAt` |
| `MonthlyReport` | `id`, `studentId → Student (cascade delete)`, `month`, `year`, `summary?`, `comments?`, `nextMonthPlan?`, `createdAt`, `updatedAt`; `@@unique([studentId, month, year])`                                               |

**LessonStatus enum**: `PENDING` | `COMPLETE` | `CANCELLED` | `MAKEUP`

**DB Indexes**: `@@index([teacherId, date])` and `@@index([studentId, date])` on Lesson for fast calendar queries.

---

## tRPC Architecture

> tRPC 11 provides end-to-end type safety between server and client. Every procedure is strongly typed from input (Zod schema) through to the React Query hook.

### Transport & Serialization

- **Link**: `httpBatchStreamLink` — batches multiple concurrent calls into one HTTP request; supports streaming responses
- **Transformer**: SuperJSON — handles `Date`, `Map`, `Set` serialization across the wire
- **Endpoint**: `POST /api/trpc/*` (handled by `fetchRequestHandler`)
- **Source header**: `x-trpc-source: nextjs-react` (client) / `x-trpc-source: rsc` (server components)

### Context

```ts
// src/server/api/trpc.ts
createTRPCContext({ headers }) → {
  db,           // Prisma client
  session,      // NextAuth session (null if unauthenticated)
  headers,
}
```

### Procedure Types

| Procedure Type       | Usage                                                    | Auth Required |
| -------------------- | -------------------------------------------------------- | ------------- |
| `publicProcedure`    | Base — never used directly in any router                 | No            |
| `protectedProcedure` | All app procedures — throws `UNAUTHORIZED` if no session | Yes           |

Every single router procedure uses `protectedProcedure`. There are no public tRPC endpoints.

### Router Structure (`src/server/api/root.ts`)

```ts
appRouter = createCallerFactory({
  student, // student.ts
  lesson, // lesson.ts
  report, // report.ts
  user, // user.ts
  piece, // piece.ts
  earnings, // earnings.ts
});
```

---

## tRPC Routers — Full Procedure Reference

### `student` router

| Procedure   | Type     | Input                            | Returns                                                 |
| ----------- | -------- | -------------------------------- | ------------------------------------------------------- |
| `getAll`    | query    | —                                | All students for teacher (with `_count.lessons`)        |
| `getByGuid` | query    | `{ id }`                         | Single student + last 10 lessons + teacher info         |
| `create`    | mutation | `{ name, avatar?, notes? }`      | Created student; auto-creates Teacher record if missing |
| `update`    | mutation | `{ id, name?, avatar?, notes? }` | Updated student; verifies ownership                     |
| `delete`    | mutation | `{ id }`                         | Deleted student; verifies ownership                     |

### `lesson` router

| Procedure         | Type     | Input                                                                                       | Returns                                                                              |
| ----------------- | -------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `getAll`          | query    | `{ studentId?, from?, to?, status? }`                                                       | Filtered lessons + student + piece                                                   |
| `getForMonth`     | query    | `{ year, month }`                                                                           | Calendar-month lessons (timezone-aware boundaries), with student name/avatar + piece |
| `getInRange`      | query    | `{ start: Date, end: Date }`                                                                | Lessons between two dates + student + piece                                          |
| `create`          | mutation | `{ studentId, date, duration, pieceId? }`                                                   | Creates lesson; blocks duplicate student+date                                        |
| `update`          | mutation | `{ id, date?, duration?, status?, pieceId?, cancelReason? }`                                | Updates lesson; verifies ownership                                                   |
| `delete`          | mutation | `{ id }`                                                                                    | Deletes lesson; verifies ownership                                                   |
| `markAttendance`  | mutation | `{ lessonId, status, actualMin?, cancelReason?, note? }`                                    | Sets attendance status + metadata                                                    |
| `createRecurring` | mutation | `{ studentId, startDate, dayOfWeek, time, duration, recurrenceMonths, pieceId?, timezone }` | Bulk-creates weekly recurring lessons using `date-fns-tz.fromZonedTime`              |

### `piece` router

| Procedure | Type     | Input                                       | Returns                                            |
| --------- | -------- | ------------------------------------------- | -------------------------------------------------- |
| `getAll`  | query    | —                                           | All pieces for teacher with `_count.lessons`       |
| `getById` | query    | `{ id }`                                    | Single piece + last 10 lessons (with student name) |
| `create`  | mutation | `{ title, difficulty?, description? }`      | Created piece                                      |
| `update`  | mutation | `{ id, title?, difficulty?, description? }` | Updated piece; verifies ownership                  |
| `delete`  | mutation | `{ id }`                                    | Deleted piece; verifies ownership                  |

### `report` router

| Procedure          | Type     | Input                                                             | Returns                                                                       |
| ------------------ | -------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `generatePreview`  | query    | `{ studentId, month, year }`                                      | COMPLETE lessons + `totalLessons`, `totalFee`, `studentLessonRate`            |
| `getStudentReport` | query    | `{ studentId, month, year }`                                      | `{ report, lessons (all statuses), student, studentLessonRate, teacherName }` |
| `getByMonth`       | query    | `{ studentId, month, year }`                                      | `MonthlyReport` record or `null`                                              |
| `upsertReport`     | mutation | `{ studentId, month, year, summary?, comments?, nextMonthPlan? }` | Upserts by `[studentId, month, year]` unique key                              |
| `createOrUpdate`   | mutation | Same as `upsertReport`                                            | Alias upsert pattern                                                          |

### `user` router

| Procedure        | Type     | Input                              | Returns                                                                                   |
| ---------------- | -------- | ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `getProfile`     | query    | —                                  | `{ id, name, email, image, timezone, createdAt, teacher.id, _count.{students, lessons} }` |
| `updateProfile`  | mutation | `{ name, email, image? }`          | Updated user; checks email uniqueness                                                     |
| `updateTimezone` | mutation | `{ timezone: string }`             | Validates IANA timezone via `isValidTimezone()`, updates User                             |
| `updatePassword` | mutation | `{ currentPassword, newPassword }` | bcrypt compare → hash → save                                                              |

### `earnings` router

| Procedure         | Type  | Input             | Returns                                                                                                                                              |
| ----------------- | ----- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getDashboard`    | query | —                 | `{ totalEarnings, currentMonthEarnings, currentMonthLoss, totalStudents }` — timezone-aware                                                          |
| `getTodayLessons` | query | `{ date?: Date }` | Today's lessons (timezone-aware day boundaries) with `earnings` field appended                                                                       |
| `getByStudent`    | query | —                 | Current month COMPLETE lessons grouped by student: `{ studentId, studentName, avatar, lessonCount, earnings, lessonRate }[]` sorted by earnings desc |

---

## React Query Integration

> tRPC is wired directly into React Query 5 via `@trpc/react-query`. All tRPC hooks are React Query hooks under the hood.

### QueryClient Configuration (`src/trpc/query-client.ts`)

```ts
createQueryClient() → {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes — data stays fresh, avoids refetch on re-mount
    },
    dehydrate: {
      serializeData: SuperJSON.serialize,        // serialize Dates, Maps, etc.
      shouldDehydrateQuery: (q) =>
        inferRouterType(q) === "query" ||
        q.state.status === "pending",            // include pending queries → enables streaming SSR
    },
    hydrate: {
      deserializeData: SuperJSON.deserialize,
    },
  },
}
```

**Singleton pattern**: Browser uses a module-level `clientQueryClientSingleton` to avoid creating a new QueryClient on every render. Server creates a fresh instance per request.

### SSR Hydration Pattern (RSC + Client Components)

Server components use `void api.procedure.prefetch()` to warm the React Query cache before the page renders. The `HydrateClient` component then dehydrates and streams the cache to the client.

```ts
// In a Server Component page:
await api.student.getAll.prefetch();       // warms cache server-side
return <HydrateClient><ClientPage /></HydrateClient>;

// In the Client Component:
const { data } = api.student.getAll.useQuery();  // already hydrated, no loading flicker
```

Pages using SSR prefetch: `lessons`, `students`, `pieces`, `reports`.

### Cache Invalidation Pattern

```ts
const utils = api.useUtils();
// After a mutation:
await utils.lesson.invalidate(); // refetches all lesson queries
await utils.student.getAll.invalidate(); // targeted invalidation
```

### Provider Setup

```
TRPCReactProvider
  ├── QueryClientProvider (React Query context)
  └── api.Provider (tRPC context, httpBatchStreamLink to /api/trpc)
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

**`UserStoreProvider`**: Listens to NextAuth session via `useSession`. On `"authenticated"` → calls `setUser` in Zustand. Has `isHydrated` gate to prevent SSR hydration mismatch (returns `null` until after first client render).

---

## Authentication

### Strategy

- **NextAuth v5 beta** (`next-auth@5.0.0-beta.25`) — JWT session strategy (no DB sessions)
- **Credentials provider only** — email + bcrypt password (no Google despite earlier plans; removed)
- **JWT callbacks**: copies `id`, `image`, `timezone` from user object into token
- **Session callbacks**: copies `id`, `image`, `timezone` from token into `session.user`
- Module augmentation: `Session.user` has `id: string` + `timezone: string`

### Route Protection

**Middleware** (`src/middleware.ts`) uses a fast cookie-check approach (no NextAuth `auth()` call in middleware to avoid edge runtime issues):

1. Checks for any of: `authjs.session-token`, `__Secure-authjs.session-token`, `next-auth.session-token`, `__Secure-next-auth.session-token`
2. Public paths (`/login`, `/register`, `/forever`) — always pass through
3. No cookie + non-public path → redirect `/login`
4. Has cookie + on `/login` or `/register` → redirect `/dashboard`
5. Matcher excludes API routes, `_next/*`, static media files (svg, png, jpg, mp3, mpeg, etc.)

### Server Actions (`src/server/actions/auth-actions.ts`)

| Action                     | Description                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `loginAction(formData)`    | Validates via `loginSchema` → calls `signIn("credentials", ...)` → returns `{ success, message, user? }`                |
| `registerAction(formData)` | Validates via `registerSchema` → checks email uniqueness → bcrypt hash (rounds=10) → creates User → calls `loginAction` |

Both catch `AuthError` and return structured `{ success: boolean, message: string }` — never throw to client.

---

## Validation Schemas

### `src/lib/validations/auth-schemas.ts`

- `loginSchema` — `{ email, password (min 6), remember? }`
- `registerSchema` — `{ name, email, password, confirmPassword }` + `.refine` passwords match

### `src/lib/validations/common-schemas.ts`

Base building blocks: `idSchema`, `uuidSchema`, `emailSchema`, `nameSchema`, `passwordSchema`, `dateSchema` (union Date | ISO string → transforms to Date), `dateStringSchema` (YYYY-MM-DD), `descriptionSchema`, `paginationSchema`, `searchSchema`, `lessonStatusSchema`, `createStudentSchema`, `updateStudentSchema`, `createLessonSchema`, `updateLessonSchema`

### `src/lib/validations/api-schemas.ts`

Full API schemas with stricter rules: `createStudentSchema`, `updateStudentSchema`, `deleteStudentSchema`, `createPieceSchema`, `updatePieceSchema`, `deletePieceSchema`, `createLessonSchema`, `updateLessonSchema`, `createRecurringLessonSchema` (includes `dayOfWeek`, `time`, `recurrenceMonths 1–2`, `timezone`), `deleteLessonSchema`, `getMonthLessonsSchema`, `markAttendanceSchema`

---

## Page Routes

| URL              | Server/Client | Description                                                                                                                                    |
| ---------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`              | Server        | Immediately `redirect("/dashboard")`                                                                                                           |
| `/login`         | Server        | If session → redirect `/dashboard`. Renders `LoginForm` in split-panel layout                                                                  |
| `/register`      | Server        | If session → redirect `/dashboard`. Renders `RegisterForm`                                                                                     |
| `/dashboard`     | Client        | Renders `SectionCards` (earnings metrics) + `TodayLessonsTable`                                                                                |
| `/lessons`       | Server+Client | SSR prefetches `student.getAll` + `lesson.getAll` (current month). Client `LessonsPage` handles month navigation                               |
| `/students`      | Server+Client | SSR prefetches `student.getAll`. Client `StudentsTable` with TanStack Table                                                                    |
| `/calendar`      | Client        | FullCalendar with `lesson.getInRange` + `student.getAll`; opens `LessonDialog` / `AttendanceDialog`                                            |
| `/pieces`        | Server+Client | SSR prefetches `piece.getAll`. Client `PiecesTable` with TanStack Table                                                                        |
| `/reports`       | Server+Client | SSR prefetches `student.getAll`; reads `?studentId` searchParam. Client `ReportsPage`                                                          |
| `/profile`       | Client        | Three tabs: `ProfileForm` (name/email/avatar), `PasswordForm` (change password), `TeacherSettingsForm` (timezone, lesson rate)                 |
| `/notifications` | Client        | `ComingSoon` placeholder                                                                                                                       |
| `/updates`       | Client        | `ComingSoon` placeholder + hidden button → `/forever`                                                                                          |
| `/forever`       | Client        | Hidden anniversary easter egg: countdown from 2025-09-15, 1-year progress bar, confetti, music playback, photo memories modal, floating hearts |

---

## UI Components

### `src/components/ui/` (Shadcn/UI + Custom)

`app-loader`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar` (react-day-picker), `card`, `chart` (Recharts wrapper), `checkbox`, `coming-soon`, `confirm-dialog`, `date-picker`, `dialog`, `drawer` (vaul), `dropdown-menu`, `error-state`, `form`, `input`, `label`, `popover`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `star-rating`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`

### `src/app/(root)/_components/`

`app-sidebar.tsx`, `nav-action.tsx`, `nav-main.tsx`, `nav-user.tsx`, `site-header.tsx`

### Shared Lesson Components

- `lesson-dialog.tsx` — Create new lesson (student select, date/time, duration, piece link)
- `lesson-edit-dialog.tsx` — Edit existing lesson + mark attendance inline

---

## Zustand Store

```ts
// src/store/use-user-store.ts
State: { user: { id, name?, email?, image? } | null }
Actions: setUser(user), clearUser()
Persistence: localStorage key "user-storage" (via zustand/middleware persist)
```

Populated by `UserStoreProvider` which reads the NextAuth session. Used for client-side user display without triggering server round-trips.

---

## Custom Hooks

### `useErrorHandler(options?)` (`src/hooks/use-error-handler.ts`)

Returns `{ handleError }`. Logs via `logError`, shows Sonner toast (user-friendly message in prod, raw in dev), calls optional `onError` callback.

### `useAsyncError(options?)` (`src/hooks/use-error-handler.ts`)

Returns `{ executeAsync, handleError }`. `executeAsync(fn)` wraps any async function — catches errors, handles them, returns `null` on failure.

### `useIsMobile()` (`src/hooks/use-mobile.ts`)

Returns `boolean`. Watches `matchMedia("(max-width: 767px)")`, updates on resize. SSR-safe (initial `undefined` → coerced to `false`).

---

## Error Handling

| Layer               | Mechanism                                                                    |
| ------------------- | ---------------------------------------------------------------------------- |
| API routes          | `withApiHandler()` wrapper — catches errors, returns typed JSON responses    |
| Server actions      | `tryCatch` wrapper in `server-action-error-handler.ts`                       |
| tRPC procedures     | Standard tRPC error codes (`UNAUTHORIZED`, `NOT_FOUND`, `BAD_REQUEST`, etc.) |
| React rendering     | `ErrorBoundary` component wrapping layout subtrees                           |
| Global pages        | `error.tsx` at root, `(auth)`, and `(root)` route group levels               |
| 404                 | `not-found.tsx`                                                              |
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

No `NEXT_PUBLIC_*` client variables. Empty strings treated as `undefined`. Can skip validation with `SKIP_ENV_VALIDATION=true`.

---

## Implemented Features

### Authentication & Authorization ✅

- Email/password registration and login
- bcrypt password hashing (10 rounds)
- JWT session management (no DB sessions)
- Protected routes via fast cookie-check middleware
- Auto Teacher profile creation on first sign-up
- Timezone stored on User model, user can update it

### Student Management ✅

- Full CRUD with TanStack Table (sorting, filtering, pagination)
- Student avatars, notes, lesson rate
- SSR-prefetched data (no loading flicker)

### Lesson Scheduling ✅

- Schedule/update/cancel lessons
- Link lessons to music pieces
- Block duplicate lessons for same student+date
- Recurring lesson creation (weekly, 1–2 months, timezone-aware)
- Filter by date range / status

### Attendance Tracking ✅

- Four statuses: `PENDING`, `COMPLETE`, `CANCELLED`, `MAKEUP`
- Actual duration recording
- Cancel reason + lesson notes
- `markAttendance` mutation for inline updates

### Calendar View ✅

- FullCalendar 6 (daygrid + timegrid + interaction plugins)
- `getInRange` query for efficient date-window fetching
- Create / edit / delete lessons from calendar
- Color-coded lessons by status

### Recurring Lessons ✅

- Weekly recurring lesson creation over 1–2 months
- Full IANA timezone support via `date-fns-tz.fromZonedTime`
- Day-of-week + time selection

### Monthly Reports ✅

- Three editable sections: Summary, Comments, Next Month Plan
- Auto-save via `upsertReport` mutation
- Preview mode with attendance stats and fee calculation
- Month/year navigation with searchParam (`?studentId`)
- Print-to-PDF support

### Music Pieces ✅

- Full CRUD with TanStack Table
- Star-based difficulty rating (1–5)
- Lesson link count per piece
- SSR-prefetched data

### Earnings Dashboard ✅

- Total earnings, current month earnings, current month losses
- Today's lessons with earnings per lesson
- Earnings grouped by student (current month)
- All queries timezone-aware (teacher's IANA timezone)

### Profile Management ✅

- Edit user profile (name, email, avatar)
- Timezone selector with `updateTimezone` procedure
- Change password (bcrypt verify + rehash)
- Teacher settings (lesson rate)

### Error Handling ✅

- Multi-layer error handling (see Error Handling section)
- User-friendly toast messages
- Dev mode shows raw errors

### UI/UX ✅

- Responsive sidebar navigation with collapse
- Dark/light theme (next-themes)
- Toast notifications (Sonner)
- Form validation with inline error messages
- 35+ Shadcn/UI components
- Skeleton loading states
- Framer Motion animations
- Mobile-responsive (useIsMobile hook + sheet drawer)

### Hidden Easter Egg 🎹

- `/forever` page: anniversary countdown, progress bar, confetti rain, music player, floating hearts, photo memories modal

---

## Not Yet Implemented

| Feature                   | Notes                                                          |
| ------------------------- | -------------------------------------------------------------- |
| Student detail page       | Route files exist (`students/[id]/reports/`) but no `page.tsx` |
| Notifications             | Placeholder page only                                          |
| Updates / changelog       | Placeholder page only                                          |
| Cloudinary image upload   | `CLOUDINARY_URL` env var defined but not wired up              |
| Google OAuth              | Removed; only Credentials provider active                      |
| Advanced dashboard charts | Recharts imported but limited use                              |

---

## Quick Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm start            # Start production server
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations (dev)
npm run db:push      # Deploy migrations (prod)
npm run db:studio    # Open Prisma Studio
npm run lint         # Run ESLint
npm run lint:fix     # Fix lint issues
npm run format:write # Format with Prettier
npm run typecheck    # TypeScript type check
```

---

## Key Code Patterns

### tRPC + React Query on Server (SSR Prefetch)

```ts
// server component
const { api, HydrateClient } = await import("~/trpc/server");
void api.student.getAll.prefetch();
return <HydrateClient><ClientPage /></HydrateClient>;
```

### tRPC + React Query on Client

```ts
// client component
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
      // ctx.session.user.id is guaranteed to exist
      // ctx.db is the Prisma client
    }),
});
```

### Form Pattern

```ts
const form = useForm<Schema>({ resolver: zodResolver(schema) });
const mutation = api.xxx.create.useMutation({ onSuccess, onError });
const onSubmit = form.handleSubmit((data) => mutation.mutate(data));
```

### Data Table Pattern

TanStack React Table v8 with column definitions, `useReactTable`, sorting, filtering, and pagination. Used in Students and Pieces pages.
