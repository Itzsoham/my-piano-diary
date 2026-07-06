# Future Features & Roadmap

> New features to build and long-term plans for **my-piano-diary**.
>
> **Scope**: this is a personal, single-user teaching diary. There is **one** user — you, the teacher. Students are records you manage, **not** logins. No multi-tenant / multiple-teacher setup, and no student/parent accounts. Features are planned with that in mind.

**Last Updated**: July 6, 2026

---

## ✅ Already Shipped

These were on the old roadmap and are now live, so they've been removed from the plan below:

- **Earnings & revenue dashboard** — `earnings` tRPC router + `/dashboard` with live section cards and an intelligence panel (the old static `data.json` is gone).
- **Payment tracking (per student, per month)** — `payment` router with `PaymentMonth` + `PaymentTransaction` models, a `/payments` page, expected-vs-received per month, partial payments, and per-student history.
- **Recurring lessons** — `lesson.createRecurring` generates weekly/biweekly occurrences across a date range in the configured timezone.
- **Monthly reports** — `report` router + `MonthlyReport` model, `/reports` per student per month (summary, comments, next-month plan, tuition note).
- **Frozen per-lesson rates** — every lesson snapshots its own rate (online vs. in-person); past months never re-price.

> Known bugs in these shipped modules are tracked in `ISSUES_AND_FIXES.md`.

---

## Phase 1 — High Priority

### Advanced Analytics

The dashboard already shows the headline numbers (earnings, student count, this-month lessons, outstanding). This is the deeper cut, on a new `/analytics` page:

- Attendance rate per student (% present)
- Most-taught pieces
- Busiest days / times of the week
- Monthly lesson-count trends
- Export data to CSV

---

### Notifications & Reminders

The `/notifications` route already exists (currently a "coming soon" placeholder — `notifications/page.tsx`).

- Upcoming-lesson reminders (in-app)
- Report-generation reminders (e.g. "3 students still need a report this month")
- Unpaid-this-month nudges

**Stack**: in-app first — a `Notification` table + a Zustand store. Optional email later (Resend), only to your own address, so keep it lightweight.

---

### Student Progress Tracking

Enrich student profiles with:

- Piece progression per student (started → in progress → completed)
- Performance rating (1–5) per lesson
- Notes history timeline per student
- Visual progress chart on the profile page

---

## Phase 2 — Important

### Printable Invoices / Receipts

Payment tracking already stores expected/received per month — this adds **output**, not new data:

- Generate a per-student, per-month invoice/receipt as a printable page → PDF (browser print, reusing the existing report print styles)
- Optional "paid in full" receipt once a month's balance clears

No new `Invoice` model needed — derive everything from `PaymentMonth` + `PaymentTransaction`.

---

### Bulk Operations

- CSV import for students
- Batch attendance marking (mark several lessons complete/absent at once)
- Bulk archive/delete students

(Bulk recurring-schedule creation already shipped via `createRecurring`.)

---

### Image & File Uploads

Add image support for students and pieces, plus file attachments for lessons.

**What to add**:

- **Student avatar**: upload a photo per student (shows in tables, profile, reports) — `Student.avatar` field already exists.
- **Your profile image**: upload your photo (shows in sidebar/profile) — `User.image` field already exists.
- **Piece image/thumbnail**: cover image or sheet-music preview per piece — needs a new `Piece.imageUrl` field.
- **Lesson attachments**: attach sheet-music PDFs, recordings, or notes to lessons.

**Storage**: all uploads go to **Cloudinary**.

**Setup**:

```bash
npm install cloudinary next-cloudinary
```

Add to `.env`:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Implementation**:

- Use `next-cloudinary` `CldUploadWidget` for client-side uploads (no server needed for the upload itself).
- Cloudinary returns a URL after upload → save the URL to the database.
- Organize uploads into folders: `my-piano-diary/students/`, `my-piano-diary/pieces/`, `my-piano-diary/lessons/`, `my-piano-diary/profile/`.
- Use Cloudinary transformations for thumbnails (auto resize, crop, format).

For lesson attachments, add a model:

```prisma
model LessonAttachment {
  id        String   @id @default(cuid())
  lessonId  String
  name      String
  url       String   // Cloudinary URL
  publicId  String   // Cloudinary public_id (for deletion)
  type      String   // "image", "pdf", "audio"
  size      Int      // bytes
  createdAt DateTime @default(now())
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
}
```

**tRPC**: `upload.deleteFile({ publicId })` (server-side, uses the API secret). The upload itself is client-side via `CldUploadWidget`, no tRPC needed.

**UI**: a reusable `ImageUpload` component (wraps `CldUploadWidget`, preview + change/remove), used in the student and piece dialogs and the profile page; a `FileAttachment` area in the lesson detail; and `CldImage` for optimized delivery in tables/cards.

---

## Phase 3 — Enhancements

### Google Calendar Sync

- One- or two-way sync with your Google Calendar
- Auto-create Google Calendar events when scheduling lessons
- Import events from Google Calendar
- Uses the Google Calendar API

---

### Mobile / PWA

- Add `manifest.json` + a service worker (the app is already responsive)
- Installable, with offline access to the schedule
- Push notifications for reminders

(No React Native — a PWA is enough for a single-user tool.)

---

### Dark Mode Polish

- `next-themes` is already wired up
- Audit all components for correct dark-mode colors
- Add theme-aware charts
- Ensure print styles work in dark mode

---

### Advanced Piece Management

- Piece categories / tags
- Difficulty progression path
- Recommended pieces by level
- Per-student piece-completion tracking

---

### Two-Factor Authentication

- TOTP-based 2FA + recovery codes for your account (single login, so this is optional hardening)

---

## Phase 4 — Nice to Have

### Student Groups / Classes

- Group students for group lessons
- Shared schedule for a group
- Per-group notes / reporting

---

## Implementation Priority Matrix

| Feature                     | Impact | Effort | Priority |
| --------------------------- | ------ | ------ | -------- |
| Advanced Analytics          | High   | Medium | **P1**   |
| Notifications & Reminders   | Medium | Medium | **P1**   |
| Student Progress Tracking   | Medium | Medium | **P1**   |
| Printable Invoices/Receipts | Medium | Low    | **P2**   |
| Bulk Operations             | Medium | Low    | **P2**   |
| Image & File Uploads        | Medium | Medium | **P2**   |
| Google Calendar Sync        | Medium | High   | **P3**   |
| Mobile / PWA                | Medium | Low    | **P3**   |
| Dark Mode Polish            | Low    | Low    | **P3**   |
| Advanced Piece Management   | Low    | Medium | **P3**   |
| Two-Factor Authentication   | Low    | Medium | **P3**   |
| Student Groups              | Low    | Medium | **P4**   |

---

## Adding a New Feature (Step-by-Step)

Quick reference for building any new feature:

1. **Schema** — Add the model to `prisma/schema.prisma`, then run `npm run db:push`. This repo uses `prisma db push` — **never** `migrate dev` / `migrate deploy` (the migration history is intentionally out of sync with the Neon database). Stop the dev server before generating the client.
2. **Validation** — Create a Zod schema in `src/lib/validations/`.
3. **Router** — Create a tRPC router in `src/server/api/routers/feature.ts`.
4. **Register** — Add the router to `src/server/api/root.ts`.
5. **Page** — Create `src/app/(root)/feature/page.tsx` (Server Component, fetch data).
6. **Components** — Create `src/app/(root)/feature/_components/` (Client Components).
7. **Navigation** — Add a link to the `data.main` or `data.manage` array in `src/app/(root)/_components/app-sidebar.tsx`.
8. **Tests** — There is no test tooling yet (see `ISSUES_AND_FIXES.md` backlog #22); add coverage as it lands.
