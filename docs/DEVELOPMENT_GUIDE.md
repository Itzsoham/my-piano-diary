# Development Guide - Code Patterns & Examples

**Last Updated**: January 24, 2026

---

## 📚 Table of Contents

1. [File Structure Walkthrough](#file-structure-walkthrough)
2. [Adding New Features](#adding-new-features)
3. [Code Patterns & Examples](#code-patterns--examples)
4. [Common Workflows](#common-workflows)
5. [Best Practices](#best-practices)
6. [Debugging Tips](#debugging-tips)

---

## 📂 File Structure Walkthrough

### Create New Feature: "Invoicing"

**Step 1: Database Schema**

```prisma
// prisma/schema.prisma
model Invoice {
  id        String   @id @default(cuid())
  studentId String
  teacherId String
  date      DateTime
  amount    Int      // In cents (200000 = ₹2000)
  status    String   @default("pending") // pending, sent, paid, overdue
  dueDate   DateTime
  notes     String?

  student   Student  @relation(fields: [studentId], references: [id])
  teacher   Teacher  @relation(fields: [teacherId], references: [id])

  @@index([studentId])
  @@index([teacherId])
  @@index([status])
}
```

**Step 2: Create Migration**

```bash
npx prisma migrate dev --name add_invoice_model
```

**Step 3: Create tRPC Router**

```typescript
// src/server/api/routers/invoice.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const invoiceRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.invoice.findMany({
      where: { teacherId: ctx.session.user.id },
      include: { student: true },
      orderBy: { date: "desc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        studentId: z.string().cuid(),
        amount: z.number().min(100),
        dueDate: z.date(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) throw new Error("Teacher not found");

      return ctx.db.invoice.create({
        data: {
          ...input,
          teacherId: teacher.id,
          date: new Date(),
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string().cuid(),
        status: z.enum(["pending", "sent", "paid", "overdue"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.invoice.update({
        where: { id: input.invoiceId },
        data: { status: input.status },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ invoiceId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.invoice.delete({
        where: { id: input.invoiceId },
      });
    }),
});
```

**Step 4: Add to Root Router**

```typescript
// src/server/api/root.ts
import { invoiceRouter } from "@/server/api/routers/invoice";

export const appRouter = createTRPCRouter({
  student: studentRouter,
  lesson: lessonRouter,
  report: reportRouter,
  user: userRouter,
  piece: pieceRouter,
  invoice: invoiceRouter, // Add this
});
```

**Step 5: Create Page**

```typescript
// src/app/(root)/invoices/page.tsx
import { api } from "@/trpc/server";
import { InvoicesTable } from "./_components/invoices-table";

export default async function InvoicesPage() {
  const invoices = await api.invoice.getAll();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-muted-foreground mt-2">
          Manage and track invoices
        </p>
      </div>
      <InvoicesTable data={invoices} />
    </div>
  );
}
```

**Step 6: Create Table Component**

```typescript
// src/app/(root)/invoices/_components/invoices-table.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { MoreHorizontal, Trash, Eye } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/trpc/react";
import { toast } from "sonner";

interface InvoicesTableProps {
  data: any[];
}

export function InvoicesTable({ data }: InvoicesTableProps) {
  const deleteMutation = api.invoice.delete.useMutation({
    onSuccess: () => {
      toast.success("Invoice deleted");
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "student.name",
      header: "Student",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `₹${(row.getValue("amount") as number) / 100}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded text-xs font-medium
          ${row.getValue("status") === "paid" ? "bg-green-100 text-green-800" : ""}
          ${row.getValue("status") === "pending" ? "bg-yellow-100 text-yellow-800" : ""}
          ${row.getValue("status") === "overdue" ? "bg-red-100 text-red-800" : ""}
        `}>
          {row.getValue("status")}
        </span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => format(new Date(row.getValue("dueDate") as string), "MMM dd, yyyy"),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteMutation.mutate({ invoiceId: row.original.id })}
        >
          <Trash className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

## 🎯 Adding New Features (Full Workflow)

### Feature: "Student Ratings"

**1. Plan the Feature**

- ❓ What: Rate students 1-5 stars and add comments
- ❓ Why: Track student progress and performance
- ❓ Who: Teachers only
- ❓ When: After each lesson
- ❓ Data: Rating (1-5), Date, Comments, Optional feedback

**2. Design Database**

```prisma
model StudentRating {
  id        String   @id @default(cuid())
  studentId String
  teacherId String
  rating    Int      // 1-5
  comments  String?
  date      DateTime @default(now())
  updatedAt DateTime @updatedAt

  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  teacher   Teacher  @relation(fields: [teacherId], references: [id])

  @@index([studentId])
  @@index([teacherId])
}
```

**3. Create Validation Schema**

```typescript
// src/lib/validations/rating.ts
export const createRatingSchema = z.object({
  studentId: z.string().cuid(),
  rating: z.number().min(1).max(5),
  comments: z.string().max(500).optional(),
});
```

**4. Create tRPC Router**

```typescript
// src/server/api/routers/rating.ts
export const ratingRouter = createTRPCRouter({
  getForStudent: protectedProcedure
    .input(z.object({ studentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.studentRating.findMany({
        where: {
          studentId: input.studentId,
          teacherId: (
            await ctx.db.teacher.findUnique({
              where: { userId: ctx.session.user.id },
            })
          )?.id,
        },
        orderBy: { date: "desc" },
      });
    }),

  create: protectedProcedure
    .input(createRatingSchema)
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      return ctx.db.studentRating.create({
        data: {
          ...input,
          teacherId: teacher!.id,
        },
      });
    }),
});
```

**5. Create UI Component**

```typescript
// src/app/(root)/students/[id]/_components/rating-form.tsx
"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star } from "lucide-react";

export function RatingForm({ studentId }: { studentId: string }) {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");

  const mutation = api.rating.create.useMutation({
    onSuccess: () => {
      toast.success("Rating saved");
      setRating(0);
      setComments("");
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setRating(value)}
              className="focus:outline-none"
            >
              <Star
                className={`h-6 w-6 ${
                  value <= rating ? "fill-yellow-400" : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <Textarea
        placeholder="Add comments..."
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        maxLength={500}
      />

      <Button
        onClick={() => mutation.mutate({ studentId, rating, comments: comments || undefined })}
        disabled={rating === 0 || mutation.isPending}
      >
        Save Rating
      </Button>
    </div>
  );
}
```

---

## 💡 Code Patterns & Examples

### Pattern 1: Protected Procedure with Authorization

```typescript
// Only teacher can access their own data
export const protectedProcedure = t.procedure.use(async (opts) => {
  const session = opts.ctx.session;
  if (!session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next();
});

// Usage
student.getAll: protectedProcedure.query(async ({ ctx }) => {
  const teacher = await ctx.db.teacher.findUnique({
    where: { userId: ctx.session.user.id },
  });
  // Only get students of this teacher
  return ctx.db.student.findMany({
    where: { teacherId: teacher?.id },
  });
});
```

### Pattern 2: Client Component with tRPC

```typescript
"use client";

import { api } from "@/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";

export function StudentList() {
  // Query
  const { data: students, isLoading } = api.student.getAll.useQuery();

  // Mutation
  const createMutation = api.student.create.useMutation({
    onSuccess: () => {
      // Refetch after create
      void refetch();
    },
  });

  return (
    <div>
      {isLoading ? <p>Loading...</p> : null}
      {students?.map((student) => (
        <div key={student.id}>{student.name}</div>
      ))}
    </div>
  );
}
```

### Pattern 3: Form with Validation

```typescript
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createStudentSchema } from "@/lib/validations/student";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function StudentForm() {
  const form = useForm({
    resolver: zodResolver(createStudentSchema),
  });

  const onSubmit = async (data) => {
    // API call
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create</Button>
      </form>
    </Form>
  );
}
```

### Pattern 4: Data Table with Sorting/Filtering

```typescript
"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useState } from "react";

export function DataTable({ data, columns }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
  });

  return (
    // Render table...
  );
}
```

### Pattern 5: API Error Handling

```typescript
// src/lib/error-handler.ts
export async function handleApiCall<T>(
  fn: () => Promise<T>,
  errorMessage: string = "Something went wrong",
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error(error);
    toast.error(errorMessage);
    return null;
  }
}

// Usage
const result = await handleApiCall(
  () => api.student.create.mutate(data),
  "Failed to create student",
);
```

---

## 🔄 Common Workflows

### Workflow 1: Create, Read, Update, Delete (CRUD)

```typescript
// 1. Create
const newStudent = await api.student.create.mutate({ name: "John" });

// 2. Read
const students = await api.student.getAll.useQuery();

// 3. Update
const updated = await api.student.update.mutate({ id: "123", name: "Jane" });

// 4. Delete
await api.student.delete.mutate({ id: "123" });
```

### Workflow 2: Dependent Queries

```typescript
// Fetch students first, then fetch lessons for selected student
const { data: students } = api.student.getAll.useQuery();
const selectedStudent = students?.[0];

// This query depends on selectedStudent being available
const { data: lessons } = api.lesson.getForMonth.useQuery(
  { studentId: selectedStudent?.id ?? "", year, month },
  { enabled: !!selectedStudent }, // Only run if selectedStudent exists
);
```

### Workflow 3: Optimistic Updates

```typescript
const mutation = api.student.update.useMutation({
  onMutate: async (newData) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ["student", "getAll"] });

    // Snapshot previous data
    const previousStudents = queryClient.getQueryData(["student", "getAll"]);

    // Update cache optimistically
    queryClient.setQueryData(["student", "getAll"], (old: any[]) => [
      ...old.filter((s) => s.id !== newData.id),
      newData,
    ]);

    return { previousStudents };
  },
  onError: (err, newData, context) => {
    // Revert on error
    queryClient.setQueryData(["student", "getAll"], context?.previousStudents);
  },
});
```

### Workflow 4: Server Component to Client Component

```typescript
// Server Component
export async function StudentPage() {
  const student = await api.student.getByGuid({ id: studentId });

  return <StudentDetail initialData={student} />;
}

// Client Component
"use client";

interface StudentDetailProps {
  initialData: Student;
}

export function StudentDetail({ initialData }: StudentDetailProps) {
  const { data = initialData } = api.student.getByGuid.useQuery(
    { id: initialData.id },
    { initialData }
  );

  return <div>{data.name}</div>;
}
```

---

## ✅ Best Practices

### 1. Always Use Zod Validation

```typescript
// ✅ Good
export const createStudentSchema = z.object({
  name: z.string().min(1).max(100),
  avatar: z.string().url().optional(),
});

student.create: protectedProcedure
  .input(createStudentSchema)
  .mutation(...)

// ❌ Avoid
student.create: protectedProcedure
  .input(z.object({ name: z.any(), avatar: z.any() }))
  .mutation(...)
```

### 2. Use Server Components for Data Fetching

```typescript
// ✅ Good - Server Component
export async function Students() {
  const students = await api.student.getAll(); // Server call
  return <StudentsTable data={students} />;
}

// ❌ Avoid - Client component with useEffect
"use client";
export function Students() {
  const [students, setStudents] = useState([]);
  useEffect(() => {
    // Fetching in client
  }, []);
}
```

### 3. Handle Errors Gracefully

```typescript
// ✅ Good
try {
  const student = await api.student.create.mutate(data);
  toast.success("Student created");
} catch (error) {
  toast.error("Failed to create student");
}

// ❌ Avoid
const student = await api.student.create.mutate(data);
```

### 4. Use TypeScript Strict Mode

```typescript
// ✅ Good
const student: Student | null = null;
if (student?.id) {
  // Handle null safely
}

// ❌ Avoid
const student = null; // any type
console.log(student.id); // Could crash
```

### 5. Memoize Expensive Components

```typescript
// ✅ Good
export const StudentCard = React.memo(({ student }: Props) => {
  return <div>{student.name}</div>;
});

// ❌ Avoid
export function StudentCard({ student }: Props) {
  return <div>{student.name}</div>; // Rerendered every time
}
```

---

## 🐛 Debugging Tips

### Tip 1: Use Prisma Studio

```bash
npm run db:studio
```

Browse database visually, see all records, add/edit data easily.

### Tip 2: Log tRPC Calls

```typescript
// src/server/api/trpc.ts
export const t = initTRPC.create({
  transformer: superjson,
});

const isProduction = process.env.NODE_ENV === "production";

export const publicProcedure = t.procedure.use(async (opts) => {
  const start = Date.now();
  const result = await opts.next();
  const duration = Date.now() - start;

  if (!isProduction) {
    console.log(`${opts.path} took ${duration}ms`);
  }

  return result;
});
```

### Tip 3: Use React DevTools

- Install React DevTools browser extension
- Inspect component props, state, hooks
- Track re-renders

### Tip 4: Check Network Tab

- Open DevTools → Network tab
- Monitor API calls
- Check response data and errors
- Verify request/response sizes

### Tip 5: Use Console Logging

```typescript
// ✅ Good
console.log("Student created:", { id, name });
console.table(students); // Nice table format

// ❌ Avoid
console.log("stuff"); // Unclear
console.log(JSON.stringify(data)); // Unreadable
```

---

## 🎯 Quick Reference

| Task             | Location                                    |
| ---------------- | ------------------------------------------- |
| Add new table    | `src/server/api/routers/`                   |
| Add new page     | `src/app/(root)/feature/page.tsx`           |
| Add UI component | `src/components/ui/`                        |
| Add validation   | `src/lib/validations/`                      |
| Add style        | `src/styles/globals.css` or inline Tailwind |
| Add hook         | `src/hooks/`                                |
| Add utility      | `src/lib/`                                  |
| Configure auth   | `src/server/auth/`                          |

---

## 📚 Learn More

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [tRPC Docs](https://trpc.io)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
