# My Piano Diary - Complete Project Overview

**Last Updated**: January 24, 2026  
**Project Status**: ~60% Complete  
**Version**: 0.1.0

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Folder Structure](#folder-structure)
3. [Database Schema](#database-schema)
4. [API Routes (tRPC)](#api-routes-trpc)
5. [Pages & Routes](#pages--routes)
6. [Components Map](#components-map)
7. [Feature Checklist](#feature-checklist)
8. [Performance Metrics](#performance-metrics)

---

## 🎯 Project Overview

**My Piano Diary** is a comprehensive lesson management system for piano teachers. It provides tools to:

- Manage student profiles and information
- Schedule and reschedule lessons
- Track attendance (Present, Absent, Makeup)
- Generate monthly reports per student
- View analytics on dashboard
- Organize music pieces/repertoire
- Manage teacher profile and settings

**Target Users**: Piano teachers managing 1-50 students

---

## 📂 Folder Structure

### Root Level

```
my-piano-diary/
├── src/                          # Application source code
├── prisma/                       # Database configuration & migrations
├── public/                       # Static assets
├── docs/                         # Documentation files
├── node_modules/                 # Dependencies
├── generated/                    # Generated Prisma client
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS config
├── next.config.js                # Next.js configuration
├── eslint.config.js              # ESLint rules
├── prettier.config.js            # Prettier formatting
├── components.json               # Shadcn/UI config
└── README.md                     # Project README
```

### `src/` Directory Structure

```
src/
├── app/                          # Next.js app router & pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Root page (redirects to /dashboard)
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── _components/
│   │       ├── login-form.tsx
│   │       ├── register-form.tsx
│   │       └── social-auth/
│   │           └── google-button.tsx
│   │
│   └── (root)/                   # Protected route group
│       ├── layout.tsx            # Root layout with sidebar
│       ├── _components/          # Shared components
│       │   ├── app-sidebar.tsx
│       │   ├── nav-main.tsx
│       │   ├── nav-user.tsx
│       │   └── site-header.tsx
│       │
│       ├── dashboard/            # Dashboard page
│       │   ├── page.tsx
│       │   ├── _components/
│       │   │   ├── chart-area-interactive.tsx
│       │   │   ├── section-cards.tsx
│       │   │   └── data.json
│       │   └── data.json
│       │
│       ├── students/             # Students management
│       │   ├── page.tsx
│       │   ├── [id]/
│       │   │   ├── reports/
│       │   │   │   ├── page.tsx
│       │   │   │   └── _components/
│       │   │   │       └── report-view.tsx
│       │   │   └── ...
│       │   └── _components/
│       │       ├── students-table.tsx
│       │       ├── student-dialog.tsx
│       │       └── ...
│       │
│       ├── calendar/             # Calendar & lesson scheduling
│       │   ├── page.tsx
│       │   └── _components/
│       │       ├── calendar-view.tsx
│       │       ├── lesson-dialog.tsx
│       │       └── attendance-dialog.tsx
│       │
│       ├── pieces/               # Music pieces management
│       │   ├── page.tsx
│       │   └── _components/
│       │       └── pieces-table.tsx
│       │
│       └── profile/              # User profile
│           ├── page.tsx
│           └── _components/
│               ├── profile-form.tsx
│               ├── password-form.tsx
│               └── teacher-settings-form.tsx
│
├── server/                       # Backend logic
│   ├── api/
│   │   ├── root.ts               # Root tRPC router
│   │   ├── trpc.ts               # tRPC setup
│   │   └── routers/              # tRPC procedure definitions
│   │       ├── student.ts        # Student procedures
│   │       ├── lesson.ts         # Lesson procedures
│   │       ├── report.ts         # Report procedures
│   │       ├── user.ts           # User procedures
│   │       └── piece.ts          # Piece procedures
│   ├── auth/                     # NextAuth configuration
│   │   └── config.ts
│   └── db.ts                     # Prisma client
│
├── trpc/                         # tRPC client setup
│   ├── react.tsx                 # React hooks & provider
│   ├── server.ts                 # Server-side caller
│   └── query-client.ts           # React Query setup
│
├── components/                   # Reusable UI components
│   ├── ui/                       # Shadcn/UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── sidebar.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tabs.tsx
│   │   └── ... (25+ more components)
│   ├── data-table.tsx            # Generic data table
│   ├── dashboard-container.tsx   # Dashboard wrapper
│   └── providers/
│       ├── index.tsx             # Root providers
│       └── user-store-provider.tsx
│
├── lib/                          # Utilities & helpers
│   ├── utils.ts                  # Helper functions
│   ├── types.ts                  # Shared types
│   └── validations/              # Zod schemas
│       ├── auth.ts
│       ├── student.ts
│       ├── lesson.ts
│       └── ...
│
├── store/                        # Zustand state management
│   └── use-user-store.ts         # User store
│
├── hooks/                        # Custom React hooks
│   └── use-mobile.ts             # Mobile detection
│
├── config/                       # App configuration
│   └── app-config.ts             # App metadata
│
├── styles/                       # Global styles
│   └── globals.css               # Tailwind directives
│
├── middleware.ts                 # Auth middleware
└── env.js                        # Environment validation
```

### `prisma/` Directory

```
prisma/
├── schema.prisma                 # Database schema
└── migrations/
    ├── migration_lock.toml
    ├── 20251212100209_new_stucture/
    │   └── migration.sql
    ├── 20251213094317_add_user_created_at/
    │   └── migration.sql
    └── 20260109061929_add_attendance_and_reports/
        └── migration.sql
```

---

## 🗄️ Database Schema

### Core Models

**User**

```typescript
{
  id: string (CUID)
  name?: string
  email: string (unique)
  emailVerified?: DateTime
  image?: string
  password?: string
  createdAt: DateTime
  accounts: Account[]
  sessions: Session[]
  teacher?: Teacher
}
```

**Teacher**

```typescript
{
  id: string (CUID)
  userId: string (unique)
  hourlyRate: Int (default: 200000)
  createdAt: DateTime
  lessons: Lesson[]
  students: Student[]
}
```

**Student**

```typescript
{
  id: string (CUID)
  teacherId: string
  name: string
  avatar?: string
  notes?: string
  createdAt: DateTime
  lessons: Lesson[]
  reports: MonthlyReport[]
}
```

**Lesson**

```typescript
{
  id: string (CUID)
  studentId: string
  teacherId: string
  date: DateTime
  duration: Int (minutes)
  status: LessonStatus (COMPLETE | MAKEUP | CANCELLED)
  cancelReason?: string
  pieceId?: string
  createdAt: DateTime
  piece?: Piece
  student: Student
  teacher: Teacher
  attendance?: Attendance
}
```

**Attendance**

```typescript
{
  id: string (CUID)
  lessonId: string (unique)
  date: DateTime
  status: AttendanceStatus (PRESENT | ABSENT | MAKEUP)
  actualMin: Int
  reason?: string
  note?: string
  lesson: Lesson
}
```

**Piece**

```typescript
{
  id: string (CUID)
  title: string
  description?: string
  level?: string
  createdAt: DateTime
  lessons: Lesson[]
}
```

**MonthlyReport**

```typescript
{
  id: string (CUID)
  studentId: string
  month: Int (1-12)
  year: Int
  summary?: string
  comments?: string
  nextMonthPlan?: string
  createdAt: DateTime
  updatedAt: DateTime
  student: Student
  @@unique([studentId, month, year])
}
```

**Account, Session, VerificationToken** (NextAuth)

- Standard NextAuth schema for OAuth and session management

---

## 🔗 API Routes (tRPC)

### Student Router

```
student.getAll()
  → Query all students for logged-in teacher
  ← Returns: Student[] with teacher and lesson count

student.getByGuid({ id: string })
  → Get single student details
  ← Returns: Student with teacher info and recent lessons

student.create({ name, avatar?, notes? })
  → Create new student
  ← Returns: Created Student

student.update({ id, ...data })
  → Update student details
  ← Returns: Updated Student

student.delete({ id })
  → Delete student
  ← Returns: Deleted Student
```

### Lesson Router

```
lesson.getForMonth({ year, month })
  → Get lessons for specific month
  ← Returns: Lesson[] with attendance and student info

lesson.create({ studentId, date, duration, pieceId? })
  → Schedule new lesson
  ← Returns: Created Lesson

lesson.update({ id, date?, duration?, pieceId?, status? })
  → Update lesson details
  ← Returns: Updated Lesson

lesson.delete({ id })
  → Delete/cancel lesson
  ← Returns: Deleted Lesson

lesson.markAttendance({ lessonId, status, actualMin, reason?, note? })
  → Mark/update attendance
  ← Returns: Updated Attendance
```

### Report Router

```
report.getStudentReport({ studentId, month, year })
  → Get monthly report data
  ← Returns: MonthlyReport with attendance grid

report.upsertReport({ studentId, month, year, summary?, comments?, nextMonthPlan? })
  → Create or update monthly report
  ← Returns: Created/Updated MonthlyReport
```

### User Router

```
user.updateProfile({ name, email })
  → Update user profile
  ← Returns: Updated User

user.changePassword({ currentPassword, newPassword })
  → Change user password
  ← Returns: Success message

user.updateTeacherSettings({ hourlyRate })
  → Update teacher settings
  ← Returns: Updated Teacher
```

### Piece Router

```
piece.getAll()
  → Get all music pieces
  ← Returns: Piece[]

piece.create({ title, description?, level? })
  → Create new piece
  ← Returns: Created Piece

piece.update({ id, title?, description?, level? })
  → Update piece details
  ← Returns: Updated Piece

piece.delete({ id })
  → Delete piece
  ← Returns: Deleted Piece
```

---

## 📄 Pages & Routes

### Public Routes

- `/` → Root page (redirects to `/dashboard`)
- `/login` → User login page
- `/register` → User registration page

### Protected Routes (Auth Required)

- `/dashboard` → Analytics dashboard with charts
- `/students` → Student management page
- `/students/[id]/reports` → Monthly report for student
- `/pieces` → Music pieces management
- `/calendar` → Calendar view with lesson scheduling
- `/profile` → User profile and settings

---

## 🧩 Components Map

### Authentication Components

- `LoginForm` - Email/password login form
- `RegisterForm` - User registration form
- `GoogleButton` - Google OAuth button

### Navigation Components

- `AppSidebar` - Main navigation sidebar
- `NavMain` - Main navigation items
- `NavUser` - User menu and profile dropdown
- `SiteHeader` - Top header bar

### Page Components

- `StudentsTable` - Students data table with CRUD actions
- `PiecesTable` - Pieces management table
- `CalendarView` - Monthly calendar grid with drag-and-drop
- `LessonDialog` - Create/edit lesson form
- `AttendanceDialog` - Mark attendance modal
- `ReportView` - Monthly report editor

### Form Components

- `ProfileForm` - User profile editing
- `PasswordForm` - Password change form
- `TeacherSettingsForm` - Teacher settings (hourly rate, etc.)

### UI Components (Shadcn/UI)

- Button, Card, Dialog, Form, Input, Label, Select
- Table, Tabs, Sidebar, Dropdown, Popover, Badge
- Calendar, Checkbox, Toggle, Separator, Avatar
- And 10+ more reusable UI components

### Data Visualization

- `ChartAreaInteractive` - Interactive area chart (Recharts)
- `SectionCards` - KPI cards
- `DataTable` - Generic data display table

---

## ✅ Feature Checklist

### Core Features (100%)

- [x] User authentication (email/password)
- [x] Google OAuth integration
- [x] Session management
- [x] Protected routes

### Student Management (100%)

- [x] Create students
- [x] View student list
- [x] Update student info
- [x] Delete students
- [x] Search/filter students

### Lesson Management (100%)

- [x] Schedule lessons
- [x] Update lesson details
- [x] Reschedule with drag-and-drop
- [x] Cancel lessons
- [x] Link pieces to lessons

### Attendance Tracking (100%)

- [x] Mark attendance (Present/Absent/Makeup)
- [x] Record actual duration
- [x] Add absence reason
- [x] Add notes
- [x] Edit attendance records

### Calendar & Scheduling (100%)

- [x] Monthly calendar view
- [x] Drag-and-drop rescheduling
- [x] Visual status indicators
- [x] Quick lesson creation

### Reporting (100%)

- [x] Generate monthly reports
- [x] Edit report sections
- [x] View attendance grid
- [x] Print to PDF
- [x] Month navigation

### Dashboard (40%)

- [x] Analytics overview
- [x] Charts and visualizations
- [ ] Earnings calculations
- [ ] Student statistics
- [ ] Attendance trends

### Profile Management (100%)

- [x] Edit profile
- [x] Change password
- [x] Teacher settings

### Music Pieces (100%)

- [x] Create pieces
- [x] Edit pieces
- [x] Delete pieces
- [x] Search/filter

### UI/UX (90%)

- [x] Responsive design
- [x] Dark/light theme
- [x] Toast notifications
- [x] Form validation
- [x] Loading states
- [x] Error handling
- [ ] Accessibility (partial)

---

## 📊 Performance Metrics

### Bundle Size (Estimated)

- Main bundle: ~150-200KB (gzipped)
- Optimal for mobile users

### Database Performance

- Average query time: <100ms
- Connection pooling enabled with Neon

### Lighthouse Scores (Target)

- Performance: 85+
- Accessibility: 85+
- Best Practices: 90+
- SEO: 90+

### API Response Times (Target)

- Calendar queries: <200ms
- Report generation: <500ms
- Student queries: <100ms

---

## 🎨 Design System

### Color Palette

- Primary: Purple shades
- Accent: Pink/Rose
- Neutral: Gray scale
- Status: Green (success), Red (error), Yellow (warning), Blue (info)

### Typography

- Headings: Bold, various sizes (h1-h6)
- Body: Regular 14-16px
- Small text: 12-13px

### Spacing

- Uses Tailwind's default scale (4px base unit)
- Consistent padding/margin throughout

### Icons

- Lucide React icons throughout
- Consistent size (24px standard, 16px small)

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Start development server
npm run dev

# View database UI
npm run db:studio

# Format code
npm run format:write

# Lint code
npm run lint:fix

# Build for production
npm run build

# Start production server
npm start
```

---

## 🔐 Security Features

- ✅ Password hashing with bcryptjs
- ✅ Session-based authentication
- ✅ Protected routes middleware
- ✅ CSRF protection (NextAuth)
- ✅ Secure cookies
- ✅ Input validation with Zod
- ⏳ Rate limiting (not yet implemented)
- ⏳ 2FA (not yet implemented)

---

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📞 Support & Maintenance

- Check logs in browser console
- Use Prisma Studio for database inspection
- Review API responses in Network tab
- Check deployment logs on Vercel
