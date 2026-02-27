# Future Features & Roadmap

> New features to build, enhancements to add, and long-term plans.

**Last Updated**: February 27, 2026

---

## Phase 1 — High Priority (Next 2 Weeks)

### Earnings & Revenue Dashboard

The `Student.lessonRate` field already exists in the database.

**What to build**:

- New tRPC router: `earnings`
  - `earnings.getMonthlyTotal({ year, month })` — sum of (lessons × lessonRate) per student
  - `earnings.getByStudent({ studentId, year })` — earnings breakdown by month
  - `earnings.getYearlyTotal({ year })` — total annual earnings
  - `earnings.getTrend({ months: 12 })` — monthly trend data for chart
- New page: `/dashboard` or `/earnings`
  - Total earned this month / this year
  - Earnings chart (line/bar) over time
  - Per-student breakdown table
  - Unpaid/upcoming lesson estimates

**Why**: Teachers need to track their income for billing and taxes.

---

### Payment Tracking (Per Student, Per Month)

Track whether each student has paid for the month — separate from lesson scheduling.

**Schema**:

```prisma
model Payment {
  id        String        @id @default(cuid())
  studentId String
  teacherId String
  month     Int           // 1-12
  year      Int
  amount    Int           // expected amount (lessonCount × lessonRate)
  paidAmount Int          @default(0) // what they actually paid
  status    PaymentStatus @default(UNPAID) // UNPAID, PARTIAL, PAID
  paidAt    DateTime?
  notes     String?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  student Student @relation(fields: [studentId], references: [id])
  teacher Teacher @relation(fields: [teacherId], references: [id])

  @@unique([studentId, month, year])
  @@index([teacherId, month, year])
}

enum PaymentStatus {
  UNPAID
  PARTIAL
  PAID
}
```

**tRPC procedures**:

- `payment.getForMonth({ month, year })` — all students' payment status for the month
- `payment.markPaid({ studentId, month, year, paidAmount })` — mark a student as paid
- `payment.getHistory({ studentId })` — payment history for a student
- `payment.getUnpaid({ month?, year? })` — list of students who haven't paid

**UI**:

- Payment status column in students table (paid / unpaid / partial — color-coded)
- Monthly payment overview page — see all students at a glance
- "Mark as Paid" button per student
- Payment history in student profile
- Dashboard card: "X students unpaid this month"

**Why**: Teachers need to know who owes them money without digging through lessons manually.

---

### Real Dashboard with Live Data

Replace static `data.json` with actual queries:

- **Section Cards**: Total students, lessons this month, attendance rate, revenue
- **Area Chart**: Lessons per month trend (last 6-12 months)
- **Recent Activity**: Latest lessons, reports, new students
- **Attendance Breakdown**: Present vs Absent vs Makeup pie/donut chart

---

### Advanced Analytics Page

New page: `/reports` or `/analytics`

- Attendance rate per student (% present)
- Student progress over time
- Most taught pieces
- Busiest days of the week
- Monthly lesson count trends
- Export data to CSV

---

## Phase 2 — Important (Weeks 3-4)

### Notifications & Reminders

- Upcoming lesson reminders (in-app + optional email)
- Absence alerts
- Report generation reminders
- New page at `/notifications` already has a route — just needs implementation

**Stack choice**:

- In-app: Zustand store + database table for notification records
- Email: Resend or SendGrid integration

---

### Student Progress Tracking

Enhance student profiles with:

- Piece progression timeline (started → in progress → completed)
- Skill level tracking per piece
- Notes history per lesson
- Performance ratings (1-5 stars per lesson)
- Visual progress chart

---

### Invoicing / Billing

- Generate invoices per student per month
- Track payment status (pending, sent, paid, overdue)
- Invoice PDF generation
- Payment history

**Schema**:

```prisma
model Invoice {
  id        String   @id @default(cuid())
  studentId String
  teacherId String
  month     Int
  year      Int
  amount    Int      // in smallest currency unit
  status    String   @default("pending") // pending, sent, paid, overdue
  dueDate   DateTime
  paidAt    DateTime?
  notes     String?
  createdAt DateTime @default(now())
  student   Student  @relation(fields: [studentId], references: [id])
  teacher   Teacher  @relation(fields: [teacherId], references: [id])
}
```

---

### Bulk Operations

- CSV import for students
- Batch attendance marking (mark multiple lessons at once)
- Bulk schedule creation (e.g., recurring weekly lessons)
- Bulk delete/archive students

---

## Phase 3 — Enhancements (Month 2+)

### Recurring Lessons

- Set up weekly/biweekly recurring schedules per student
- Auto-generate lessons for upcoming weeks
- Manage exceptions (skip holidays, reschedule)

**Schema addition**:

```prisma
model RecurringSchedule {
  id        String   @id @default(cuid())
  studentId String
  teacherId String
  dayOfWeek Int      // 0-6 (Sunday-Saturday)
  time      String   // "14:00"
  duration  Int      // minutes
  startDate DateTime
  endDate   DateTime?
  active    Boolean  @default(true)
}
```

---

### Google Calendar Sync

- Two-way sync with teacher's Google Calendar
- Auto-create Google Calendar events when scheduling lessons
- Import events from Google Calendar
- Uses Google Calendar API

---

### Student/Parent Portal

Students (or parents) can log in with their own credentials and see their info — read only, no editing.

**What they can see**:

- Upcoming and past lessons
- Attendance history (present/absent/makeup)
- Monthly reports from the teacher
- Assigned music pieces and progress
- Payment status (paid/unpaid per month)
- Their profile info

**Implementation**:

- Add `role` field to User model: `TEACHER` | `STUDENT`
- Add `userId` field to Student model (optional — links student to a login)
- New route group: `(student)/` with its own layout and limited nav
- Teacher sends invite link → student creates account → linked to Student record
- Middleware checks role and redirects accordingly

**Schema change**:

```prisma
model User {
  // ... existing fields
  role    String @default("TEACHER") // TEACHER | STUDENT
}

model Student {
  // ... existing fields
  userId  String? @unique // optional link to User account
  user    User?   @relation(fields: [userId], references: [id])
}
```

**Student pages**:

- `/student/dashboard` — overview of upcoming lessons
- `/student/lessons` — lesson history with attendance
- `/student/pieces` — assigned pieces
- `/student/reports` — monthly reports from teacher
- `/student/profile` — their own profile (read only)

---

### Mobile App (PWA or React Native)

**PWA approach** (easier):

- Add `manifest.json` and service worker
- Offline access to schedule
- Push notifications for reminders
- Already responsive — just needs PWA setup

**React Native approach** (better UX):

- Share tRPC API layer
- Native calendar integration
- Push notifications via Expo

---

### Multi-Language Support (i18n)

- Use `next-intl` or `next-i18next`
- Support English + other languages
- Locale-aware date/currency formatting

---

### Dark Mode Improvements

- Already have next-themes set up
- Audit all components for proper dark mode colors
- Add theme-aware charts
- Ensure print styles work in dark mode

---

## Phase 4 — Nice to Have

### Student Groups / Classes

- Group students for group lessons
- Shared schedule for group
- Per-group reporting

### Practice Logging

- Students log their practice time
- Teacher sees practice reports
- Practice streak tracking

### Image & File Uploads

Add image support for students, teachers, and pieces + file attachments for lessons.

**What to add**:

- **Student avatar**: Upload photo for each student (shows in tables, profile, reports)
- **Teacher profile image**: Upload teacher photo (shows in sidebar, profile)
- **Piece image/thumbnail**: Cover image or sheet music preview for each piece
- **Lesson attachments**: Attach sheet music PDFs, recordings, notes to lessons

**Storage**: All uploads go to **Cloudinary**.

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

- Use `next-cloudinary` `CldUploadWidget` for client-side uploads (no server needed for the upload itself)
- Cloudinary returns a URL after upload → save URL to database
- Organize uploads into folders: `my-piano-diary/students/`, `my-piano-diary/teachers/`, `my-piano-diary/pieces/`, `my-piano-diary/lessons/`
- Use Cloudinary transformations for thumbnails (auto resize, crop, format)

**Database fields** (existing fields just need upload UI):

- `Student.avatar` — already exists, save Cloudinary URL here
- `User.image` — already exists, save Cloudinary URL here
- Add `Piece.imageUrl` — new field for piece cover image/sheet music preview

For lesson attachments, create a new model:

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

**tRPC procedures**:

- `upload.deleteFile({ publicId })` — delete file from Cloudinary (server-side, uses API secret)
- Cloudinary upload is handled client-side via `CldUploadWidget`, no tRPC needed for the upload itself

**UI components**:

- `ImageUpload` — reusable component wrapping `CldUploadWidget`, shows preview + change/remove buttons
- Use in: student create/edit dialog (avatar), profile page (teacher image), piece create/edit dialog (cover image)
- `FileAttachment` — upload area in lesson detail for PDFs, audio, images
- All images in tables/cards use `CldImage` for optimized delivery with auto format/quality

### Advanced Piece Management

- Piece categories/tags
- Difficulty progression path
- Recommended pieces by level
- Piece completion tracking per student

### Two-Factor Authentication

- TOTP-based 2FA
- Recovery codes
- Optional per-teacher

### Audit Log

- Track all changes (who changed what, when)
- Useful for accountability and debugging

---

## Implementation Priority Matrix

| Feature               | Impact | Effort | Priority |
| --------------------- | ------ | ------ | -------- |
| Earnings Dashboard    | High   | Medium | **P1**   |
| Payment Tracking      | High   | Medium | **P1**   |
| Live Dashboard Data   | High   | Medium | **P1**   |
| Advanced Analytics    | High   | Medium | **P1**   |
| Image/File Uploads    | Medium | Medium | **P2**   |
| Notifications         | Medium | Medium | **P2**   |
| Student Progress      | Medium | Medium | **P2**   |
| Invoicing             | High   | High   | **P2**   |
| Bulk Operations       | Medium | Low    | **P2**   |
| Recurring Lessons     | High   | Medium | **P3**   |
| Google Calendar Sync  | Medium | High   | **P3**   |
| Student/Parent Portal | High   | High   | **P3**   |
| Mobile App (PWA)      | Medium | Low    | **P3**   |
| Multi-Language (i18n) | Low    | Medium | **P4**   |
| Student Groups        | Low    | Medium | **P4**   |
| Practice Logging      | Low    | Medium | **P4**   |
| 2FA                   | Low    | Medium | **P4**   |

---

## Adding a New Feature (Step-by-Step)

Quick reference for building any new feature:

1. **Schema** — Add model to `prisma/schema.prisma`, run `npx prisma migrate dev --name feature_name`
2. **Validation** — Create Zod schema in `src/lib/validations/feature.ts`
3. **Router** — Create tRPC router in `src/server/api/routers/feature.ts`
4. **Register** — Add router to `src/server/api/root.ts`
5. **Page** — Create `src/app/(root)/feature/page.tsx` (Server Component, fetch data)
6. **Components** — Create `src/app/(root)/feature/_components/` (Client Components)
7. **Navigation** — Add link to `src/app/(root)/_components/nav-main.tsx`
8. **Test** — Write tests for router + components
