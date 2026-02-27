# My Piano Diary - Current Project State

> A piano lesson management system for teachers to manage students, schedule lessons, track attendance, and generate reports.

**Version**: 0.1.0 | **Status**: ~60% Complete | **Last Updated**: February 27, 2026

---

## Tech Stack

| Layer         | Technology                            |
| ------------- | ------------------------------------- |
| Framework     | Next.js 15 (App Router), React 19     |
| Language      | TypeScript 5.8 (strict mode)          |
| API           | tRPC 11 (end-to-end type safety)      |
| Database      | PostgreSQL (Neon) via Prisma 6        |
| Auth          | NextAuth.js 5 (beta) - Email + Google |
| State         | Zustand 5, React Query 5              |
| UI            | Tailwind CSS 4, Shadcn/UI, Radix UI   |
| Forms         | React Hook Form + Zod validation      |
| Charts        | Recharts 2                            |
| Drag & Drop   | @dnd-kit                              |
| Calendar      | FullCalendar 6                        |
| Notifications | Sonner (toast)                        |
| Bundler       | Turbopack (dev)                       |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (providers, fonts, theme)
│   ├── page.tsx                  # Root redirect → /dashboard
│   ├── error.tsx                 # Global error boundary page
│   ├── not-found.tsx             # 404 page
│   ├── loading.tsx               # Global loading state
│   │
│   ├── (auth)/                   # Auth route group (public)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── _components/          # Login/register forms, Google OAuth button
│   │
│   ├── (root)/                   # Protected route group (requires auth)
│   │   ├── layout.tsx            # Sidebar layout
│   │   ├── _components/          # AppSidebar, NavMain, NavUser, SiteHeader
│   │   ├── dashboard/            # Analytics dashboard with charts
│   │   ├── students/             # Student CRUD + reports (/students/[id]/reports)
│   │   ├── calendar/             # Calendar view with drag-and-drop lessons
│   │   ├── lessons/              # Lesson management
│   │   ├── pieces/               # Music pieces management
│   │   ├── reports/              # Reports overview
│   │   ├── profile/              # User profile + teacher settings
│   │   ├── notifications/        # Notifications page
│   │   └── updates/              # Updates page
│   │
│   └── api/                      # API routes
│       ├── auth/                 # NextAuth route handlers
│       └── trpc/                 # tRPC HTTP handler
│
├── server/                       # Backend
│   ├── db.ts                     # Prisma client instance
│   ├── api/                      # tRPC routers (root.ts, trpc.ts, routers/)
│   ├── auth/                     # NextAuth config
│   ├── actions/                  # Server actions
│   ├── api-error-handler.ts      # API route error wrapper
│   ├── server-action-error-handler.ts
│   └── validation-middleware.ts
│
├── components/                   # Shared components
│   ├── ui/                       # 30+ Shadcn/UI components
│   ├── providers/                # Root providers (tRPC, theme, user store)
│   ├── error-boundary.tsx        # React error boundary
│   ├── dashboard-container.tsx   # Dashboard wrapper
│   └── lessons/                  # Lesson dialog components
│
├── lib/                          # Utilities
│   ├── utils.ts                  # Helper functions (cn, etc.)
│   ├── types.ts                  # Shared TypeScript types
│   ├── format.ts                 # Formatting utilities
│   ├── currency.ts               # Currency helpers
│   ├── error-handler.ts          # Error logging service
│   └── validations/              # Zod schemas (auth, student, lesson, etc.)
│
├── trpc/                         # tRPC client setup
│   ├── react.tsx                 # React hooks & provider
│   ├── server.ts                 # Server-side caller
│   └── query-client.ts           # React Query config
│
├── store/                        # Zustand stores
│   └── use-user-store.ts
│
├── hooks/                        # Custom hooks
│   ├── use-error-handler.ts
│   └── use-mobile.ts
│
├── config/app-config.ts          # App metadata
├── middleware.ts                  # Auth middleware (route protection)
├── env.js                        # Environment variable validation
└── styles/globals.css             # Tailwind directives + global styles
```

---

## Database Schema

**6 main models** + NextAuth models (Account, Session, VerificationToken):

```
User ──1:1──> Teacher ──1:many──> Student ──1:many──> Lesson
                │                    │                   │
                ├──1:many──> Piece ──┼─── linked to ─────┘
                │                    │
                │                    └──1:many──> MonthlyReport
                │
                └──1:many──> Lesson
```

| Model         | Key Fields                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------- |
| User          | id, name, email, password, image, createdAt                                                     |
| Teacher       | id, userId (unique), createdAt                                                                  |
| Student       | id, teacherId, name, avatar, notes, lessonRate, createdAt                                       |
| Lesson        | id, studentId, teacherId, date, duration, status (enum), actualMin, cancelReason, note, pieceId |
| Piece         | id, teacherId, title, description, level, difficulty, createdAt                                 |
| MonthlyReport | id, studentId, month, year, summary, comments, nextMonthPlan                                    |

**LessonStatus enum**: `PENDING` | `COMPLETE` | `CANCELLED` | `MAKEUP`

---

## API Routes (tRPC Procedures)

### Student Router

- `student.getAll` — All students for logged-in teacher
- `student.getByGuid({ id })` — Single student with details
- `student.create({ name, avatar?, notes? })` — Create student
- `student.update({ id, ...data })` — Update student
- `student.delete({ id })` — Delete student

### Lesson Router

- `lesson.getForMonth({ year, month })` — Lessons for a month with student info
- `lesson.create({ studentId, date, duration, pieceId? })` — Schedule lesson
- `lesson.update({ id, ...data })` — Update/reschedule lesson
- `lesson.delete({ id })` — Delete lesson
- `lesson.markAttendance({ lessonId, status, actualMin, reason?, note? })` — Mark attendance

### Report Router

- `report.getStudentReport({ studentId, month, year })` — Monthly report data
- `report.upsertReport({ studentId, month, year, summary?, comments?, nextMonthPlan? })` — Create/update report

### User Router

- `user.updateProfile({ name, email })` — Update profile
- `user.changePassword({ currentPassword, newPassword })` — Change password
- `user.updateTeacherSettings({ hourlyRate })` — Update teacher settings

### Piece Router

- `piece.getAll` — All music pieces
- `piece.create / update / delete` — CRUD operations

---

## Implemented Features

### Authentication & Authorization ✅

- Email/password registration and login
- Google OAuth integration
- Session management with NextAuth
- Protected routes via middleware
- Auto teacher profile creation on signup

### Student Management ✅

- Full CRUD with data table (pagination, sorting, filtering)
- Student profiles with lesson history
- Search and bulk operations

### Lesson Scheduling ✅

- Schedule/update/cancel lessons
- Drag-and-drop rescheduling on calendar
- Link lessons to music pieces
- Filter by month/year

### Attendance Tracking ✅

- Three statuses: Present, Absent, Makeup
- Actual duration recording
- Absence reason + notes
- Color-coded visual indicators

### Calendar View ✅

- Interactive monthly calendar grid
- Drag-and-drop rescheduling (@dnd-kit)
- Quick lesson creation from date cells
- Color-coded lessons by attendance status

### Monthly Reports ✅

- Three editable sections (Summary, Comments, Next Month Plan)
- Attendance grid with weekly breakdown
- Session count stats
- Print-to-PDF
- Month/year navigation
- Auto-save

### Music Pieces ✅

- Full CRUD with search/filter
- Difficulty rating
- Teacher-scoped

### Profile Management ✅

- Edit user profile
- Change password with validation
- Teacher settings (lesson rate)

### Dashboard (Partial ~40%)

- Analytics overview page
- Interactive area chart
- Section cards with metrics
- Uses some hardcoded data

### Error Handling ✅

- React Error Boundary component
- Global error pages (error.tsx at root, auth, and root groups)
- 404 not-found page
- API error handler with typed errors (ValidationError, NotFoundError, etc.)
- Server action error handler (tryCatch wrapper)
- Client-side useErrorHandler and useAsyncError hooks
- Centralized error logging service

### UI/UX ✅

- Responsive Sidebar navigation
- Dark/light theme (next-themes)
- Toast notifications (Sonner)
- Form validation with error messages
- 30+ Shadcn/UI components
- Loading states

---

## Quick Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm start            # Start production server
npm run db:generate  # Run Prisma migrations (dev)
npm run db:migrate   # Deploy migrations (prod)
npm run db:studio    # Open Prisma Studio
npm run lint         # Run ESLint
npm run lint:fix     # Fix lint issues
npm run format:write # Format with Prettier
npm run typecheck    # TypeScript check
```

---

## Key Code Patterns

### tRPC Protected Procedure

All API calls go through `protectedProcedure` which checks for a valid session. Teacher data is scoped by `ctx.session.user.id`.

### Server Components + Client Components

Pages use Server Components for initial data fetch (`await api.xxx()`), then pass data to Client Components for interactivity.

### Form Pattern

React Hook Form + Zod resolver → tRPC mutation → toast on success/error → invalidate query cache.

### Data Table Pattern

TanStack React Table with column definitions, sorting, filtering, and pagination. Used in Students and Pieces pages.
