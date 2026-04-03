# Payment Tracking Module - Detailed Implementation Plan

> A comprehensive payment tracking system for teachers to record student payments, track dues, and manage multi-transaction payment histories.

**Status**: Planned | **Version**: 1.0 | **Last Updated**: April 3, 2026

---

## 📋 Overview

This module allows piano teachers to:

- Track expected monthly dues per student (auto-calculated from completed lessons × lesson rate)
- Record multiple payment transactions per month
- View payment status: UNPAID, PARTIAL, or PAID
- See payment history and outstanding balances
- Filter and analyze payment data by month, year, and student

**Key Distinction**: Lessons record _what happened_, Payments track _the money flow_.

---

## 🗃️ Data Model

### New Prisma Models

```prisma
model PaymentMonth {
  id            String          @id @default(cuid())
  studentId     String
  teacherId     String
  month         Int             // 1-12
  year          Int

  expectedAmount Int            // auto-calculated from completed lessons × lessonRate
  receivedAmount Int @default(0) // sum of all transactions this month
  status        PaymentStatus   @default(UNPAID) // UNPAID, PARTIAL, PAID

  paidAt        DateTime?       @db.Timestamptz // when fully paid
  notes         String?

  createdAt     DateTime        @default(now()) @db.Timestamptz
  updatedAt     DateTime        @updatedAt @db.Timestamptz

  student       Student         @relation(fields: [studentId], references: [id], onDelete: Cascade)
  teacher       Teacher         @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  transactions  PaymentTransaction[]

  @@unique([studentId, month, year])
  @@index([teacherId, month, year])
  @@index([studentId, year])
}

model PaymentTransaction {
  id            String          @id @default(cuid())
  paymentMonthId String
  studentId     String
  teacherId     String

  amount        Int             // amount paid in this transaction (smallest currency unit)
  transactionDate DateTime       @db.Timestamptz
  method        String?         // "CASH", "TRANSFER", "CHEQUE", etc. (optional)
  notes         String?

  createdAt     DateTime        @default(now()) @db.Timestamptz
  updatedAt     DateTime        @updatedAt @db.Timestamptz

  paymentMonth  PaymentMonth    @relation(fields: [paymentMonthId], references: [id], onDelete: Cascade)
  student       Student         @relation(fields: [studentId], references: [id], onDelete: Cascade)
  teacher       Teacher         @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  @@index([teacherId, transactionDate])
  @@index([studentId, transactionDate])
  @@index([paymentMonthId])
}

enum PaymentStatus {
  UNPAID  // 0% received
  PARTIAL // 1-99% received
  PAID    // 100% received (may include overpayment)
}
```

### Model Relations

**Add to Teacher**:

```prisma
model Teacher {
  // ... existing fields
  payments           PaymentMonth[]
  paymentTransactions PaymentTransaction[]
}
```

**Add to Student**:

```prisma
model Student {
  // ... existing fields
  payments           PaymentMonth[]
  paymentTransactions PaymentTransaction[]
}
```

### Schema Rationale

- **PaymentMonth**: Monthly aggregate per student; unique by `(studentId, month, year)` to prevent duplicates
- **PaymentTransaction**: Individual transaction ledger; children of PaymentMonth
- **expectedAmount**: Cached value (auto-calculated from lesson data at time of creation/refresh)
- **receivedAmount**: Running total of all transaction.amount in this month
- **status**: Derived from expectedAmount vs receivedAmount; updated automatically
- **Money as INT**: Store as cents/paise for precision (multiply/divide by 100 for display)
- **Timestamps**: All datetimes use `@db.Timestamptz` for proper timezone handling across teacher locations
- **Indexes**: `(teacherId, month, year)` for fast monthly dashboard queries; `(studentId, year)` for student history

---

## 🔌 Backend API Design

### New Router: `src/server/api/routers/payment.ts`

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { idSchema } from "@/lib/validations/common-schemas";
import { getStartOfMonthUTC, getEndOfMonthUTC } from "@/lib/timezone";

export const paymentRouter = createTRPCRouter({
  // Get all payments for a specific month
  getForMonth: protectedProcedure
    .input(
      z.object({
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(2000).max(2100),
        studentId: idSchema.optional(), // filter by student
        status: z.enum(["UNPAID", "PARTIAL", "PAID"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) throw new Error("Teacher not found");

      const payments = await ctx.db.paymentMonth.findMany({
        where: {
          teacherId: teacher.id,
          month: input.month,
          year: input.year,
          ...(input.studentId && { studentId: input.studentId }),
          ...(input.status && { status: input.status }),
        },
        include: {
          student: {
            select: { id: true, name: true, avatar: true, lessonRate: true },
          },
          transactions: {
            orderBy: { transactionDate: "desc" },
            take: 5, // last 5 transactions only in list view
          },
        },
        orderBy: { student: { name: "asc" } },
      });

      return payments;
    }),

  // Get or create payment record for a month; calculates expected amount from lessons
  getOrCreateMonthRecord: protectedProcedure
    .input(
      z.object({
        studentId: idSchema,
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(2000).max(2100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
        include: { user: true },
      });

      if (!teacher) throw new Error("Teacher not found");

      // Verify ownership
      const student = await ctx.db.student.findFirst({
        where: { id: input.studentId, teacherId: teacher.id },
      });

      if (!student) throw new Error("Student not found");

      // Calculate expected amount from COMPLETE lessons this month
      const timezone = teacher.user.timezone ?? "UTC";
      const startDate = getStartOfMonthUTC(input.month, input.year, timezone);
      const endDate = getEndOfMonthUTC(input.month, input.year, timezone);

      const completedLessons = await ctx.db.lesson.findMany({
        where: {
          studentId: input.studentId,
          date: { gte: startDate, lte: endDate },
          status: "COMPLETE",
        },
      });

      const expectedAmount = completedLessons.length * student.lessonRate;

      // Upsert payment month record
      const payment = await ctx.db.paymentMonth.upsert({
        where: {
          studentId_month_year: {
            studentId: input.studentId,
            month: input.month,
            year: input.year,
          },
        },
        create: {
          studentId: input.studentId,
          teacherId: teacher.id,
          month: input.month,
          year: input.year,
          expectedAmount,
        },
        update: {
          expectedAmount, // always recalculate from latest lesson data
        },
        include: {
          transactions: { orderBy: { transactionDate: "desc" } },
        },
      });

      return payment;
    }),

  // Add a new payment transaction
  addTransaction: protectedProcedure
    .input(
      z.object({
        paymentMonthId: idSchema,
        studentId: idSchema,
        amount: z.number().int().min(1),
        transactionDate: z.date().optional(), // defaults to today
        method: z.string().max(50).optional(),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) throw new Error("Teacher not found");

      // Verify ownership of payment month
      const payment = await ctx.db.paymentMonth.findFirst({
        where: { id: input.paymentMonthId, teacherId: teacher.id },
      });

      if (!payment) throw new Error("Payment record not found");

      // Add transaction
      const transaction = await ctx.db.paymentTransaction.create({
        data: {
          paymentMonthId: input.paymentMonthId,
          studentId: input.studentId,
          teacherId: teacher.id,
          amount: input.amount,
          transactionDate: input.transactionDate ?? new Date(),
          method: input.method,
          notes: input.notes,
        },
      });

      // Recalculate month totals and status
      await updatePaymentMonthTotals(ctx.db, input.paymentMonthId);

      return transaction;
    }),

  // Update an existing transaction
  updateTransaction: protectedProcedure
    .input(
      z.object({
        transactionId: idSchema,
        amount: z.number().int().min(1).optional(),
        transactionDate: z.date().optional(),
        method: z.string().max(50).optional(),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) throw new Error("Teacher not found");

      // Verify ownership
      const transaction = await ctx.db.paymentTransaction.findFirst({
        where: { id: input.transactionId, teacherId: teacher.id },
      });

      if (!transaction) throw new Error("Transaction not found");

      const updated = await ctx.db.paymentTransaction.update({
        where: { id: input.transactionId },
        data: {
          ...(input.amount && { amount: input.amount }),
          ...(input.transactionDate && {
            transactionDate: input.transactionDate,
          }),
          ...(input.method && { method: input.method }),
          ...(input.notes && { notes: input.notes }),
        },
      });

      // Recalculate month totals
      await updatePaymentMonthTotals(ctx.db, transaction.paymentMonthId);

      return updated;
    }),

  // Delete a transaction
  deleteTransaction: protectedProcedure
    .input(z.object({ transactionId: idSchema }))
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) throw new Error("Teacher not found");

      // Verify ownership
      const transaction = await ctx.db.paymentTransaction.findFirst({
        where: { id: input.transactionId, teacherId: teacher.id },
      });

      if (!transaction) throw new Error("Transaction not found");

      const paymentMonthId = transaction.paymentMonthId;

      await ctx.db.paymentTransaction.delete({
        where: { id: input.transactionId },
      });

      // Recalculate month totals
      await updatePaymentMonthTotals(ctx.db, paymentMonthId);

      return { success: true };
    }),

  // Get payment history for a student
  getStudentHistory: protectedProcedure
    .input(
      z.object({
        studentId: idSchema,
        limit: z.number().int().min(1).max(36).default(12), // last N months
      }),
    )
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) throw new Error("Teacher not found");

      // Verify ownership
      const student = await ctx.db.student.findFirst({
        where: { id: input.studentId, teacherId: teacher.id },
      });

      if (!student) throw new Error("Student not found");

      const history = await ctx.db.paymentMonth.findMany({
        where: { studentId: input.studentId, teacherId: teacher.id },
        include: {
          transactions: { orderBy: { transactionDate: "desc" } },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: input.limit,
      });

      return history;
    }),

  // Get summary of unpaid/partial payments
  getUnpaidSummary: protectedProcedure
    .input(
      z.object({
        month: z.number().int().min(1).max(12).optional(),
        year: z.number().int().min(2000).max(2100).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) throw new Error("Teacher not found");

      const unpaidPayments = await ctx.db.paymentMonth.findMany({
        where: {
          teacherId: teacher.id,
          status: { in: ["UNPAID", "PARTIAL"] },
          ...(input.month && { month: input.month }),
          ...(input.year && { year: input.year }),
        },
        include: { student: { select: { name: true } } },
      });

      const totalUnpaid = unpaidPayments.reduce(
        (sum, p) => sum + (p.expectedAmount - p.receivedAmount),
        0,
      );

      return {
        unpaidCount: unpaidPayments.length,
        totalOutstanding: totalUnpaid,
        payments: unpaidPayments,
      };
    }),
});

// Helper: recalculate payment month totals and derive status
async function updatePaymentMonthTotals(
  db: PrismaClient,
  paymentMonthId: string,
) {
  const transactions = await db.paymentTransaction.findMany({
    where: { paymentMonthId },
  });

  const receivedAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  const payment = await db.paymentMonth.findUnique({
    where: { id: paymentMonthId },
  });

  if (!payment) return;

  let status: "UNPAID" | "PARTIAL" | "PAID";
  if (receivedAmount === 0) status = "UNPAID";
  else if (receivedAmount >= payment.expectedAmount) status = "PAID";
  else status = "PARTIAL";

  const paidAt = status === "PAID" ? new Date() : null;

  await db.paymentMonth.update({
    where: { id: paymentMonthId },
    data: {
      receivedAmount,
      status,
      paidAt,
    },
  });
}
```

### Router Registration

In `src/server/api/root.ts`:

```typescript
import { paymentRouter } from "./routers/payment";

export const appRouter = createCallerFactory(defineRouter)({
  // ... existing routers
  payment: paymentRouter,
});
```

### Validation Schemas

Add to `src/lib/validations/api-schemas.ts`:

```typescript
export const addPaymentTransactionSchema = z.object({
  paymentMonthId: idSchema,
  studentId: idSchema,
  amount: z
    .number()
    .int()
    .min(1, "Amount must be at least 1 (smallest currency unit)"),
  transactionDate: z.date().optional(),
  method: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const updatePaymentTransactionSchema = z.object({
  transactionId: idSchema,
  amount: z.number().int().min(1).optional(),
  transactionDate: z.date().optional(),
  method: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const getPaymentForMonthSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  studentId: idSchema.optional(),
  status: z.enum(["UNPAID", "PARTIAL", "PAID"]).optional(),
});
```

---

## 🎨 Frontend Components

### New Route: `/app/(root)/payments`

#### Page Entry: `src/app/(root)/payments/page.tsx`

```typescript
import { api } from "@/trpc/server";
import { PaymentsPageContent } from "./_components/payments-page";

export const metadata = {
  title: "Payments",
  description: "Track student payments and dues",
};

export default async function PaymentsPage() {
  const students = await api.student.getAll.query();

  return <PaymentsPageContent students={students} />;
}
```

#### Client Container: `src/app/(root)/payments/_components/payments-page.tsx`

```typescript
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentsTable } from "./payments-table";
import { PaymentTransactionDialog } from "./payment-transaction-dialog";
import { toast } from "sonner";

interface PaymentsPageContentProps {
  students: { id: string; name: string }[];
}

export function PaymentsPageContent({ students }: PaymentsPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const now = new Date();
  const [month, setMonth] = useState(parseInt(searchParams.get("month") ?? String(now.getMonth() + 1)));
  const [year, setYear] = useState(parseInt(searchParams.get("year") ?? String(now.getFullYear())));
  const [studentFilter, setStudentFilter] = useState(searchParams.get("studentId") ?? "");
  const [statusFilter, setStatusFilter] = useState<"" | "UNPAID" | "PARTIAL" | "PAID">(
    (searchParams.get("status") as any) ?? "",
  );
  const [showDialog, setShowDialog] = useState(false);

  // Sync filters to URL
  useEffect(() => {
    const query = new URLSearchParams();
    query.set("month", month.toString());
    query.set("year", year.toString());
    if (studentFilter) query.set("studentId", studentFilter);
    if (statusFilter) query.set("status", statusFilter);
    router.replace(`?${query.toString()}`);
  }, [month, year, studentFilter, statusFilter, router]);

  const { data: payments, isLoading } = api.payment.getForMonth.useQuery({
    month,
    year,
    studentId: studentFilter || undefined,
    status: statusFilter || undefined,
  });

  // Calculate summary
  const summary = useMemo(() => {
    if (!payments) return { totalExpected: 0, totalReceived: 0, totalRemaining: 0 };
    return {
      totalExpected: payments.reduce((sum, p) => sum + p.expectedAmount, 0),
      totalReceived: payments.reduce((sum, p) => sum + p.receivedAmount, 0),
      totalRemaining: payments.reduce((sum, p) => sum + (p.expectedAmount - p.receivedAmount), 0),
    };
  }, [payments]);

  const handleAddPayment = () => {
    if (!studentFilter) {
      toast.error("Please select a student first");
      return;
    }
    setShowDialog(true);
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground mt-1 text-sm">Track student payments and outstanding dues</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-muted-foreground text-xs font-medium uppercase">Total Expected</p>
          <p className="text-2xl font-bold">${(summary.totalExpected / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-muted-foreground text-xs font-medium uppercase">Total Received</p>
          <p className="text-2xl font-bold text-green-600">${(summary.totalReceived / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-muted-foreground text-xs font-medium uppercase">Outstanding</p>
          <p className="text-2xl font-bold text-amber-600">${(summary.totalRemaining / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="min-w-40">
          <Label className="text-xs">Month</Label>
          <Select value={month.toString()} onValueChange={(val) => setMonth(parseInt(val))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {new Date(year, m - 1).toLocaleString("en", { month: "long" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-32">
          <Label className="text-xs">Year</Label>
          <Select value={year.toString()} onValueChange={(val) => setYear(parseInt(val))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-40">
          <Label className="text-xs">Student</Label>
          <Select value={studentFilter} onValueChange={setStudentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Students</SelectItem>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-40">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="UNPAID">Unpaid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={handleAddPayment}>+ Add Payment</Button>
        </div>
      </div>

      {/* Table */}
      <PaymentsTable
        payments={payments ?? []}
        isLoading={isLoading}
        month={month}
        year={year}
        students={students}
      />

      {/* Dialog */}
      <PaymentTransactionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        studentId={studentFilter}
        month={month}
        year={year}
        students={students}
      />
    </div>
  );
}
```

#### Table Component: `src/app/(root)/payments/_components/payments-table.tsx`

```typescript
"use client";

import { useMemo, useState } from "react";
import { ColumnDef, useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel } from "@tanstack/react-table";
import { api } from "@/trpc/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

interface PaymentsTableProps {
  payments: any[];
  isLoading: boolean;
  month: number;
  year: number;
  students: { id: string; name: string }[];
}

const statusColors: Record<string, string> = {
  UNPAID: "bg-rose-100 text-rose-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
};

export function PaymentsTable({ payments, isLoading, month, year }: PaymentsTableProps) {
  const utils = api.useUtils();
  const deleteTransaction = api.payment.deleteTransaction.useMutation({
    onSuccess: () => {
      void utils.payment.getForMonth.invalidate({ month, year });
    },
  });

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "student.name",
        header: "Student",
        cell: ({ row }) => row.original.student.name,
      },
      {
        accessorKey: "expectedAmount",
        header: "Expected",
        cell: ({ row }) => `$${(row.original.expectedAmount / 100).toFixed(2)}`,
      },
      {
        accessorKey: "receivedAmount",
        header: "Received",
        cell: ({ row }) => `$${(row.original.receivedAmount / 100).toFixed(2)}`,
      },
      {
        accessorKey: "remaining",
        header: "Remaining",
        cell: ({ row }) => {
          const remaining = row.original.expectedAmount - row.original.receivedAmount;
          return `$${(remaining / 100).toFixed(2)}`;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={`border-none ${statusColors[row.original.status]}`}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "paidAt",
        header: "Last Payment",
        cell: ({ row }) => (row.original.paidAt ? format(new Date(row.original.paidAt), "MMM d, yyyy") : "—"),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Show transaction history
              }}
            >
              View
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: payments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) return <div className="flex h-32 items-center justify-center">Loading...</div>;

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : header.column.columnDef.header}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {cell.renderCell()}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

#### Add Transaction Dialog: `src/app/(root)/payments/_components/payment-transaction-dialog.tsx`

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { toast } from "sonner";

const addPaymentSchema = z.object({
  amount: z.number().int().positive("Amount must be greater than 0"),
  method: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

type AddPaymentForm = z.infer<typeof addPaymentSchema>;

interface PaymentTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  month: number;
  year: number;
  students: { id: string; name: string }[];
}

export function PaymentTransactionDialog({
  open,
  onOpenChange,
  studentId,
  month,
  year,
  students,
}: PaymentTransactionDialogProps) {
  const utils = api.useUtils();
  const getOrCreate = api.payment.getOrCreateMonthRecord.useQuery(
    { studentId, month, year },
    { enabled: !!studentId },
  );

  const form = useForm<AddPaymentForm>({
    resolver: zodResolver(addPaymentSchema),
    defaultValues: { amount: 0, method: "", notes: "" },
  });

  const addTransaction = api.payment.addTransaction.useMutation({
    onMutate: () => {
      toast.success("Payment recorded!");
      onOpenChange(false);
    },
    onSuccess: () => {
      form.reset();
      void utils.payment.getForMonth.invalidate({ month, year });
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to record payment");
    },
  });

  const onSubmit = (data: AddPaymentForm) => {
    if (!getOrCreate.data?.id) {
      toast.error("Payment record not found");
      return;
    }

    // Convert amount from dollars to cents
    const amountCents = Math.round(data.amount * 100);

    addTransaction.mutate({
      paymentMonthId: getOrCreate.data.id,
      studentId,
      amount: amountCents,
      method: data.method,
      notes: data.notes,
    });
  };

  const studentName = students.find((s) => s.id === studentId)?.name || "Unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>

        {studentId && (
          <div className="mb-4 rounded-lg bg-blue-50 p-3">
            <p className="text-sm font-medium">{studentName}</p>
            <p className="text-xs text-muted-foreground">
              {month}/{year}
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Cash, Transfer, Cheque, etc." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Any additional notes..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addTransaction.isPending}>
                {addTransaction.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔗 Integration Points

### 1. Students Table - Add Payment Status Column

In `src/app/(root)/students/_components/students-table.tsx`, add a column:

```typescript
{
  accessorKey: "paymentStatus",
  header: "Payment Status (Current Month)",
  cell: ({ row }) => {
    const student = row.original;
    const payment = studentPayments?.[student.id];
    return payment ? (
      <Badge className={statusColors[payment.status]}>
        {payment.status}
      </Badge>
    ) : (
      <Badge variant="outline">—</Badge>
    );
  },
}
```

Fetch payment status for the current month alongside student list.

### 2. Dashboard - Unpaid Card

Add a new summary card to the dashboard showing unpaid/partial students:

```typescript
const { data: unpaidSummary } = api.payment.getUnpaidSummary.useQuery({
  month: currentMonth,
  year: currentYear,
});

// Card showing:
// - {unpaidCount} students with outstanding payments
// - ${totalOutstanding} total owed
```

### 3. Student Profile - Payment History

Add a new section in the student detail view:

```typescript
const { data: paymentHistory } = api.payment.getStudentHistory.useQuery({
  studentId,
  limit: 12,
});

// Timeline showing:
// - Monthly summary: Expected, Received, Status, Last Payment date
// - Expandable transaction list per month
```

### 4. Sidebar Navigation

Add a "Payments" link in the main navigation:

```typescript
{
  title: "Payments",
  url: "/payments",
  icon: CreditCard, // or wallet icon
}
```

---

## 📋 Implementation Phases

### Phase 1: Database & Migration

- [ ] Add `PaymentMonth` and `PaymentTransaction` models to `schema.prisma`
- [ ] Add `PaymentStatus` enum
- [ ] Add relations in `Teacher` and `Student` models
- [ ] Create migration: `prisma migrate dev --name add_payment_models`
- [ ] Verify Prisma client compiles

### Phase 2: Backend Router & Validation

- [ ] Create `src/server/api/routers/payment.ts` with all 7 procedures
- [ ] Add validation schemas to `api-schemas.ts`
- [ ] Register payment router in `root.ts`
- [ ] Test router with manual queries in test file
- [ ] Verify TypeScript types are generated correctly

### Phase 3: Shared Utilities

- [ ] Create `src/lib/payment.ts` with helper functions:
  - `derivePaymentStatus(expected, received)`
  - `calculateRemaining(expected, received)`
  - `formatPaymentAmount(cents, currency)`
- [ ] Add payment-specific formatting utilities

### Phase 4: Main UI - Payments Page

- [ ] Create `/payments` route structure
- [ ] Build `payments-page.tsx` container with filters and summary
- [ ] Build `payments-table.tsx` with TanStack React Table
- [ ] Build `payment-transaction-dialog.tsx` for add/edit
- [ ] Wire up tRPC queries and mutations
- [ ] Test month/year/student filter persistence to URL

### Phase 5: Integration Touchpoints

- [ ] Add payment status column to students table
- [ ] Add unpaid summary card to dashboard
- [ ] Add payment history section to student profile
- [ ] Add Payments link to sidebar navigation

### Phase 6: Verification & Polish

- [ ] Run full migration on dev database
- [ ] Test teacher isolation (query scoping)
- [ ] Test multi-transaction scenarios and deletion rollback
- [ ] Test status transitions: UNPAID → PARTIAL → PAID
- [ ] Validate all UI surfaces show consistent data
- [ ] Test overpayment handling (amount > expected)
- [ ] End-to-end test on production-like seeded data

---

## ✅ Verification Checklist

### Database

- [ ] Migration runs without errors
- [ ] Prisma client generates successfully
- [ ] New models appear in schema with correct cardinality

### Backend

- [ ] All router procedures query successfully
- [ ] Teacher scoping works (cannot access other teacher's payments)
- [ ] Status calculation is accurate for all branches
- [ ] Amount recalculation works after add/update/delete transaction

### Frontend

- [ ] Payments page loads and filters work
- [ ] Add payment dialog opens and saves correctly
- [ ] Payment status column in students table shows correct month context
- [ ] Dashboard unpaid card displays correct totals
- [ ] Student profile history timeline shows all past payments

### Data Consistency

- [ ] Expected amount recalculates when switching months (based on COMPLETE lessons only)
- [ ] Received amount is sum of all transactions
- [ ] Status is correctly derived from expected vs received
- [ ] paidAt is set when status becomes PAID, cleared if reverted

### Edge Cases

- [ ] Overpayment: received > expected → still marked PAID
- [ ] Deletion rollback: delete transaction, verify status recalculates
- [ ] Zero lessons: expected = 0, receiving payment still increments received
- [ ] Month boundary: switching months recalculates expected from correct lesson range

---

## 🏗️ Architecture Decisions

| Decision                              | Rationale                                                                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Two models (Month + Transaction)      | Allows querying aggregate monthly status _and_ ledger history. Normalized and performant.                                  |
| expectedAmount cached on PaymentMonth | Fast list-view queries without joining to lessons every time. Updated on manual refresh or transaction add.                |
| Money as INT                          | Avoids floating-point precision issues. Industry standard for financial systems.                                           |
| PaymentStatus enum                    | Strongly typed state machine; prevents invalid values. Derived automatically from expected/received calculation.           |
| Teacher scoping in every procedure    | Multi-tenant safety; prevents accidental cross-teacher visibility.                                                         |
| Timezone-aware month boundaries       | Consistent with existing lesson/report logic. Teachers in different timezones see their own calendar month, not UTC month. |
| Status locked to auto-calculation     | Ensures integrity. Override option deferred to Phase 2.                                                                    |

---

## 🚀 Future Enhancements

- **V1.1**: Payment method validation and reporting (CASH vs TRANSFER statistics)
- **V1.2**: Bulk payment recording (import CSV, batch-mark multiple students)
- **V1.3**: Payment reminders and notifications (email/SMS to teacher)
- **V1.4**: Invoice PDF generation per student-month
- **V2.0**: Student/parent portal payment tracking and status
- **V2.1**: Overpayment credit tracking and carryover to next month
- **V2.2**: Refund management and payment reversal audit trail

---

**Status**: Ready for Phase 1 implementation | **Owner**: Development Team | **Estimated Time**: 6-8 hours (all phases)
