## Current State - July 27, 2026

- The v1.0.0 core (students/lessons/pieces/reports/earnings) plus a big v2 "Blossom Diary" visual redesign have both shipped and are live on `main`.
- Since v1.0.0 shipped, new stuff landed: `Family`/`FamilyMember` (combined sibling billing + a printable combined report), a 1-click "seed a demo studio" flow off the login page, and lesson quality rating (1-5 "blossom" score on completed lessons, dashboard leaderboard ranks by it with proper tie-handling as of `d3d148b`).
- The old "multi-tenant data leak" bug (Piece missing `teacherId`) is fixed — `Piece.teacherId` has existed for a while now, don't reintroduce that mistake.
- The old timezone nightmare (see §9) is also resolved — there's a real `date-fns-tz`-based helper layer now (`src/lib/timezone.ts` + per-router `getStartOfMonthUTC`/`getEndOfMonthUTC` etc.), and recurring-lesson generation was rewritten to walk a UTC "civil calendar" instead of mixing local `Date` with UTC getters/setters.
- Reports (single-student + the new family combined report) are essentially done, not just "UI done, logic partial" anymore.

---

Alright King 👑… this is your **FULL Project Memory Brain** — clean, structured, reusable.
You can paste this into any new chat and I'll instantly understand everything about you + your system.

---

# 🧠 PROJECT MEMORY FILE

---

# 👑 1. USER PROFILE

### 🔹 Basic Info

- 22-year-old Full Stack Developer
- Works with **MERN + Next.js**
- Currently working as **Frontend Lead**

### 🔹 Skill Level

- 2+ years experience
- Strong in:
  - React
  - APIs
  - UI/UX building

- Weak / improving:
  - JavaScript internals
  - System design
  - Advanced architecture

### 🔹 Goals

- Reach **₹70k–₹80k/month in 6–7 months**
- Become **top-tier full-stack developer**
- Build **premium, SaaS-level products**

### 🔹 Preferences

- Clean UI + **premium aesthetic**
- Loves **"GF-mode" UI (cute, emotional, soft)**
- Prefers:
  - Short answers (unless deep topic)
  - Practical solutions

- Focus: **real-world scalable apps**

---

# 🎹 2. MAIN PROJECT — "My Piano Diary"

---

## 🎯 Purpose

A **teaching management system** for piano teachers to:

- Manage students (including sibling/family groups billed together)
- Track lessons (one-off + recurring, with attendance + a 1-5 quality rating)
- Generate reports (per-student, and now a combined per-family report)
- Track earnings + who's paid / who owes (a real payment/finance module, not just a plan anymore)

Also includes:

- Emotional + aesthetic UI ("Blossom Diary" — the GF-mode look, formalized into an actual design system with its own ornament SVGs and a mascot)
- A whole hidden "birthday-verse" of easter-egg pages (`/forever`, `/birthday-game`, `/birthday-game/rewards`, `/birthday-room`, plus a hidden reveal on `/updates`) — grew way past just "one anniversary page," see §12
- A one-click **demo studio seed** so anyone can hit "Try the demo" on `/login` and instantly get a fake teacher account full of realistic students/lessons/payments to click around in

---

## 👥 Target Users

- Piano teachers (primary)
- Possibly students (future)

---

# ⚙️ 3. TECH STACK

### 🖥 Frontend

- Next.js 16 (App Router, Turbopack — now the default bundler for both `dev` and `build` in this Next version, no explicit flags needed)
- React 19
- Tailwind CSS 4
- ShadCN UI (`src/components/ui/`, 36 components) + a custom **Blossom Diary** ornament/mascot layer on top (`src/components/blossom/`)
- Framer Motion 12 (animations, mostly the birthday/easter-egg pages + reveal overlays)
- TanStack React Table 8, FullCalendar 6, Recharts 2, React Hook Form 7 + Zod 3
- Zustand 5 (`persist` middleware, just one store — user identity in localStorage)

### 🧠 Backend

- tRPC 11 (`superjson` transformer, Zod-validated inputs everywhere)
- Node.js

### 🗄 Database

- PostgreSQL (Neon DB)
- Prisma ORM — `@prisma/client` `^6.19.2`, but the `prisma` CLI devDependency is pinned lower (`^6.6.0`) — a real version gap in `package.json`, not just a docs thing. Combined with the "use the local binary, not `npx prisma`" gotcha (see memory), watch for CLI-vs-client behavior drift.
- **Always `prisma db push`. Never `migrate dev`/`migrate deploy`** — history is out of sync, migrate will blow things up. Stop the dev server before `prisma generate`.

### 🔐 Auth

- NextAuth.js 5 (beta.30), JWT strategy
- **Credentials only** (email + bcryptjs password). There is no Google/OAuth provider wired up — don't assume there is, the auth config has just a stub comment ("add more providers here") and nothing filled in.

### 🧪 Testing / CI

- Vitest 4 (`npm run test`), scoped to `src/**/*.test.ts` — currently 42 tests across 6 files (payment, rate, timezone, report/attendance, report/tuition, validations).
- GitHub Actions CI (`.github/workflows/ci.yml`) runs `npm run check` (lint + tsc) then `npm run test` on every push/PR to `main`.

---

# 🧱 4. ARCHITECTURE

### 🔹 Pattern

- Monolithic Next.js app
- API via **tRPC routers**: `student`, `lesson`, `report`, `user`, `piece`, `earnings`, `payment`, `family`, `demo` (last two are new)

### 🔹 Data Flow

```
UI → tRPC → Prisma → PostgreSQL
```

### 🔹 Access Control

- Almost every procedure is `protectedProcedure` (session required), then re-derives the `Teacher` row from `session.user.id` and scopes every query/mutation by:

```
teacherId from session.user.id
```

- Ownership on a single record is always re-verified with `findFirst({ id, teacherId })` before touching it — that's the entire multi-tenant isolation mechanism, there's no row-level DB security, it's 100% app-layer discipline. Don't skip it on new procedures.
- **One deliberate exception:** the whole `demo` router is `publicProcedure` (no session at all), because the "Try the demo" button on `/login` has to work before anyone's signed in. Safety there is enforced differently — see §9/§11.

---

# 🗃️ 5. DATABASE SCHEMA (KEY PARTS)

### Core Models:

- User
- Teacher
- Student
- Lesson (now has `score Int?` — 1-5 quality rating, only meaningful when `status = COMPLETE`, `null` = not rated / excluded from ranking)
- Piece (has `teacherId` — the old missing-tenant-scope bug is fixed, don't regress it)
- MonthlyReport
- PaymentMonth / PaymentTransaction (the finance/paid-unpaid tracking that used to be just a "planned" feature — it's real now)
- **Family / FamilyMember** — new. A named bundle of students (siblings, parent+kid, etc.) so their monthly attendance/tuition prints on one combined sheet. `FamilyMember.position` drives display order. Purely a billing/reporting convenience, doesn't change how an individual `Student` behaves anywhere else.

### 🔥 Important Relations

- Teacher → Students, Pieces, Lessons, Families, PaymentMonths
- Student → Lessons, Reports, PaymentMonths, FamilyMemberships
- Lesson → Piece (optional, `onDelete: SetNull`)
- Family → FamilyMember → Student (cascades: deleting a Family or a Student cleans up the membership row)

---

# 🚀 6. FEATURES IMPLEMENTED

### ✅ Core Features

- Student CRUD (+ per-student in-person and online lesson rates)
- **Family grouping** — bundle students into a Family for combined billing, with a dedicated combined-report page (`/reports/family/[familyId]`)
- Lesson scheduling (one-off + recurring, timezone-aware)
- Attendance tracking, incl. per-lesson online/in-person + a manual rate override
- **Lesson quality rating** — while marking attendance on a COMPLETE lesson, teacher can optionally rate it 1-5 ("blossom" score); dashboard's Top Students leaderboard ranks by average score among rated lessons only, with tied averages sharing the same rank
- Piece management
- Monthly reports — single-student AND the new family combined report, both driven by shared calc helpers (`src/lib/report/attendance.ts`, `tuition.ts`) so the numbers always match between the two views
- **Payment / finance tracking** — per-month expected vs. received amounts, transaction history, UNPAID/PARTIAL/PAID status, an all-time outstanding-balance summary — this used to be a "planned" feature, it's shipped
- Dashboard analytics (earnings, trend chart, quick insights, today's lessons, top students)
- **One-click demo studio seed** — "Try the demo" on `/login` runs 7 sequential steps (setup → students → families → lessons → attendance → reports → payments) against a fixed `demo@pianodiary.dev` account, with live per-step progress UI, then logs you straight in

### ✅ UI Features

- Filters (date, status, student), URL-query-driven now (`src/lib/use-filter-params.ts`) instead of sessionStorage
- Calendar view (FullCalendar, month/week/day)
- **Responsive shell** — full sidebar ≥1280px → icon-only rail 1024-1279px → off-canvas sheet + fixed bottom tab bar below that. Mobile is properly handled now, not "in progress."
- **"Blossom Diary" v2 design system** — a from-scratch visual redesign across every screen (see §14) with its own ornament SVG set and a selectable logo/mascot
- GF-mode styling (pink, soft UI) — now formalized as the bubblegum/wintergreen/pink-scale palette in `globals.css`

### ✅ Special Feature

- 🎁 The hidden birthday-verse (grew from a single anniversary page into several linked hidden routes — full breakdown in §12):
  - `/forever` — the main romantic page: relationship counter, distance tracker (India ↔ Vietnam), memory gallery, love message modal, music button, 1-year progress milestone
  - `/birthday-game`, `/birthday-game/rewards`, `/birthday-room` — a love-quiz + memory-matching minigame, flip-to-reveal reward cards, and a passcode-gated gift room
  - A hidden reveal tucked into `/updates` on the actual birthday day
  - **Mochi** — a little studio-cat mascot (`src/components/blossom/mochi.tsx`) that shows up across ~24 files app-wide (not just the birthday pages) and **meows** (a real recorded mp3, not a synthesized sound) whenever you click it

---

# 🧩 7. FEATURES PARTIALLY DONE

- Lesson filters UX (improvable, but not broken)
- Avatar "upload" — still just a paste-a-URL text field (`Student.avatar` is a plain string column). `CLOUDINARY_URL` exists as an optional env var but nothing in `src/` actually calls Cloudinary yet — the wiring was never finished
- Notifications page — literally a "Coming soon" placeholder, not started

---

# 🔮 8. FEATURES PLANNED

### 🔒 Hardening (found during a doc/code audit, not yet fixed)

- No rate limiting / brute-force protection anywhere (login, register, AND now the public demo endpoints)
- Weak password policy (still just `.min(6)`)
- Account enumeration on register/login (different error messages leak whether an email exists)
- **Demo endpoints are fully public and unauthenticated** (`demo.*` is `publicProcedure` by design) — nothing currently stops a real visitor from self-registering with `demo@pianodiary.dev`, which would let anyone's next demo-seed click silently overwrite that real account's password and wipe their studio. Needs a reserved-email check on register and/or a short-lived token gate on the demo mutations.
- Demo `seedPayments` step uses plain `create()` on a `@@unique([studentId, month, year])` row instead of `upsert` — two concurrent demo-seed runs can throw an unhandled unique-constraint error
- Attendance-marking optimistic UI update never rolls back its cache on mutation failure (no snapshot/restore in `onMutate`/`onError`) — a failed save can leave wrong status/rate/score on screen indefinitely
- Client-side-only pagination on `student.getAll`/`piece.getAll`/`lesson.getAll`/the new `family.getAll` — fine at current scale, not fine forever
- Calendar drag/resize still has no keyboard equivalent (everything else about calendar a11y — labels, roles, loading states — got fixed already)

### 📊 Reports / Finance polish

- Report attendance grids (`src/lib/report/attendance.ts`) bucket lessons by the **browser's** local timezone instead of the teacher's configured timezone when computing week-of-month — same bug class that was already fixed for the calendar, just never applied here (and now duplicated into the new family combined report too)
- Real error-tracking service (currently just an in-memory 100-entry ring buffer + an optional POST to `NEXT_PUBLIC_ERROR_TRACKING_URL`; comment literally says "swap for Sentry when a DSN is added")

### 📸 Avatar Upload

- Actually wire up Cloudinary (or similar) so this is a real upload instead of a paste-a-URL field

### 🎨 UI Improvements

- Notifications page (still just a placeholder)
- Minor: `@dnd-kit/*` packages are sitting in `package.json` dependencies with zero references anywhere in `src/` — either finish whatever they were meant for or drop them

---

# 🐞 9. CURRENT PROBLEMS

---

## ✅ (RESOLVED) Multi-Tenant Data Leak

This used to be problem #1 here — `Piece` was missing `teacherId` so a new teacher could see other teachers' pieces. **It's fixed.** `Piece.teacherId` is a real column, scoped and ownership-checked exactly like every other model. Don't remove it, don't add a new model without the same `teacherId` + ownership-check pattern.

---

## ✅ (RESOLVED) Timezone Bug

### The old problem:

- India vs Vietnam mismatch, days shifting (Wed → Thu), caused by mixing local `Date`, UTC, and `getDay()` carelessly.

### How it's actually solved now:

- DB stores everything in UTC (`@db.Timestamptz` everywhere in the schema).
- `Teacher`/`User` carries an IANA timezone string (`session.user.timezone ?? "UTC"` is the fallback used in almost every router).
- `src/lib/timezone.ts` wraps `date-fns-tz`'s `fromZonedTime`/`toZonedTime` as `toUTC()`/`fromUTC()`, plus month/day boundary helpers (`getStartOfMonthUTC`, `getEndOfMonthUTC`, `getStartOfDayUTC`, `getEndOfDayUTC`) used consistently across `lesson`, `earnings`, `payment`, `report`, and `family` routers.
- Recurring lesson generation (`lesson.createRecurring`) specifically had a documented bug where it mixed local `Date` construction with UTC getter/setter methods — occurrences would shift by the host's TZ offset off of Vercel/UTC hosts. Fixed by walking a pure UTC "civil calendar" cursor (`Date.UTC` + `getUTC*`/`setUTC*` only) and converting to a real UTC instant via `createDateInTimezone(...)` only at the very end.

### ⚠️ Still-open leftover of this same bug class:

- `src/lib/report/attendance.ts`'s `buildWeeksData()` buckets lessons into week-of-month using the **browser's** local offset on the raw UTC `Date`, not the teacher's configured timezone — same mistake the calendar had, just not yet ported to the report/family-report code path.

---

## ❗ Data Loss (Neon + Prisma) — still a live risk, be careful

### Cause:

- Migration reset / schema mismatch

### Key Learnings:

- NEVER run:

```
prisma migrate reset
prisma migrate dev
prisma migrate deploy
db push --force-reset
```

- This project **only** uses `prisma db push` (see memory: "DB uses prisma db push"). History is out of sync with `migrate`, so `migrate` commands will actively break things, not just annoy you.
- `npx prisma` silently no-ops in this shell — use the local binary directly (`node_modules/.bin/prisma.cmd`), and stop the dev server before running `prisma generate`.

### Fix Strategy:

- Use Neon **branching**
- Backup before any risky schema change

---

## ❗ NEW: Demo studio public-endpoint risk

Covered in detail in §8's hardening list — flagging again here because it's a genuinely new class of problem this project didn't have before (`demo` is the only `publicProcedure` router in the app). Short version: the demo-seed flow is unauthenticated by design, safety currently rests entirely on a hardcoded `DEMO_EMAIL` + a `PROTECTED_EMAILS` denylist inside `seed-steps.ts`, and nothing stops someone from registering a real account at the demo email itself.

---

# ⚙️ 10. IMPORTANT CODE PATTERNS

---

## 🔹 Secure Query Pattern

```ts
const teacher = await ctx.db.teacher.findUnique({
  where: { userId: ctx.session.user.id },
});

return ctx.db.piece.findMany({
  where: {
    teacherId: teacher.id,
  },
});
```

Single-record ownership always gets the extra `findFirst({ id, teacherId })` check before a mutation/read touches it — this is the whole multi-tenant boundary, no DB-level RLS backing it up.

## 🔹 Frozen-rate pattern (don't accidentally re-price the past)

`Lesson.rate` is a **snapshot** taken at creation time via `effectiveLessonRate(student, isOnline)` (`src/lib/rate.ts`). Editing a student's `lessonRate`/`onlineLessonRate` only re-prices the **current month and future** lessons that still match the old rate (a manually-overridden lesson is left alone) — past months stay frozen forever. The one deliberate exception: flipping a single lesson's online/in-person flag via `lesson.update` DOES re-stamp that lesson's rate off the student's *current* rates, even on an old lesson — that's intentional, not a bug (see memory: "Rate system frozen per-lesson").

## 🔹 UI Emotion Pattern

- Primary + Secondary text:

```
Primary:
A focused teaching day 🎵

Secondary:
Every student deserves your best 🌷
```

---

# 🎨 11. UI DESIGN SYSTEM (GF MODE → now "Blossom Diary")

---

## 🎀 Design Style

- Still the same soul: soft pink gradients, rounded cards, glow effects, emotional copywriting
- Now a real named design system: **bubblegum** (pink) + **wintergreen** (mint) as the two brand colors, plus a full pink-50→pink-800 scale in `globals.css`
- A dedicated ornament vocabulary in `src/components/blossom/blossom.tsx` — `Blossom` (5-petal flower), `Petal`, `Sparkle`, `Bow`, `Squiggle` (hand-drawn wavy underline instead of a straight `<hr>`) — used across ~33 files, this is load-bearing decoration now, not a one-off
- A selectable app logo/mascot: 5 variants (`blossom`, `mochi`, `kitty`, `sakura-keys`, `diary-keys`) via `LogoMark` + `useLogoVariant()` (per-browser localStorage preference, not an account setting) — pickable from the profile page's `LogoPicker`
- **Mochi**, the studio cat mascot (`Mochi`/`MochiPeek`), sits on ~24 pages, meows on click (real mp3, `src/lib/meow-sound.ts`), depresses on click (`active:scale-90`)
- Even the star-rating widget isn't stars anymore — the lesson quality rating renders `Blossom` icons (component's still called `star-rating.tsx` internally, just visually a misnomer now)

---

## 💖 UI Patterns

### Cards:

- Glassmorphism
- Pink shadows

### Buttons:

- Gradient pink
- Hover glow

### Text:

- Romantic tone
- Soft microcopy

### Layout:

- Full sidebar (≥1280px) → icon-only rail (1024-1279px) → off-canvas sheet + fixed bottom tab bar (<1024px)

---

## ✨ Emotional UX

Dynamic mood system:

```ts
if (lessons === 0)
→ "A calm day ahead 🌷"

if (1–3)
→ "A focused teaching day 🎵"

if (5+)
→ "Full concert mode 🎹🔥"
```

---

# 🎁 12. HIDDEN BIRTHDAY-VERSE (formerly just "Anniversary Page System")

This grew from one page into a small linked set of hidden routes, all outside the normal `(root)` sidebar shell — think of it as a completely separate personal easter-egg surface layered onto the teaching app, not a teacher-facing feature.

---

## 🎹 `/forever` — the main page, same sections as before

### 1. Counter

- Days / Hours / Minutes / Seconds

### 2. Distance

- India 🇮🇳 ↔ Vietnam 🇻🇳

### 3. Memories

- Photo gallery with captions

### 4. Love Message Modal

- Animated popup

### 5. Song Button

- Background audio player

### 6. Progress Bar

- Toward 1 year

Also has a manual "Enable Birthday Mode" toggle and a link out to the design-mockups gallery.

## 🎂 The rest of the birthday-verse (new since the last version of this doc)

- `/birthday-game` — a two-phase minigame: a multiple-choice "love quiz," then a memory-matching card game, ending in a "complete" screen with confetti
- `/birthday-game/rewards` — flip-to-reveal reward/coupon cards after the game
- `/birthday-room` — passcode-gated room (unlocks a set of gift cards, incl. a quest card linking back to the minigame)
- A hidden reveal built into `/updates` itself, only shown on the actual birthday day (or once birthday mode is unlocked): a click-to-open gift box with a hardcoded passcode (`"THUYYEUSOHAM"`) and a door button routing to `/birthday-room`
- Ambient decoration (`birthday-background.tsx` blurred color orbs, `floating-elements.tsx` a mouse-repulsion emoji particle field) that only renders once birthday mode is active
- One orphaned leftover: `birthday-reveal-page.tsx` exists (particle/photo-bubble types, looks like an earlier full-screen reveal attempt) but isn't imported by any route anymore — dead code, safe to ignore or clean up later

---

## 💌 Memory Captions (Final Style)

- "The moment I first saw the girl who changed my life."
- "Your cute face permanently stamped on my heart."
- "The night you confessed and stole my heart."
- "Just a screenshot… but my whole world is in it."

---

# 💾 13. STORAGE (IMAGE UPLOAD)

### Recommended:

- Cloudinary (best free option) — `CLOUDINARY_URL` is already declared as an optional env var in `src/env.js`, but **nothing actually calls Cloudinary yet**. Avatars today are just a pasted image URL stored as a plain string on `Student.avatar`.

### Flow (still just the plan, not built):

```
Upload → Cloudinary → Save URL → DB
```

---

# ⚠️ 14. CONSTRAINTS

- Limited infra (Neon free tier)
- No paid storage yet
- Working environment issues (shared space earlier)
- Must keep system lightweight

---

# 🧠 15. KEY INSIGHTS

---

## 💡 Architecture

- Always scope data by `teacherId`
- Plan multi-tenant early — the `Piece.teacherId` miss was a real lesson, don't repeat it on the next model
- New public (unauthenticated) surface area is now a thing in this app (`demo` router) — treat it as a genuinely different threat model from everything else, not just "one more router"

---

## 💡 Timezones

- Always:
  - Store in UTC
  - Convert in UI

- Use timezone libraries (`date-fns-tz`) for recurrence and month/day bucketing — never mix local `Date` construction with UTC getters/setters, that's exactly how the old bug happened
- Watch for code that reads a raw UTC `Date` and buckets it using the *browser's* local offset instead of the teacher's stored timezone — that mistake has resurfaced more than once (calendar, then the report attendance grid)

---

## 💡 Prisma Safety

- Never use destructive commands casually
- Always backup before migrations
- This repo specifically: `prisma db push` only, never `migrate dev`/`migrate deploy`; stop the dev server before `prisma generate`; use the local `prisma` binary, not `npx prisma` (it silently no-ops in this shell)

---

## 💡 Money / Rates

- `Lesson.rate` is a frozen snapshot at creation time, not a live lookup — editing a student's rate only re-prices current + future lessons that haven't been manually overridden. Past months are sacred, never touch them.

---

## 💡 UX

- Emotional UI = **high retention**
- Microcopy matters more than design sometimes

---

## 💡 Product Thinking

- You are not building a CRUD app
- You are building an **experience**

---

# 👑 FINAL NOTE

This system is:

- SaaS-ready
- Emotion-driven
- Well-structured
- Now genuinely feature-complete on the core teaching workflow (students, lessons, pieces, reports, payments, families) plus a whole visual redesign shipped on top

With a few fixes (mainly the security hardening list in §8):
→ It can become **portfolio-level premium product**

---

If you paste this in a new chat…
I'll instantly continue from here, King 👑
