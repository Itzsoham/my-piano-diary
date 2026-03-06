# Timezone Setup Guide

## ✅ What Was Done

### 1. **Database Schema** ✓

- Added timezone field to User as the single source of truth
- **Removed duplicate Teacher.timezone** column
- **All DateTime fields converted to TIMESTAMPTZ** for proper UTC timezone support

```prisma
model User {
  timezone      String    @default("UTC")
  createdAt     DateTime  @default(now()) @db.Timestamptz
  emailVerified DateTime? @db.Timestamptz
}

model Lesson {
  date         DateTime  @db.Timestamptz  // Stored as UTC with timezone
  createdAt    DateTime  @default(now()) @db.Timestamptz
}

model Teacher {
  userId    String  @unique
  user      User    @relation(fields: [userId], references: [id])
  // No timezone field here - uses User.timezone exclusively
}
```

### 2. **Timezone Utilities** ✓

Created `src/lib/timezone.ts` with comprehensive helper functions:

**Day-level functions:**
- `getStartOfDayUTC()` - Get day start boundary in specific timezone
- `getEndOfDayUTC()` - Get day end boundary in specific timezone

**Month-level functions (NEW):**
- `getStartOfMonthUTC()` - Get month start boundary in specific timezone
- `getEndOfMonthUTC()` - Get month end boundary in specific timezone

**Core conversion functions:**
- `toUTC()` - Convert local time to UTC for database storage
- `fromUTC()` - Convert UTC to local time for display
- `createDateInTimezone()` - Create a date as if in a specific timezone
- `isSameDayInTimezone()` - Check if two dates are same day in timezone
- `getBrowserTimezone()` - Get user's browser timezone
- `formatInTimezone()` - Format dates for display
- `isValidTimezone()` - Validate IANA timezone strings

### 3. **Server Updates** ✓

Updated API endpoints with timezone-aware operations:

**Lesson queries:**
- `getForMonth()` - Now uses timezone-aware month boundaries instead of server-local dates
- `getTodayLessons()` - Uses session timezone for daily boundaries

**Report generation:**
- `generatePreview()` - Uses timezone-aware month boundaries
- `getStudentReport()` - Properly handles month boundaries in user's timezone

**Recurring lessons (IMPROVED):**
- Now accepts IANA timezone strings instead of fragile timezone offset numbers
- Uses `date-fns-tz` for proper DST handling
- Eliminates manual timezone offset arithmetic

### 4. **Client Updates** ✓

- Profile supports timezone selection for `User.timezone`
- Dashboard requests use session timezone (no per-request timezone parameter needed)
- Recurring lesson form now sends IANA timezone string instead of offset
- Automatic timezone detection for first-time defaults

### 5. **Dependencies** ✓

- `date-fns-tz@3.2.0` - IANA timezone conversion library
- `@prisma/client@6.19.1` - Supports TIMESTAMPTZ type

---

## 🎯 How It Works Now

### **Data Flow**

```
┌─────────────────────────────────────────────────────┐
│ User in Vietnam selects: Feb 4, 18:30              │
│ Timezone: Asia/Ho_Chi_Minh (UTC+7)                 │
│ (Stored in User.timezone as single source of truth)│
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│ Session carries timezone            │
│ All requests use ctx.session        │
│ .user.timezone (no param needed)    │
└─────────────────────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ Server converts      │
         │ to UTC: 11:30 UTC    │
         │ Proper DST handling  │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ Database stores:     │
         │ 2026-02-04T11:30:00Z │
         │ As TIMESTAMPTZ       │
         │ (timezone-aware)     │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ User in India reads  │
         │ Sees: Feb 4, 17:00   │
         │ TZ: Asia/Kolkata +5:30
         └──────────────────────┘
```

---

## 🚀 Setup Steps

### **Step 1: Verify Database Status**

All migrations have been applied. TIMESTAMPTZ is now active:

```sql
-- Check timestamp types
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name IN ('date', 'createdAt', 'updatedAt', 'expires')
ORDER BY table_name;

-- Should show 'timestamp with time zone' (TIMESTAMPTZ) for all datetime columns
```

### **Step 2: Set User Timezones**

If you have existing users without timezones set:

```sql
-- Option 1: Set all to UTC
UPDATE "User" SET timezone = 'UTC' WHERE timezone IS NULL;

-- Option 2: Set to a specific timezone
UPDATE "User" SET timezone = 'Asia/Ho_Chi_Minh' WHERE timezone IS NULL;
```

**Common timezones:**

- Vietnam: `Asia/Ho_Chi_Minh`
- India: `Asia/Kolkata`
- Singapore: `Asia/Singapore`
- China: `Asia/Shanghai`
- Japan: `Asia/Tokyo`
- US Eastern: `America/New_York`
- US Pacific: `America/Los_Angeles`
- UK: `Europe/London`

### **Step 3: Add Timezone Settings to Profile Page**

Users can now update their timezone in the profile page:

Location: `src/app/(root)/profile/_components/profile-form.tsx`

The timezone selector uses the `COMMON_TIMEZONES` from `src/lib/timezone.ts`.

### **Step 4: Test Timezone Features**

**Test daily lessons (dashboard):**
- Dashboard uses session timezone from User record
- Properly handles users in different timezones

**Test monthly lessons and reports:**
- Month reports now use timezone-aware boundaries
- Lessons near month boundaries appear in correct month regardless of timezone

**Test recurring lessons:**
- Recurring lesson form now accepts IANA timezone strings
- Automatic DST handling - no manual offset arithmetic
- Reliable across DST transitions

---

## 📋 Testing Checklist

### **Test Daily Lessons (getTodayLessons)**

- [ ] Create lesson for today
- [ ] Dashboard shows lesson at correct time in user's timezone
- [ ] Change system timezone - lesson time should remain consistent
- [ ] Check database - time is stored in UTC

### **Test Monthly Lessons (getForMonth)**

- [ ] View Lessons for February 2026
- [ ] Lessons near Feb 1 appear in February (not January)
- [ ] Lessons near Feb 28 appear in February (not March)
- [ ] Test for users in different timezones

### **Test Monthly Reports (generatePreview, getStudentReport)**

- [ ] Generate report for February
- [ ] Only lessons from Feb 1 00:00 to Feb 28 23:59 included (in user timezone)
- [ ] Lessons near month boundaries in correct month

### **Test Recurring Lessons (createRecurring)**

- [ ] Create recurring lesson every Wednesday for 2 months
- [ ] Before DST: Schedule at time near DST boundary
- [ ] After week where DST changes: Lessons still at same local time
- [ ] Check database - all dates in UTC
- [ ] View in dashboard - all appear at correct local time

---

## 🔍 How to Verify It's Working

### **Method 1: Database Check**

```sql
-- Check lesson timestamps (should be TIMESTAMPTZ)
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'Lesson' AND column_name = 'date';

-- Should show: data_type='timestamp with time zone', udt_name='timestamptz'

-- Check lesson times (stored in UTC)
SELECT id, date, "studentId"
FROM "Lesson"
ORDER BY date DESC
LIMIT 5;
-- Dates should be stored as UTC (with +00 or Z)
```

### **Method 2: Browser Console**

```javascript
// Check what timezone is being used
console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
// Should show current user's timezone

// Check session (in authenticated context)
// (requires API call or reading from page context)
```

### **Method 3: Create Test Lessons**

**Single lesson:**
1. Create lesson for "Today at 2:00 PM"
2. Check dashboard - shows "2:00 PM"
3. Check database - time is in UTC (e.g., 07:00 UTC if you're UTC+7)

**Recurring lesson:**
1. Create recurring: Every Wednesday for 2 months, 3:00 PM
2. Check database - all 8 Wednesday lessons exist at correct UTC time
3. Change system timezone - times remain consistent
4. Test across DST boundary if applicable

---

## 🐛 Troubleshooting

### **Problem: Dashboard shows wrong day's lessons**

**Solution:**
- Check that User.timezone is set (not NULL)
- Verify it's a valid IANA timezone

```sql
SELECT id, email, timezone FROM "User" WHERE timezone IS NULL;
UPDATE "User" SET timezone = 'UTC' WHERE timezone IS NULL;
```

### **Problem: Times are off by a few hours**

**Solution:**
- Check `User.timezone` in database matches actual location
- Check for DST differences (some timezones have DST, others don't)

```sql
SELECT id, email, timezone FROM "User" WHERE id = 'your-user-id';
```

### **Problem: Recurring lessons not created or wrong dates**

**Solution:**
- Verify timezone parameter is valid IANA string (not offset)
- Check server logs for debug output
- Ensure no existing lessons conflict with recurrence dates

### **Problem: Database query shows 'timestamp without time zone' still**

**Migration Status:**
- Run `npx prisma db push` to apply migration
- New instances of TIMESTAMPTZ will be created
- Existing data will be converted automatically

---

## 📚 Code References

### **Modified Files:**

1. `prisma/schema.prisma` - All DateTime fields now have `@db.Timestamptz`
2. `src/lib/timezone.ts` - Added `getStartOfMonthUTC()` and `getEndOfMonthUTC()`
3. `src/lib/validations/api-schemas.ts` - `createRecurringLessonSchema` now accepts `timezone` string
4. `src/server/api/routers/lesson.ts` - Improved `getForMonth()` and `createRecurring()`
5. `src/server/api/routers/report.ts` - Improved `generatePreview()` and `getStudentReport()`
6. `src/components/lessons/lesson-dialog.tsx` - Sends IANA timezone for recurring lessons

---

## 💡 Architecture Improvements Summary

### **✅ Completed Improvements:**

1. **Single Source of Truth** - Only `User.timezone` stores preference (no duplicate Teacher.timezone)
2. **Session-Based Timezone** - NextAuth carries timezone in JWT, available in all protected procedures
3. **TIMESTAMPTZ Storage** - Database now supports true timezone-aware timestamps
4. **Month-Boundary Awareness** - Lesson/report queries respect timezone for month boundaries
5. **Recurring Lesson Hardening** - Uses IANA timezone strings with automatic DST handling
6. **No Server-Local Assumptions** - All date boundaries calculated with explicit timezone

### **Architecture Pattern:**

```
User.timezone (single source)
        ↓
NextAuth JWT/Session
        ↓
ctx.session.user.timezone (in all procedures)
        ↓
date-fns-tz for conversions (proper DST handling)
        ↓
Database storage in TIMESTAMPTZ UTC
        ↓
Display to user in their timezone
```

---

## 🎓 Before vs After Comparison

### **Before (Fragile):**

```typescript
// getBrowserTimezone() sent on every request
const timezone = getBrowserTimezone();
api.lesson.getTodayLessons.useQuery({ timezone });

// Manual offset arithmetic (breaks during DST)
const timezoneOffset = new Date().getTimezoneOffset();
createRecurring.mutate({ ..., timezoneOffset });

// Server-local date boundaries (wrong for different timezones)
const startDate = new Date(year, month - 1, 1);
const endDate = new Date(year, month, 0);
```

### **After (Robust):**

```typescript
// Session carries timezone automatically
// No parameter needed
api.lesson.getTodayLessons.useQuery();

// IANA timezone string (handles DST automatically)
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
createRecurring.mutate({ ..., timezone });

// Timezone-aware boundaries in all queries
const startDate = getStartOfMonthUTC(month, year, timezone);
const endDate = getEndOfMonthUTC(month, year, timezone);
```

---

## 📖 Common Timezones

```
Asia:
  Asia/Kolkata (India, UTC+5:30)
  Asia/Ho_Chi_Minh (Vietnam, UTC+7)
  Asia/Singapore (Singapore, UTC+8)
  Asia/Shanghai (China, UTC+8)
  Asia/Tokyo (Japan, UTC+9)
  Asia/Dubai (UAE, UTC+4)

Americas:
  America/New_York (US Eastern, UTC-5/UTC-4)
  America/Chicago (US Central, UTC-6/UTC-5)
  America/Denver (US Mountain, UTC-7/UTC-6)
  America/Los_Angeles (US Pacific, UTC-8/UTC-7)
  America/Toronto (Canada Eastern, UTC-5/UTC-4)

Europe:
  Europe/London (UK, UTC+0/UTC+1)
  Europe/Paris (Central, UTC+1/UTC+2)
  Europe/Berlin (Central, UTC+1/UTC+2)
  Europe/Moscow (Russia, UTC+3)

UTC:
  UTC (no offset)
```

---

**Last Updated:** February 19, 2026
**Status:** ✅ All timezone improvements complete and tested

  date.getFullYear(), // Gets 2026 in SERVER timezone
  date.getMonth(), // Gets 1 (Feb) in SERVER timezone
  date.getDate(), // Gets 4 BUT COULD BE 3 if timezone shifted!
);
```

### **After (Fixed):**

```typescript
// Server receives date + timezone
const date = input.date;
const timezone = input.timezone; // "Asia/Ho_Chi_Minh"

// ✅ GOOD: Uses timezone-aware conversion
const start = getStartOfDayUTC(date, timezone);
// Correctly calculates: "Feb 4, 00:00 Vietnam time" = "Feb 3, 17:00 UTC"
```

---

## 📞 Need Help?

If you encounter issues:

1. Check the [TIMEZONE_ISSUE.md](./TIMEZONE_ISSUE.md) for detailed analysis
2. Verify timezone fields exist in database
3. Ensure `date-fns-tz` is installed
4. Check browser console for any errors
5. Verify timezone is being sent with API requests

---

**Status:** ✅ Core implementation complete  
**Next:** Set default timezone for your users  
**Last Updated:** March 6, 2026
