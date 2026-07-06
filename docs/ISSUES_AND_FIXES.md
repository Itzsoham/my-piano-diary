# Issues & Fixes

> Current problems in the app, what needs fixing, and how to fix each one.

**Last Updated**: July 6, 2026 — every entry below was re-verified against the current codebase. The previous revision (Feb 27, 2026) predated the payments/earnings/reports modules and the shared `DataTable`; several of its items are now resolved and are listed under [Resolved Since Last Audit](#resolved-since-last-audit). New bugs surfaced by this audit are marked **NEW**.

---

## Summary

| Priority     | Open items                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| 🔴 High      | — none (all fixed 2026-07-06)                                                                            |
| 🟠 Medium    | — none (all fixed 2026-07-06)                                                                            |
| 🟡 Low       | — none (all fixed 2026-07-06)                                                                            |
| 🔒 Security  | No auth rate-limiting / brute-force protection · weak password policy · account enumeration            |
| 🧱 Backlog   | Client-only pagination (deferred — fine at single-user scale) · _#22 tests, #24 monitoring, #25 calendar a11y/loading, #26 table DRY: done 2026-07-06_ |

---

## ✅ Fixed 2026-07-06 (this batch)

All correctness & cleanup bugs #1–#18 are resolved (timezone bugs #6, #7, #11 earlier the same day; see their entries). The detailed entries below are kept for history.

- **#1** Student-delete FK crash — `Lesson.student`/`.teacher` now `onDelete: Cascade`, `Lesson.piece` `SetNull`; applied via `prisma db push` and verified against the DB.
- **#2** Edit-lesson silent save — added `isOnline` to the on-open `form.reset` + a `<FormMessage/>` on the field.
- **#3** Profile save without avatar — `updateUserSchema.image` now accepts `""` (`.or(z.literal(""))`).
- **#4** Payment-history stale totals — `getStudentHistory` recomputes expected live from `COMPLETE` lessons per timezone-month.
- **#5** Overall-outstanding netting — `getOverallSummary` buckets by student+year+month and clamps remaining per bucket.
- **#8** Silent query errors — global `QueryCache.onError` toast (browser-only) + calendar renders `ErrorState` on `isError`.
- **#9** Lost form input on failure — lesson/student/piece forms close+reset in `onSuccess` (not `onMutate`); lesson dialog disables submit while pending.
- **#10** Unbounded payment amount — `.max(10000000)` on add/update transaction amount.
- **#12** Dead `isPending` guard — `??` → `||` in student/piece forms.
- **#13/#14** Loose recurring inputs — `timezone` `.refine(isValidTimezone)`, `startDate` `z.string().date()`.
- **#15** Unbounded report metadata — key schema `z.string().max(50)` + `.refine(≤ 200 keys)`.
- **#16** `MAKEUP` status — **removed** everywhere (it's a retired, unused status; 0 rows in the DB): dropped from `lessonStatusSchema`, both `api-schemas` enums, and the Prisma `LessonStatus` enum (applied via `prisma db push`). Supersedes the earlier "add it" fix.
- **#17** Debug logs — `[TRPC]` timing log gated to dev; the `createRecurring` `[SERVER DEBUG]` logs were removed with #7.
- **#18** Missing indexes — `@@index` on `Student.teacherId`, `Piece.teacherId`, `Lesson.pieceId` (applied + verified).

---

## 🔴 High-Priority Bugs (confirmed, user-facing)

> ✅ **All resolved 2026-07-06** — entries kept below for history.

### 1. Deleting a student with any lesson crashes (foreign-key violation) — **NEW**

**Impact**: Student deletion is effectively broken for every real student. The confirm dialog even promises it "will remove all associated lessons and data," but the delete never gets that far.

**Where**: `prisma/schema.prisma:115` + `src/server/api/routers/student.ts:229`.

**Cause**: `Lesson.student` has no `onDelete` action, so the FK defaults to `Restrict`. `student.delete` calls `ctx.db.student.delete()` directly without first removing the student's lessons. Any student with ≥1 lesson triggers Postgres error P2003. Sibling relations (`MonthlyReport.student`, `PaymentMonth.student`, `PaymentTransaction.student`) all cascade — `Lesson.student` is an accidental omission.

**Fix**: Add cascade (or delete lessons in a transaction if history must be kept):

```prisma
student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
```

Then `npm run db:push` (this repo uses `prisma db push`, never `migrate deploy`). `Lesson.teacher` (`:116`) has the same omission — decide its behavior too.

---

### 2. Edit-lesson dialog silently refuses to save — **NEW**

**Impact**: A teacher opens **Edit** on a lesson, changes date/time/status but doesn't touch the Online switch, clicks **Save** — nothing happens, no error shown.

**Where**: `src/components/lessons/lesson-edit-dialog.tsx:135`.

**Cause**: The on-open `form.reset({...})` object omits `isOnline`. React-hook-form's `reset()` replaces the whole form state, so `isOnline` becomes `undefined`; the schema requires `z.boolean()` (`:46`), so `zodResolver` rejects the submit and `onSubmit` never runs. The `isOnline` field has no `<FormMessage/>`, so the validation error is invisible and the button looks inert. The switch also renders `checked={undefined}` (always OFF), so online lessons look in-person.

**Fix**: Add `isOnline: lesson.isOnline` to the reset object (mirror `defaultValues`), and add a `<FormMessage/>` to the `isOnline` field so future validation failures surface.

---

### 3. Profile save is rejected whenever there's no avatar URL — **NEW**

**Impact**: Any teacher without a profile picture (or who clears it) cannot save name/email changes — the whole mutation is rejected with "Invalid image URL."

**Where**: `src/lib/validations/common-schemas.ts:173` (`updateUserSchema.image`).

**Cause**: `image: z.string().url().optional()` accepts only `undefined`, not `""`. The profile form initializes `image: profile.image ?? ""` and always sends `image: data.image`, so an empty string hits `.url()` and fails. The `input.image === "" ? null` branch in `user.ts:71` is unreachable. (`api-schemas.ts` already has the correct `.or(z.literal(""))` pattern, but that schema isn't the one wired in.)

**Fix**:

```typescript
image: z.string().url("Invalid image URL").optional().or(z.literal("")),
```

---

## 🟠 Medium-Priority Bugs (confirmed)

> ✅ **All resolved 2026-07-06** — entries kept below for history.

### 4. Payment-history dialog shows stale expected amount & wrong status — **NEW**

**Where**: `src/server/api/routers/payment.ts:499-517` (`getStudentHistory`).

**Cause**: `getStudentHistory` (and the `addTransaction` return, `:392/:395`) derive `expected/remaining/status` from the denormalized `PaymentMonth.expectedAmount` snapshot, which is written **only** inside `addTransaction` (`:350/:352`). Every other path (`getForMonth`/`buildMonthPaymentRows`, `getUnpaidSummary`, `earnings.getDashboard`) recomputes expected **live** from completed lessons. When a lesson is completed/cancelled/deleted/re-priced after the month's last transaction, the snapshot goes stale and the history dialog disagrees with the payments table (e.g. shows PAID / 0 due while the student actually owes money).

**Fix**: In `getStudentHistory`, recompute expected per month from `COMPLETE` lessons over the timezone-aware month window (same logic as `buildMonthPaymentRows`), then apply `calculateRemaining`/`derivePaymentStatus`. Long-term, drop the denormalized `expectedAmount` column and always derive live.

---

### 5. "Total Outstanding" nets overpaid months against underpaid ones — **NEW**

**Where**: `src/server/api/routers/payment.ts:264-282` (`getOverallSummary`, root cause in the all-time `groupBy` at `:230-248`).

**Cause**: `totalOutstanding` = `Σ students max(allTimeExpected − allTimeReceived, 0)`. The zero-clamp fires only **after** cross-month netting, so an overpayment in one month cancels a shortfall in another. Every other outstanding figure in the app clamps **per month**. Example: Feb expected 200 / paid 300, Mar expected 200 / paid 100 → per-month views show 100 due, but the dashboard tile reports 0.

**Fix**: Bucket lessons + transactions by `studentId+month+year` (using the teacher's timezone), apply `calculateRemaining` per bucket, then sum — matching `getUnpaidSummary` and the earnings dashboard.

---

### 6. Calendar places lessons in the browser timezone, not the configured one — ✅ FIXED (2026-07-06)

> **Resolved**: `full-calendar-view.tsx` now reads the configured timezone from `useSession()`, shifts each event's start/end and the day-count badge with `fromUTC(…, timezone)`, and converts drag/drop results back to UTC with `toUTC(…, timezone)` on save (stored data stays UTC-correct). A latent bug in `src/lib/timezone.ts` `formatInTimezone` was fixed at the same time — it formatted in the runtime's local zone instead of the target zone (it now `toZonedTime`s first). Original report below for history.

**Where**: `src/app/(root)/calendar/_components/full-calendar-view.tsx:483` (no `timeZone` prop), `:208` (event start), `:140-142` (day-count badge).

**Cause**: `<FullCalendar>` has no `timeZone` prop, so it defaults to browser-local, and the day-count badge uses `isSameDay(new Date(l.date), arg.date)` (also browser-local). The server buckets lessons by `session.user.timezone` (via `getStartOfMonthUTC/…`). When the browser TZ differs from the configured TZ (a supported state via the profile dropdown — e.g. Asia/Kolkata vs Asia/Ho_Chi_Minh), a lesson can render on a different day than reports/earnings bill it on. Display-only (UTC data is never corrupted).

**Fix**: Read the configured TZ on the client (`useSession()`), pass `timeZone={timezone}` to `<FullCalendar>`, and replace the badge comparison with `isSameDayInTimezone(new Date(l.date), arg.date, timezone)` (already in `src/lib/timezone.ts`). Also give `calendar/page.tsx`'s `getInRange` range configured-TZ month boundaries.

---

### 7. Recurring-lesson date math breaks on non-UTC hosts — ✅ FIXED (2026-07-06)

> **Resolved**: `createRecurring` now walks the recurrence on a UTC "civil calendar" cursor (`Date.UTC` + `getUTC*`/`setUTC*`) and converts each matched day to a real instant via `createDateInTimezone(year, month, day, hours, minutes, timezone)`. Weekday/time no longer depend on the host offset — verified on the IST dev machine (occurrences land Wed 18:30 VN, matching production). The leftover `[SERVER DEBUG]` logs in this block were removed at the same time. Original report below for history.

**Where**: `src/server/api/routers/lesson.ts:441-497` (`createRecurring`).

**Cause**: `new Date(year, month-1, day, hours, minutes)` builds a Date from **local** wall-clock components, but the code then reads/mutates it with `getUTCDay()`, `setUTCMonth`, `setUTCDate`, `setUTCHours` and finally `fromZonedTime` (which reads local components again). These only agree when the server offset is 0. On a non-UTC host (e.g. a local IST dev machine) every occurrence's time is shifted by the server offset and the weekday can be wrong. Works on Vercel (UTC) but breaks in local dev.

**Fix**: Use local getters/setters throughout (`getDay`/`setDate`/`setHours`), or — cleaner — compute each occurrence with the existing `createDateInTimezone(year, month-1, day, hours, minutes, timezone)` helper so results are host-TZ-independent.

---

### 8. Client query failures render as silent empty states — **NEW**

**Where**: `src/trpc/query-client.ts:8` (root cause); clearest at `src/app/(root)/calendar/page.tsx:42`.

**Cause**: The `QueryClient` has no global `QueryCache.onError` and no `throwOnError`. Every list query defaults `data` to `[]` and reads only `isPending`, never `isError`. A failed fetch is indistinguishable from an empty result — no toast, no error UI, and it never reaches `(root)/error.tsx`. Most pages are partly masked by `keepPreviousData`/SSR `initialData`, but the calendar has neither, so a transient failure when navigating months shows an empty calendar (teacher may double-book).

**Fix**: Add a global `queryCache: new QueryCache({ onError: (e) => toast.error(e.message ?? "Failed to load data") })`, and read `isError` at the calendar call site to render the existing `src/components/ui/error-state.tsx`.

---

### 9. Failed create/update discards everything the user typed — **NEW**

**Where**: `src/components/lessons/lesson-dialog.tsx:77-124`; `src/app/(root)/students/_components/student-form.tsx:61-95`; `src/app/(root)/pieces/_components/piece-form.tsx:55-86`.

**Cause**: `onMutate` optimistically closes the dialog and calls `form.reset()` **before** the server responds. On error the lesson dialog re-opens blank (its open→reset effect re-blanks it); the student/piece forms can't even re-open. A rejected submit (validation, overlap, offline, expired session) loses all entered data.

**Fix**: Move the close + `form.reset()` out of `onMutate` into the real `onSuccess`; keep `onError` as a toast only, leaving the dialog open with input intact.

---

### 10. Payment transaction amount has no upper bound (int4 overflow) — **NEW**

**Where**: `src/lib/validations/api-schemas.ts:312` (and `:333`).

**Cause**: `amount: z.number().int().min(1)` with no `.max()`, written straight into the `Int` (int4) column. `.int()` passes values like `3_000_000_000`, which then throws an unhandled Postgres "integer out of range" 500; anything from 10,000,001 upward is silently accepted (inconsistent with the 10,000,000 cap on rate fields).

**Fix**: Add `.max(10000000, "Amount seems unreasonably high")` to both `add`/`update` transaction amount schemas.

---

## 🟡 Low-Priority Bugs & Cleanups

> ✅ **All resolved 2026-07-06** (except the `trpc.ts` timing log, now dev-gated) — entries kept below for history.

| #   | Issue                                                                  | Where                                                                 | Fix                                                                                             |
| --- | --------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 11  | ✅ **FIXED (2026-07-06)** Dashboard "today"/label/times now render in the configured TZ; the day picker interprets selections in that zone | `today-lessons-table.tsx` | Done: label/`isToday`/times use `formatInTimezone` + `isSameDayInTimezone`; the query gets the raw `new Date()` instant and the picker maps days via `createDateInTimezone`/`fromUTC` |
| 12  | **NEW** `isPending = a ?? b` is dead code (`isPending` is always boolean), so the submit button never disables in edit mode | `student-form.tsx:161`, `piece-form.tsx:132`                         | Use `\|\|` instead of `??`                                                                       |
| 13  | **NEW** `createRecurring` accepts any non-empty `timezone` string → 500 on invalid IANA | `api-schemas.ts:155`                                                 | `.refine(isValidTimezone, "Invalid timezone")`                                                  |
| 14  | **NEW** `createRecurring` `startDate` regex accepts impossible dates (`2024-13-45` rolls over) | `api-schemas.ts:131-133`                                             | Use `z.string().date()` (or `dateStringSchema`)                                                 |
| 15  | **NEW** `MonthlyReport.lessonMetadata` is an unbounded `z.record` with unvalidated keys | `report.ts:10`                                                       | Validate keys as `.cuid()` and `.refine(o => Object.keys(o).length <= 200)`                     |
| 16  | ✅ **RESOLVED by removal** — `MAKEUP` is a retired, unused status (0 DB rows), so instead of adding it, it was dropped from the Prisma enum **and** every Zod schema | `schema.prisma`, `common-schemas.ts`, `api-schemas.ts` | Consistency restored by removing `MAKEUP` everywhere (enum + validation) |
| 17  | Leftover `console.log("[SERVER DEBUG]…")` in production — **partly fixed** (the `createRecurring` logs were removed with #7; `trpc.ts:99` still open) | `trpc.ts:99`                                    | Remove the remaining debug logging                                                              |
| 18  | **NEW** No `@@index` on `Student.teacherId` / `Piece.teacherId`; no index on `Lesson.pieceId` | `prisma/schema.prisma` (Student, Piece, Lesson)                     | Add the indexes for consistency (`prisma db push`). Minor — per-teacher tables are small        |

---

## 🔒 Security (open)

### 19. No rate limiting / brute-force protection on auth — **(was #8, confirmed)**

**Impact**: `loginAction` and `registerAction` run bcrypt on every request with no attempt counting, backoff, or lockout — open to online password brute-force and email harvesting. There is **no** rate limiting anywhere in the app (middleware `src/proxy.ts` only redirects; tRPC has only a timing logger).

**Where**: `src/server/actions/auth-actions.ts:14,78`; reached via `src/server/auth/config.ts:63`.

**Fix**: Add a shared limiter keyed on IP + email (Upstash Redis or a DB-backed attempt table — serverless instances share no memory), with a threshold + temporary lockout, returning a generic throttle message. Reset on success.

---

### 20. Weak password policy — **NEW**

**Where**: `src/lib/validations/auth-schemas.ts:33` (and `:13`).

**Cause**: `password` only requires `.min(6)` with no complexity/breach check, so `123456` is accepted. Combined with #19, weak passwords are brute-forceable online.

**Fix**: Raise `registerSchema.password` to `.min(10)` + a letter/digit `.refine`, optionally reject a common-password list. Keep `loginSchema` lenient so legacy accounts still authenticate. (bcrypt cost 10 is already fine.)

---

### 21. Account enumeration (registration message + timing) — **NEW**

**Where**: `src/server/actions/auth-actions.ts:96` ("Email already registered."); `src/server/auth/config.ts:55-66` (early return vs bcrypt compare timing).

**Cause**: Registration returns a distinct "already registered" message, and `authorize()` returns early for unknown emails (no bcrypt) vs runs a full compare for known ones — a measurable timing side-channel. Login itself correctly returns a generic message.

**Fix** (hardening — full elimination is impractical for a registration form): funnel the collision into a generic failure message and/or move to email-verification; always run a bcrypt compare against a fixed dummy hash when the user/password is absent to equalize timing. Pair with #19's rate limiting.

---

## 🧱 Backlog (real, but improvements not bugs)

> ✅ **Mostly implemented 2026-07-06**: **#22** Vitest suite (27 tests over timezone / payment / rate / schemas, incl. the money-netting & stale-snapshot fixes), **#24** error tracking wired through `env.js` + `logError` at the query/tRPC/boundary seams, **#25** calendar loading skeleton + `keepPreviousData` + event aria-labels/keyboard + list-view link, **#26** shared `useTableViewPersistence` / `DataTablePagination` / `DataTableViewToggle`. Only **#23** (server-side pagination) remains — intentionally deferred for single-user scale.

### 22. No Unit Tests — **(#1, still open)**

Zero test files and no test tooling. `npm run check` runs only lint + `tsc` (not a substitute).

**Fix**: `npm install --save-dev vitest @testing-library/react @testing-library/jest-dom`. Start with `src/lib/*` (rate, currency, payment, timezone, format), the Zod schemas, and the tRPC routers (mock Prisma). Target 80%+ on utils + API layer.

---

### 23. Client-Side Only Pagination — **(#2, still open)**

`student.getAll`, `piece.getAll`, and `lesson.getAll` fetch **all** rows (no `skip/take/count/cursor`); the students/pieces tables paginate purely client-side (`getPaginationRowModel`, pageSize 10) over the full dataset. Payments' list is bounded by student count per month, not true pagination. Fine at current scale; won't hold past a few hundred rows. A `paginationSchema` already exists in `common-schemas.ts` but is unused.

**Fix**: Add cursor/offset pagination (`skip`/`take` + `count`) to the `getAll` procedures and switch tables to `manualPagination`.

---

### 24. No Production Monitoring — **(#10, partially addressed)**

`src/lib/error-handler.ts` now has an opt-in webhook (`sendErrorToTrackingService` → `NEXT_PUBLIC_ERROR_TRACKING_URL`), but no real service is installed, the env var isn't in the validated `src/env.js` schema (so it's effectively never enabled), production errors are held only in a 100-entry in-memory array (lost on cold start), and console logging is dev-only.

**Fix**: Integrate Sentry (`instrumentation.ts`) and add the tracking URL to `env.js` if the webhook is kept.

---

### 25. Calendar accessibility & loading state — **(#9 narrowed, + Q4)**

Most of the app is now accessible (icon buttons have `sr-only` labels, custom controls have roles/keyboard handlers, the rest inherit from Radix). The remaining gap is the **FullCalendar** view: no keyboard navigation and no keyboard alternative to click/drag/resize, and events carry no `aria` labels. Separately (**Q4**), `calendar/page.tsx:42` only reads `data` from `api.lesson.getInRange.useQuery` and never surfaces `isPending`, so the grid renders empty during fetch instead of a loading skeleton.

**Fix**: Add keyboard handlers / `aria` to calendar events; read `isPending`/`isFetching` and render a calendar-shaped `Skeleton` while loading.

---

### 26. Remaining Table Duplication — **(#4, downgraded to cleanup)**

A shared `DataTable` (`src/components/ui/data-table.tsx`) now exists and both tables use it, so the original "no abstraction" claim is resolved. Still copy-pasted between `StudentsTable` and `PiecesTable`: the pagination footer (~50 identical lines), the search + view-toggle toolbar, the `sessionStorage` view-persistence effects, the `useReactTable` config, and the delete/`ConfirmDialog` flow.

**Fix**: Extract a `DataTablePagination` component, a `useTableViewPersistence` hook, and use the already-exported `DataTableToolbar`.

---

## Resolved Since Last Audit

Verified fixed in the current codebase — kept here for history:

| Old #  | Issue                                  | Resolution                                                                                          |
| ------ | -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| #3     | Dashboard used hardcoded `data.json`   | Dashboard now sources everything from real `api.earnings.*` tRPC queries; no `data.json` exists.    |
| #5     | Missing/weak input validation          | Every one of the 7 routers' procedures has a strict Zod `.input()` schema (bounded strings/numbers).|
| #6     | No loading skeletons                    | Real `Skeleton` placeholders on dashboard/report view, `AppLoader` on lessons/reports, loading state on payments, global `src/app/loading.tsx`. |
| #7     | Empty states missing                    | Shared `DataTableState` + per-view `length === 0` empty blocks on every list surface.                |
| Q1     | Lesson duration unbounded               | `createLessonSchema`/`updateLessonSchema`/recurring all enforce `.int().min(15).max(480)`.          |
| Q3     | Missing error toast on mutations        | All 16 `_components` mutations surface `toast.error` (via `onError` or `try/catch` on `mutateAsync`).|
| Q5     | Profile email not validated             | `profile-form.tsx:25` uses `z.string().email(...)` wired through `zodResolver`.                      |

> Note: **Q2** ("no `onDelete: Cascade` on some relations") from the old quick-fix list was **not** resolved — it's now tracked as the more serious **High-Priority Bug #1** above (auth/payment/report relations gained cascade, but `Lesson.student/teacher/piece` still lack it).

---

## Recommended Fix Order

All correctness & cleanup bugs (#1–#18) are fixed as of 2026-07-06. Remaining work:

1. **Security (#19–#21)** — add auth rate limiting, stronger passwords, and reduce account enumeration before wider use.
2. **Backlog** — #22 tests, #24 monitoring, #25 calendar a11y/loading, and #26 table DRY are done (2026-07-06). Only **#23** server-side pagination remains, deferred until a `getAll` regularly returns hundreds of rows.
