# Issues & Fixes

> Current problems in the app, what needs fixing, and how to fix each one.

**Last Updated**: February 27, 2026

---

## Critical Issues

### 1. No Unit Tests

**Impact**: No safety net for refactoring, bugs slip into production.

**Fix**:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

Start with:

- Utility functions (`src/lib/utils.ts`, `src/lib/format.ts`, `src/lib/currency.ts`)
- Zod validation schemas (`src/lib/validations/`)
- tRPC router procedures (mock Prisma, test input/output)

**Target**: 80%+ coverage on utilities and API layer.

---

### 2. Client-Side Only Pagination

**Impact**: All records loaded at once — doesn't scale past ~100 students/lessons.

**Where**: Student table, Pieces table, Lesson queries.

**Fix**: Add server-side pagination to tRPC procedures:

```typescript
// Add to each "getAll" procedure
.input(z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(10).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}))
.query(async ({ ctx, input }) => {
  const skip = (input.page - 1) * input.limit;
  const where = { teacherId: teacher.id, ...searchFilter };

  const [data, total] = await Promise.all([
    ctx.db.student.findMany({ where, skip, take: input.limit, orderBy: ... }),
    ctx.db.student.count({ where }),
  ]);

  return { data, total, page: input.page, hasMore: skip + input.limit < total };
})
```

Update table components to use `page` / `limit` params instead of loading everything.

---

### 3. Dashboard Uses Hardcoded/Static Data

**Impact**: Dashboard charts and metrics don't reflect actual data.

**Where**: `src/app/(root)/dashboard/` — uses `data.json` files.

**Fix**: Create real tRPC procedures:

- `dashboard.getStats` — total students, lessons this month, attendance rate
- `dashboard.getLessonTrend({ months })` — lesson count per month for chart
- `dashboard.getRecentActivity` — recent lessons and reports

Replace static imports with live queries.

---

### 4. Duplicate Table Component Code

**Impact**: StudentsTable and PiecesTable share ~60% identical code. Changes need to be made in multiple places.

**Fix**: Create a generic `DataTable` wrapper:

```typescript
// src/components/data-table.tsx (enhance existing or create new)
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchField?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}
```

Then each page just defines its columns and passes data — no duplicated table boilerplate.

---

### 5. Missing/Weak Input Validation on Some Procedures

**Impact**: API can accept bad data, leading to unexpected errors.

**Where**: Some tRPC procedures accept loose inputs.

**Fix**: Ensure every procedure has strict Zod validation:

```typescript
// Examples of what should exist in src/lib/validations/
const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  avatar: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(1000).optional(),
  lessonRate: z.number().min(0).optional(),
});

const createLessonSchema = z.object({
  studentId: z.string().cuid(),
  date: z.date(),
  duration: z.number().min(15).max(180),
  pieceId: z.string().cuid().optional().nullable(),
});
```

Check each router in `src/server/api/routers/` and make sure `.input()` uses a proper schema.

---

## Medium Priority Issues

### 6. No Loading Skeletons

**Impact**: Pages flash empty then load — feels janky.

**Fix**: Add skeleton components per page:

```typescript
// Example: Students page
if (isLoading) return <StudentsTableSkeleton />;
```

Create skeleton variants for: Table rows, Calendar grid, Dashboard cards, Charts.

Shadcn/UI already has a `Skeleton` component — just compose them.

---

### 7. Empty States Are Missing

**Impact**: When a teacher has 0 students or 0 lessons, they see a blank table.

**Fix**: Add empty state components:

```tsx
{data.length === 0 ? (
  <div className="rounded-lg border border-dashed p-8 text-center">
    <h3 className="text-lg font-medium">No students yet</h3>
    <p className="text-muted-foreground mt-1">
      Create your first student to get started.
    </p>
    <Button className="mt-4" onClick={openCreateDialog}>
      Add Student
    </Button>
  </div>
) : (
  <DataTable ... />
)}
```

---

### 8. No Rate Limiting

**Impact**: API endpoints are exposed without throttling — vulnerable to abuse.

**Fix**: Add rate limiting middleware. Options:

- `@upstash/ratelimit` with Redis (recommended for serverless)
- Custom middleware in `src/middleware.ts`

---

### 9. Accessibility Gaps

**Impact**: Screen readers and keyboard navigation may not work fully.

**Fix**:

- Audit with Lighthouse accessibility check
- Ensure all interactive elements have proper `aria-` attributes
- Add keyboard navigation to calendar and tables
- Test with screen reader

---

### 10. No Logging/Monitoring in Production

**Impact**: Errors in production go unnoticed.

**Fix**: Integrate an error tracking service:

- **Sentry** (recommended) — `npm install @sentry/nextjs`
- Configure in `sentry.client.config.ts` and `sentry.server.config.ts`
- The existing `logError` function in `src/lib/error-handler.ts` can be extended to push to Sentry

---

## Quick Fixes (Under 30 Minutes Each)

| #   | Issue                                      | File(s)                                | Fix                                                       |
| --- | ------------------------------------------ | -------------------------------------- | --------------------------------------------------------- |
| 1   | Lesson duration has no min/max validation  | `server/api/routers/lesson.ts`         | Add `.min(15).max(180)` to duration input                 |
| 2   | No `onDelete: Cascade` on some relations   | `prisma/schema.prisma`                 | Add cascade deletes to Lesson → Teacher/Student relations |
| 3   | Missing error toast on failed mutations    | Various `_components/` files           | Wrap mutations with `onError: () => toast.error(...)`     |
| 4   | Calendar doesn't show loading state        | `calendar/page.tsx`                    | Add loading skeleton while `getForMonth` is fetching      |
| 5   | Profile form doesn't validate email format | `profile/_components/profile-form.tsx` | Add `.email()` to Zod schema                              |

---

## Recommended Fix Order

**Week 1** — Foundation:

1. Add input validation to all tRPC procedures
2. Fix empty states across all pages
3. Add loading skeletons
4. Add error toasts to all mutations

**Week 2** — Scalability: 5. Implement server-side pagination 6. Consolidate table components 7. Replace dashboard static data with real queries

**Week 3** — Quality: 8. Set up Vitest + write tests for utils and validators 9. Write integration tests for tRPC routers 10. Add Sentry for production monitoring
