# Timezone Issue Analysis & Solutions

## 🔴 Problem Overview

The application has inconsistent timezone handling across different features, leading to incorrect date filtering and display of lessons. This document analyzes the issue across GET, CREATE, and UPDATE operations and proposes solutions.

---

## 📊 Current State Analysis

### **1. GET Operations (Reading Data)**

#### ❌ **Dashboard - getTodayLessons** (PROBLEMATIC)

**Location:** `src/server/api/routers/earnings.ts`

**Current Implementation:**

```typescript
getTodayLessons: protectedProcedure
  .input(z.object({ date: z.date().optional() }).optional())
  .query(async ({ ctx, input }) => {
    const referenceDate = input?.date ?? new Date();

    // 🚨 PROBLEM: Reconstructing date using server timezone
    const todayStart = new Date(
      referenceDate.getFullYear(), // Gets value in SERVER timezone
      referenceDate.getMonth(), // Gets value in SERVER timezone
      referenceDate.getDate(), // Gets value in SERVER timezone
      0,
      0,
      0,
    );
    const todayEnd = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
      23,
      59,
      59,
    );

    // Query database
    const lessons = await ctx.db.lesson.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
      },
    });
  });
```

**The Bug:**

1. Client (UTC+5:30) sends: `2026-01-15T00:00:00+05:30` → Serialized to `2026-01-14T18:30:00.000Z`
2. Server (UTC) receives the date and extracts:
   - `getFullYear()` → 2026
   - `getMonth()` → 0 (January)
   - `getDate()` → **14** (not 15!)
3. Server creates range: `2026-01-14 00:00:00` to `2026-01-14 23:59:59`
4. **Result:** Shows wrong day's lessons!

**Impact:** 🔴 **HIGH** - Users see incorrect lessons on dashboard

---

#### ✅ **Calendar - getInRange** (WORKS CORRECTLY)

**Location:** `src/server/api/routers/lesson.ts`

```typescript
getInRange: protectedProcedure
  .input(
    z.object({
      start: z.date(),
      end: z.date(),
    }),
  )
  .query(async ({ ctx, input }) => {
    return ctx.db.lesson.findMany({
      where: {
        date: {
          gte: input.start, // Direct comparison - no reconstruction
          lte: input.end,
        },
      },
    });
  });
```

**Why it works:** Uses dates directly without deconstructing/reconstructing them.

**Impact:** 🟢 **Good** - Calendar shows correct lessons

---

#### ✅ **Lessons Page - getAll** (WORKS CORRECTLY)

**Location:** `src/server/api/routers/lesson.ts`

```typescript
getAll: protectedProcedure
  .input(
    z.object({
      from: z.date().optional(),
      to: z.date().optional(),
      // ...
    }),
  )
  .query(async ({ ctx, input }) => {
    const dateFilter =
      input.from || input.to
        ? {
            date: {
              ...(input.from && { gte: input.from }),
              ...(input.to && { lte: input.to }),
            },
          }
        : {};
    // Direct comparison
  });
```

**Why it works:** Direct date comparison using date-fns processed dates from client.

**Impact:** 🟢 **Good** - Lessons page shows correct data

---

### **2. CREATE Operations (Writing Data)**

#### ⚠️ **Lesson Creation**

**Location:** `src/server/api/routers/lesson.ts`

**Current Implementation:**

```typescript
create: protectedProcedure
  .input(createLessonSchema)
  .mutation(async ({ ctx, input }) => {
    // Direct insertion of date from client
    return ctx.db.lesson.create({
      data: {
        date: input.date, // Date from client is stored as-is
        duration: input.duration,
        // ...
      },
    });
  });
```

**Analysis:**

- Date from client is stored directly in database
- PostgreSQL stores it as UTC (assuming `TIMESTAMP` or `TIMESTAMPTZ` column)
- **Potential Issue:** If client sends local time thinking it's UTC, or vice versa

**Impact:** 🟡 **MEDIUM** - Depends on client-side date construction

---

#### ⚠️ **Recurring Lesson Creation**

**Location:** `src/server/api/routers/lesson.ts`

```typescript
createRecurring: protectedProcedure
  .input(createRecurringLessonSchema)
  .mutation(async ({ ctx, input }) => {
    const lessons = [];
    // Generates multiple lesson dates
    // Uses date manipulation which may be affected by timezone
  });
```

**Potential Issues:**

- Date arithmetic for recurring lessons may shift times
- Different timezones may cause lessons to be created at wrong times

**Impact:** 🟡 **MEDIUM** - Recurring lessons might be off by hours

---

### **3. UPDATE Operations (Modifying Data)**

#### ⚠️ **Lesson Update**

**Location:** `src/server/api/routers/lesson.ts`

```typescript
update: protectedProcedure
  .input(updateLessonSchema)
  .mutation(async ({ ctx, input }) => {
    return ctx.db.lesson.update({
      where: { id: input.id },
      data: {
        ...(input.date && { date: input.date }), // Direct update
        // ...
      },
    });
  });
```

**Analysis:**

- Same issue as CREATE - date from client stored directly
- No validation or timezone normalization

**Impact:** 🟡 **MEDIUM** - Updated lessons may have wrong timestamps

---

#### ⚠️ **Mark Attendance**

**Location:** `src/server/api/routers/lesson.ts`

```typescript
markAttendance: protectedProcedure
  .input(markAttendanceSchema)
  .mutation(async ({ ctx, input }) => {
    return ctx.db.lesson.update({
      where: { id: input.id },
      data: {
        status: input.status,
        actualMin: input.actualMin,
        // Date not modified, so no timezone issue here
      },
    });
  });
```

**Analysis:** No date manipulation - safe from timezone issues.

**Impact:** 🟢 **Good** - No timezone concerns

---

## 🎯 Root Causes

### 1. **Date Reconstruction Anti-Pattern**

```typescript
// ❌ BAD - Gets components in server timezone
new Date(date.getFullYear(), date.getMonth(), date.getDate());

// ✅ GOOD - Preserves date context
const newDate = new Date(date);
newDate.setHours(0, 0, 0, 0);
```

### 2. **No Timezone Context**

- Client doesn't send timezone information
- Server doesn't know what timezone client intended
- Implicit timezone conversions happen silently

### 3. **Inconsistent Patterns**

- Dashboard uses date reconstruction
- Calendar/Lessons use direct comparison
- No standardized approach across codebase

### 4. **Database Schema Ambiguity**

Need to verify: Are dates stored as UTC? As-is? With timezone info?

---

## 💡 Solutions

### **Solution 1: Quick Fix (Immediate)** ⚡

**Goal:** Make Dashboard consistent with Calendar/Lessons

**Change in `src/server/api/routers/earnings.ts`:**

```typescript
getTodayLessons: protectedProcedure
  .input(z.object({ date: z.date().optional() }).optional())
  .query(async ({ ctx, input }) => {
    const referenceDate = input?.date ?? new Date();

    // ✅ FIX: Don't reconstruct - preserve timezone context
    const todayStart = new Date(referenceDate);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(referenceDate);
    todayEnd.setHours(23, 59, 59, 999);

    const lessons = await ctx.db.lesson.findMany({
      where: {
        teacherId: teacher.id,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      // ...
    });
  });
```

**Pros:**

- ✅ Minimal code changes
- ✅ Consistent with existing patterns
- ✅ Fixes immediate dashboard issue

**Cons:**

- ⚠️ Doesn't address root cause
- ⚠️ Still vulnerable to timezone edge cases

---

### **Solution 2: Proper Timezone Handling (Recommended)** 🌟

**Step 1: Install timezone library**

```bash
npm install date-fns-tz
```

**Step 2: Update schema to include timezone**

```typescript
// lib/validations/api-schemas.ts
export const dateWithTimezoneSchema = z.object({
  date: z.date(),
  timezone: z.string().default("UTC"), // "America/New_York", "Asia/Kolkata"
});
```

**Step 3: Update client to send timezone**

```typescript
// dashboard/_components/today-lessons-table.tsx
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const { data: lessons = [] } = api.earnings.getTodayLessons.useQuery({
  date,
  timezone,
});
```

**Step 4: Update server to handle timezone**

```typescript
// server/api/routers/earnings.ts
import { zonedTimeToUtc, utcToZonedTime } from "date-fns-tz";

getTodayLessons: protectedProcedure
  .input(
    z.object({
      date: z.date(),
      timezone: z.string().default("UTC"),
    }),
  )
  .query(async ({ ctx, input }) => {
    // Convert to client's timezone
    const clientDate = utcToZonedTime(input.date, input.timezone);

    // Get start/end of day in client timezone
    const startOfDay = new Date(clientDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(clientDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Convert back to UTC for database query
    const utcStart = zonedTimeToUtc(startOfDay, input.timezone);
    const utcEnd = zonedTimeToUtc(endOfDay, input.timezone);

    // Query with UTC times
    return ctx.db.lesson.findMany({
      where: {
        date: { gte: utcStart, lte: utcEnd },
      },
    });
  });
```

**Pros:**

- ✅ Explicit timezone handling
- ✅ Works correctly across all timezones
- ✅ Industry standard approach
- ✅ Future-proof

**Cons:**

- ⚠️ Requires more code changes
- ⚠️ New dependency

---

### **Solution 3: Store User Timezone (Long-term)** 🏗️

**Step 1: Update database schema**

```prisma
model User {
  id       String   @id
  email    String   @unique
  timezone String   @default("UTC")
  // ...
}
```

**Step 2: Set timezone on registration/profile**

```typescript
// Capture timezone during registration
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
await createUser({ ...data, timezone });
```

**Step 3: Use stored timezone in all date operations**

```typescript
// Server-side
const userTimezone = ctx.session.user.timezone;
const todayInUserTZ = DateTime.now().setZone(userTimezone).startOf("day");
```

**Pros:**

- ✅ Most robust solution
- ✅ Consistent across all features
- ✅ No need to pass timezone in every request
- ✅ User preference stored

**Cons:**

- ⚠️ Requires schema migration
- ⚠️ Most code changes
- ⚠️ Need to handle timezone updates

---

## 🔧 Implementation Plan

### **Phase 1: Immediate Fix (Today)**

1. ✅ Apply Quick Fix to Dashboard
2. ✅ Test with different timezones
3. ✅ Deploy to production

### **Phase 2: Comprehensive Fix (This Week)**

1. Install `date-fns-tz`
2. Update all GET operations to use timezone context
3. Add timezone to tRPC input schemas
4. Update client to send timezone
5. Test thoroughly

### **Phase 3: Architecture Improvement (Next Sprint)**

1. Add timezone field to User model
2. Create timezone setting in user profile
3. Refactor all date operations to use user timezone
4. Create utility functions for date handling
5. Add timezone unit tests

---

## 🧪 Testing Checklist

### **Manual Testing**

- [ ] Test in UTC timezone (set system to UTC)
- [ ] Test in positive offset (Asia/Kolkata UTC+5:30)
- [ ] Test in negative offset (America/New_York UTC-5)
- [ ] Test at midnight boundaries
- [ ] Test at month boundaries
- [ ] Test daylight saving time transitions

### **Automated Tests**

```typescript
describe("Timezone handling", () => {
  it("returns correct lessons for dashboard in different timezones", () => {
    // Mock system timezone
    process.env.TZ = "America/New_York";
    // Test getTodayLessons
  });

  it("creates lessons with correct timestamps", () => {
    // Test lesson creation from different timezones
  });
});
```

---

## 📚 Resources

- [MDN: Date and Time](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [date-fns-tz Documentation](https://github.com/marnusw/date-fns-tz)
- [IANA Timezone Database](https://www.iana.org/time-zones)
- [PostgreSQL Timezone Handling](https://www.postgresql.org/docs/current/datatype-datetime.html)

---

## 🎯 Key Takeaways

1. **Never reconstruct dates** using `getFullYear()`, `getMonth()`, `getDate()` on server
2. **Always send timezone context** from client to server
3. **Use specialized libraries** like `date-fns-tz` or `luxon` for timezone math
4. **Store UTC in database**, convert for display
5. **Test with multiple timezones** before deploying

---

**Document Status:** Living document  
**Last Updated:** March 6, 2026  
**Next Review:** After Phase 2 implementation
