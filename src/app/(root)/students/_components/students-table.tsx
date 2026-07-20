"use client";

import * as React from "react";
import {
  Edit,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Trash,
  WalletCards,
} from "lucide-react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "@/components/ui/data-table";
import { useTableViewPersistence } from "@/hooks/use-table-view-persistence";
import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { StudentSheet } from "./student-sheet";
import Link from "next/link";
import { BirthdayBanner } from "@/components/birthday/birthday-banner";
import { api } from "@/trpc/react";
import { useCurrency, type CurrencyCode } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Student = {
  id: string;
  name: string;
  avatar: string | null;
  notes: string | null;
  lessonRate: number;
  onlineLessonRate: number;
  _count: {
    lessons: number;
  };
};

type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

interface StudentsTableProps {
  data: Student[];
}

// Cycle the three Blossom Diary avatar fills so neighbouring cards read as
// distinct blooms in the garden. Keyed off the student id (not render index)
// so a student's colour never shifts as pages/filters change.
const AVATAR_TONES = [
  "bg-linear-to-br from-bubblegum to-wintergreen",
  "bg-linear-to-br from-mint to-wintergreen",
  "bg-linear-to-br from-cotton to-bubblegum",
] as const;

function avatarTone(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
}

// Vietnamese names carry the family name first, so "Nguyễn Minh Anh" reads
// as "MA" (the given name) rather than "NM". Two-part Western names land on
// the same rule: "Emma Thompson" -> last two parts -> "ET".
function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/** Payment status for the current month — sober data, not ornament. */
function PaymentStatusChip({ status }: { status?: PaymentStatus }) {
  if (!status) {
    return (
      <Badge variant="outline" className="text-ink-soft shrink-0">
        No payment yet
      </Badge>
    );
  }
  if (status === "PAID") {
    return (
      <Badge className="bg-ok-bg text-ok-fg shrink-0 border-transparent">
        Paid
      </Badge>
    );
  }
  if (status === "PARTIAL") {
    return (
      <Badge className="bg-wait-bg text-wait-fg shrink-0 border-transparent">
        Partial
      </Badge>
    );
  }
  return (
    <Badge className="bg-no-bg text-no-fg shrink-0 border-transparent">
      Unpaid
    </Badge>
  );
}

interface StudentCardProps {
  student: Student;
  index: number;
  currency: CurrencyCode;
  paymentStatus?: PaymentStatus;
  reportHref: string;
  paymentHref: string;
  editOpen: boolean;
  onEditOpenChange: (open: boolean) => void;
  onEditRequest: () => void;
  onDeleteRequest: () => void;
}

/** One card in the "garden". Ornament (strip wash + corner blossom) frames
 * the card; the rate figures inside stay sober, tabular, undecorated. */
function StudentCard({
  student,
  index,
  currency,
  paymentStatus,
  reportHref,
  paymentHref,
  editOpen,
  onEditOpenChange,
  onEditRequest,
  onDeleteRequest,
}: StudentCardProps) {
  const lessonCount = student._count.lessons;

  return (
    <Card
      style={{ "--i": index } as React.CSSProperties}
      className="rise relative flex flex-col gap-0 overflow-hidden rounded-4xl border-pink-100/80 p-0 shadow-(--sh) transition-all duration-300 hover:-translate-y-1 hover:shadow-(--sh-lg)"
    >
      {/* header strip — decorative gradient wash + corner blossom watermark */}
      <div className="hero-band relative h-14 shrink-0" aria-hidden="true">
        <Blossom
          size={64}
          className="text-bubblegum/40 absolute -top-3 right-2"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-5">
        <Avatar
          aria-hidden="true"
          className="border-card relative z-10 -mt-7 size-16 border-4 shadow-sm"
        >
          <AvatarImage src={student.avatar ?? undefined} alt="" />
          <AvatarFallback
            className={cn(
              "text-mint-ink text-base font-bold",
              avatarTone(student.id),
            )}
          >
            {getInitials(student.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-ink truncate text-base font-semibold">
              {student.name}
            </h3>
            <Badge className="mt-1.5 border-transparent bg-teal-100 text-teal-700 tabular-nums">
              {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
            </Badge>
          </div>
          <PaymentStatusChip status={paymentStatus} />
        </div>

        {/* THE TWO REAL RATES — tabular-nums, undecorated. */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-sm border border-pink-200/70 bg-pink-50 px-3 py-2">
            <span className="text-ink-soft block text-[10px] font-semibold tracking-[0.06em] uppercase">
              In-person
            </span>
            <b className="text-ink mt-0.5 block truncate text-sm font-bold tabular-nums">
              {formatCurrency(student.lessonRate, currency)}
            </b>
          </div>
          <div className="bg-muted rounded-sm border border-transparent px-3 py-2">
            <span className="text-ink-soft block text-[10px] font-semibold tracking-[0.06em] uppercase">
              Online
            </span>
            <b className="text-ink mt-0.5 block truncate text-sm font-bold tabular-nums">
              {formatCurrency(student.onlineLessonRate, currency)}
            </b>
          </div>
        </div>

        {student.notes ? (
          <p className="text-ink-soft line-clamp-2 min-h-[2.5em] text-[13px] leading-snug">
            {student.notes}
          </p>
        ) : null}

        <div className="border-border mt-auto flex items-center gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-full"
            asChild
          >
            <Link href={reportHref}>
              <FileText className="size-3.5" />
              Reports
            </Link>
          </Button>

          <StudentSheet
            mode="edit"
            studentId={student.id}
            open={editOpen}
            onOpenChange={onEditOpenChange}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                aria-label={`Open menu for ${student.name}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEditRequest}>
                <Edit className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={paymentHref}>
                  <WalletCards className="mr-2 size-4" />
                  View Payments
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDeleteRequest}>
                <Trash className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

export function StudentsTable({ data }: StudentsTableProps) {
  const { columnFilters, setColumnFilters } =
    useTableViewPersistence("students-list-view");
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const reportYear =
    currentMonth === 1 ? now.getFullYear() - 1 : now.getFullYear();
  const currentYear = now.getFullYear();
  const { currency } = useCurrency();

  const reportLink = React.useCallback(
    (studentId: string) =>
      `/reports/${studentId}?month=${lastMonth}&year=${reportYear}`,
    [lastMonth, reportYear],
  );
  const paymentLink = React.useCallback(
    (studentId: string) =>
      `/payments?studentId=${studentId}&month=${currentMonth}&year=${currentYear}`,
    [currentMonth, currentYear],
  );

  // Search text piggybacks on the same sessionStorage-persisted
  // ColumnFiltersState shape the table used before, so previously saved
  // state (and the shared hook, also used by the pieces list) keeps working.
  const nameFilter = React.useMemo(() => {
    const entry = columnFilters.find((filter) => filter.id === "name");
    return typeof entry?.value === "string" ? entry.value : "";
  }, [columnFilters]);
  const setNameFilter = React.useCallback(
    (value: string) => {
      setColumnFilters(value ? [{ id: "name", value }] : []);
    },
    [setColumnFilters],
  );

  const filteredStudents = React.useMemo(() => {
    const query = nameFilter.trim().toLowerCase();
    if (!query) return data;
    return data.filter((student) => student.name.toLowerCase().includes(query));
  }, [data, nameFilter]);

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Mirror tanstack's default autoResetPageIndex behaviour: a new search
  // always lands back on page 1.
  React.useEffect(() => {
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, [nameFilter]);

  const columns = React.useMemo<ColumnDef<Student>[]>(
    () => [{ id: "student", accessorKey: "id" }],
    [],
  );

  const table = useReactTable({
    data: filteredStudents,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const pageStudents = table.getRowModel().rows.map((row) => row.original);

  const [showEditSheet, setShowEditSheet] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  const utils = api.useUtils();
  const router = useRouter();
  const { data: paymentRows = [] } = api.payment.getForMonth.useQuery({
    month: currentMonth,
    year: currentYear,
  });

  const paymentStatusByStudent = React.useMemo(
    () =>
      new Map(
        paymentRows.map((payment) => [payment.studentId, payment.status]),
      ),
    [paymentRows],
  );
  const deleteStudent = api.student.delete.useMutation({
    onSuccess: () => {
      // Close only after the server confirms the delete, so a failed delete
      // leaves the confirm dialog open rather than silently vanishing.
      toast.success("Student deleted successfully", { id: "student-delete" });
      setDeleteConfirm(null);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete student", {
        id: "student-delete",
      });
    },
    onSettled: () => {
      void utils.student.getAll.invalidate();
      router.refresh();
    },
  });

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteStudent.mutate({ id: deleteConfirm.id });
    }
  };

  const addStudentTrigger = (
    <Button className="bday-animate-button h-11 shrink-0 rounded-full px-5 shadow-(--sh-pink)">
      <Plus className="size-4" />
      Add student
    </Button>
  );

  let content: React.ReactNode;
  if (data.length === 0) {
    content = (
      <div
        className="rise border-bubblegum/60 bg-card/70 flex flex-col items-center gap-3 rounded-4xl border-2 border-dashed px-6 py-14 text-center"
        style={{ "--i": 4 } as React.CSSProperties}
      >
        <Mochi mood="sleepy" size={132} />
        <p className="text-ink font-serif text-lg">No students yet</p>
        <p className="text-ink-soft max-w-sm text-sm">
          Add your first student and the garden starts growing — set their
          in-person and online rates, and every lesson you mark complete will
          fill this month&apos;s sheet.
        </p>
        <StudentSheet mode="create" trigger={addStudentTrigger} />
      </div>
    );
  } else if (filteredStudents.length === 0) {
    content = (
      <div
        className="rise border-border bg-card/60 rounded-4xl border-2 border-dashed px-6 py-12 text-center"
        style={{ "--i": 4 } as React.CSSProperties}
      >
        <p className="text-ink-soft text-sm">
          No students match &ldquo;{nameFilter}&rdquo; — try another name.
        </p>
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {pageStudents.map((student, index) => (
          <StudentCard
            key={student.id}
            student={student}
            index={index}
            currency={currency}
            paymentStatus={paymentStatusByStudent.get(student.id)}
            reportHref={reportLink(student.id)}
            paymentHref={paymentLink(student.id)}
            editOpen={showEditSheet === student.id}
            onEditOpenChange={(open) =>
              setShowEditSheet(open ? student.id : null)
            }
            onEditRequest={() => setShowEditSheet(student.id)}
            onDeleteRequest={() => handleDelete(student.id, student.name)}
          />
        ))}

        <StudentSheet
          mode="create"
          trigger={
            <button
              type="button"
              className="bday-animate-button border-bubblegum/70 flex min-h-60 flex-col items-center justify-center gap-2 rounded-4xl border-2 border-dashed p-6 text-center text-pink-700 transition-all hover:-translate-y-1 hover:bg-pink-50"
            >
              <span className="grid size-12 place-items-center rounded-full bg-pink-100 text-pink-700">
                <Plus className="size-6" aria-hidden="true" />
              </span>
              <b className="text-sm font-bold">Add student</b>
              <span className="text-ink-soft max-w-[22ch] text-xs">
                A new face for the garden
              </span>
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BirthdayBanner
        text="Your students are lucky to have you 💖"
        icon="💖"
        storageKey="students"
      />

      {/* Filter bar — rounded, pink-tinted, matches the app's filter-bar look. */}
      <div className="bg-card/80 flex flex-col gap-3 rounded-3xl border border-pink-100 p-3 shadow-(--sh-xs) sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            aria-hidden="true"
            className="text-ink-soft pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
          />
          <label htmlFor="student-search" className="sr-only">
            Filter students
          </label>
          <Input
            id="student-search"
            type="search"
            autoComplete="off"
            placeholder="Filter students…"
            value={nameFilter}
            onChange={(event) => setNameFilter(event.target.value)}
            className="h-11 w-full rounded-full pl-10"
          />
        </div>
        <StudentSheet mode="create" trigger={addStudentTrigger} />
      </div>

      {content}

      <DataTablePagination
        table={table}
        totalCount={data.length}
        noun="student"
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Student"
        description={`Are you sure you want to delete ${deleteConfirm?.name}? This action cannot be undone and will remove all associated lessons and data.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
        isLoading={deleteStudent.isPending}
      />
    </div>
  );
}
