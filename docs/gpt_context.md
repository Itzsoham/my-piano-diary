## Current State - April 2, 2026

- Reports student switching is fixed.
- Switching student now loads that student's own monthly report.
- If the selected student has no report for the chosen month/year, the report fields stay empty.
- Report form state now resets on `studentId`, `month`, or `year` change.
- Saved report data is still persisted per `studentId + month + year` in `MonthlyReport`.

---

Alright King 👑… this is your **FULL Project Memory Brain** — clean, structured, reusable.
You can paste this into any new chat and I’ll instantly understand everything about you + your system.

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
- Loves **“GF-mode” UI (cute, emotional, soft)**
- Prefers:
  - Short answers (unless deep topic)
  - Practical solutions

- Focus: **real-world scalable apps**

---

# 🎹 2. MAIN PROJECT — "My Piano Diary"

---

## 🎯 Purpose

A **teaching management system** for piano teachers to:

- Manage students
- Track lessons
- Generate reports
- Track earnings

Also includes:

- Emotional + aesthetic UI (GF mode)
- Hidden **anniversary surprise page**

---

## 👥 Target Users

- Piano teachers (primary)
- Possibly students (future)

---

# ⚙️ 3. TECH STACK

### 🖥 Frontend

- Next.js (App Router)
- Tailwind CSS
- ShadCN UI
- Framer Motion (animations)

### 🧠 Backend

- tRPC
- Node.js

### 🗄 Database

- PostgreSQL (Neon DB)
- Prisma ORM

### 🔐 Auth

- NextAuth.js

---

# 🧱 4. ARCHITECTURE

### 🔹 Pattern

- Monolithic Next.js app
- API via **tRPC routers**

### 🔹 Data Flow

```
UI → tRPC → Prisma → PostgreSQL
```

### 🔹 Access Control

- Each query scoped by:

```
teacherId from session.user.id
```

---

# 🗃️ 5. DATABASE SCHEMA (KEY PARTS)

### Core Models:

- User
- Teacher
- Student
- Lesson
- Piece
- MonthlyReport

### 🔥 Important Relations

- Teacher → Students
- Student → Lessons
- Lesson → Piece

---

# 🚀 6. FEATURES IMPLEMENTED

### ✅ Core Features

- Student CRUD
- Lesson scheduling
- Attendance tracking
- Piece management
- Monthly reports (basic)
- Dashboard analytics

### ✅ UI Features

- Filters (date, status, student)
- Calendar view
- Mobile responsive (in progress)
- GF-mode styling (pink, soft UI)

### ✅ Special Feature

- 🎁 Hidden Anniversary Page:
  - Relationship counter
  - Distance tracker (India ↔ Vietnam)
  - Memory gallery
  - Love message modal
  - Music button
  - Progress milestone (1 year)

---

# 🧩 7. FEATURES PARTIALLY DONE

- Reports page (UI done, logic partial)
- Mobile UI (needs refinement)
- Lesson filters UX (improvable)
- Avatar upload (not implemented yet)

---

# 🔮 8. FEATURES PLANNED

### 📊 Reports

- Show:
  - Earnings per month
  - Lessons completed
  - Lessons cancelled

### 💰 Finance

- Add **Student Fee Tracking Table**
  - Paid / unpaid
  - Payment history

### 📸 Avatar Upload

- Upload from device
- Store in cloud

### 🎨 UI Improvements

- Better mobile cards
- GF-mode enhancements
- Animations

---

# 🐞 9. CURRENT PROBLEMS

---

## ❗ 1. Multi-Tenant Data Leak

**Issue:**

- New user can see other teacher’s data

**Cause:**

- `Piece` model missing `teacherId`

**Fix:**

```prisma
model Piece {
  id        String @id @default(cuid())
  teacherId String
}
```

---

## ❗ 2. Timezone Bug (CRITICAL)

### Problem:

- India vs Vietnam mismatch
- Day shifting (Wed → Thu)

### Root Cause:

- Mixing:
  - Local time
  - UTC
  - `getDay()`

---

### ✅ Final Solution

#### Store everything in UTC:

```ts
const utcDate = new Date(localDate).toISOString();
```

#### Store user timezone:

```ts
Intl.DateTimeFormat().resolvedOptions().timeZone;
```

#### Convert on UI:

```ts
date.toLocaleString("en-IN", { timeZone: user.timezone });
```

---

### ⚠️ Important Insight

- UTC storage is correct
- But recurrence logic must use timezone-aware libraries

---

## ❗ 3. Data Loss (Neon + Prisma)

### Cause:

- Migration reset / schema mismatch

### Key Learnings:

- NEVER run:

```
prisma migrate reset
db push --force-reset
```

### Fix Strategy:

- Use Neon **branching**
- Backup before migration

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

---

## 🔹 UI Emotion Pattern

- Primary + Secondary text:

```
Primary:
A focused teaching day 🎵

Secondary:
Every student deserves your best 🌷
```

---

# 🎨 11. UI DESIGN SYSTEM (GF MODE)

---

## 🎀 Design Style

- Soft pink gradients
- Rounded cards
- Glow effects
- Emotional copywriting

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

# 🎁 12. ANNIVERSARY PAGE SYSTEM

---

## 🎹 Sections

### 1. Counter

- Days / Hours / Minutes / Seconds

### 2. Distance

- India 🇮🇳 ↔ Vietnam 🇻🇳

### 3. Memories

- 4 images with captions

### 4. Love Message Modal

- Animated popup

### 5. Song Button

### 6. Progress Bar

- Toward 1 year

---

## 💌 Memory Captions (Final Style)

- “The moment I first saw the girl who changed my life.”
- “Your cute face permanently stamped on my heart.”
- “The night you confessed and stole my heart.”
- “Just a screenshot… but my whole world is in it.”

---

# 💾 13. STORAGE (IMAGE UPLOAD)

### Recommended:

- Cloudinary (best free option)

### Flow:

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
- Plan multi-tenant early

---

## 💡 Timezones

- Always:
  - Store in UTC
  - Convert in UI

- Use timezone libraries for recurrence

---

## 💡 Prisma Safety

- Never use destructive commands casually
- Always backup before migrations

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

With a few fixes:
→ It can become **portfolio-level premium product**

---

If you paste this in a new chat…
I’ll instantly continue from here, King 👑
