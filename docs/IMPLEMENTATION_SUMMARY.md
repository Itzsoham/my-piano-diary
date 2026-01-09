# Attendance and Report Features Implementation

## Overview

Successfully implemented attendance tracking and monthly report features in `my-piano-diary` based on the structure from `piano-diary`.

## Database Changes

### Schema Updates (`prisma/schema.prisma`)

Added two new models:

1. **Attendance Model**
   - Tracks lesson attendance status (PRESENT, ABSENT, MAKEUP)
   - Records actual duration, reason for absence, and notes
   - One-to-one relationship with Lesson

2. **MonthlyReport Model**
   - Stores monthly summaries for each student
   - Fields: summary, comments, nextMonthPlan
   - Unique constraint on (studentId, month, year)

## Backend Implementation

### tRPC Routers

1. **Lesson Router** (`src/server/api/routers/lesson.ts`)
   - `getForMonth`: Fetch lessons for a specific month
   - `create`: Create new lesson
   - `update`: Update lesson details (including rescheduling)
   - `delete`: Delete lesson
   - `markAttendance`: Mark or update attendance for a lesson

2. **Report Router** (`src/server/api/routers/report.ts`)
   - `getStudentReport`: Get student report data for a specific month
   - `upsertReport`: Create or update monthly report

## Frontend Implementation

### Calendar Feature (`/calendar`)

**Page**: `src/app/(root)/calendar/page.tsx`

- Main calendar page with lesson management
- Fetches lessons and students using tRPC
- Manages dialog states for lesson creation and attendance marking

**Components**:

1. **CalendarView** (`_components/calendar-view.tsx`)
   - Monthly calendar grid with drag-and-drop support
   - Visual indicators for attendance status (Present, Absent, Makeup)
   - Drag lessons to reschedule them
   - Color-coded lesson cards based on attendance status

2. **LessonDialog** (`_components/lesson-dialog.tsx`)
   - Form to schedule new lessons
   - Fields: student, date, time, duration
   - Validates input and creates lesson via tRPC

3. **AttendanceDialog** (`_components/attendance-dialog.tsx`)
   - Mark attendance for lessons
   - Status selection (Present, Absent, Makeup)
   - Conditional fields based on status
   - Records actual duration and notes

### Monthly Reports Feature (`/students/[id]/reports`)

**Page**: `src/app/(root)/students/[id]/reports/page.tsx`

- Server component that passes data to client component
- Handles month/year query parameters

**Component**: **ReportView** (`_components/report-view.tsx`)

- Editable monthly report with three sections:
  1. Monthly Summary
  2. Comments
  3. Next Month Plan
- Attendance table showing lessons by week
- Visual indicators for absent (yellow) and makeup (blue) lessons
- Total session count
- Print functionality for generating PDF reports
- Month/year navigation

### Navigation Updates

**Students Table** (`src/app/(root)/students/_components/students-table.tsx`)

- Added "View Reports" menu item in student actions dropdown
- Links to `/students/[id]/reports` for each student

## Features

### Calendar View

✅ Monthly calendar grid
✅ Drag-and-drop lesson rescheduling
✅ Visual attendance status indicators
✅ Quick lesson creation
✅ Attendance marking dialog
✅ Color-coded lessons (scheduled vs. attended)

### Attendance Tracking

✅ Three status types: Present, Absent, Makeup
✅ Actual duration tracking
✅ Reason for absence
✅ Additional notes
✅ Visual indicators on calendar

### Monthly Reports

✅ Editable text sections (summary, comments, plan)
✅ Attendance grid by week
✅ Session count calculation
✅ Print-friendly layout
✅ Month/year navigation
✅ Auto-save functionality

## Navigation Flow

1. **Calendar**: Sidebar → Calendar
2. **Reports**: Students → Actions Menu → View Reports

## Technical Stack

- **Backend**: tRPC with Prisma ORM
- **Frontend**: Next.js 15, React 19
- **UI**: Radix UI components with Tailwind CSS
- **Drag & Drop**: @dnd-kit/core
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns

## Database Migration

Run the following to apply schema changes:

```bash
npx prisma migrate dev --name add_attendance_and_reports
npx prisma generate
```

## Notes

- The Prisma schema lint warning about `url` property is a known issue with Prisma 7 migration and doesn't affect functionality
- AttendanceStatus enum is defined inline in components to avoid import issues
- Reports are designed to be print-friendly with proper styling for PDF generation
