"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  FileText,
  MoreHorizontal,
  Trash,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StudentSheet } from "./student-sheet";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Student = {
  id: string;
  name: string;
  avatar: string | null;
  notes: string | null;
  createdAt: Date;
  teacher: {
    id: string;
    user: {
      name: string | null;
      email: string | null;
    };
  };
  _count: {
    lessons: number;
  };
};

interface StudentsTableProps {
  data: Student[];
}

export function StudentsTable({ data }: StudentsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const reportYear =
    currentMonth === 1 ? now.getFullYear() - 1 : now.getFullYear();

  const reportLink = React.useCallback(
    (studentId: string) =>
      `/reports?studentId=${studentId}&month=${lastMonth}&year=${reportYear}`,
    [lastMonth, reportYear],
  );
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [showEditSheet, setShowEditSheet] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"table" | "grid">("grid");
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  const utils = api.useUtils();
  const router = useRouter();
  const deleteStudent = api.student.delete.useMutation({
    onSuccess: () => {
      toast.success("Student deleted successfully");
      void utils.student.getAll.invalidate();
      router.refresh();
      setDeleteConfirm(null);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete student");
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

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.avatar ? (
            <Image
              src={row.original.avatar}
              alt={row.original.name}
              width={32}
              height={32}
              className="size-8 rounded-full object-cover"
            />
          ) : (
            <div className="bg-primary/10 flex size-8 items-center justify-center rounded-full">
              <span className="text-primary text-sm font-medium">
                {row.original.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "teacher.user.name",
      header: "Teacher",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.teacher.user.name ?? row.original.teacher.user.email}
        </span>
      ),
    },
    {
      accessorKey: "_count.lessons",
      header: "Lessons",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original._count.lessons}</Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <span className="text-muted-foreground block max-w-60 truncate font-light">
          {row.original.notes ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const student = row.original;

        return (
          <>
            <StudentSheet
              mode="edit"
              studentId={student.id}
              open={showEditSheet === student.id}
              onOpenChange={(open) =>
                setShowEditSheet(open ? student.id : null)
              }
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="size-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setShowEditSheet(student.id)}>
                  <Edit className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={reportLink(student.id)}>
                    <FileText className="mr-2 size-4" />
                    View Reports
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handleDelete(student.id, student.name)}
                >
                  <Trash className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter students..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <div className="bg-muted/40 flex items-center gap-1 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`h-7 rounded-md px-2.5 transition-all ${viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={`h-7 rounded-md px-2.5 transition-all ${viewMode === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <TableIcon className="size-4" />
            </Button>
          </div>
          <StudentSheet mode="create" />
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-md">
          <Table>
            <TableHeader className="bg-rose-50/60">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="transition-colors hover:bg-pink-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const student = row.original;
              return (
                <div
                  key={student.id}
                  className="group bg-card relative overflow-hidden rounded-2xl border p-6 shadow-[0_10px_24px_-18px_rgba(244,114,182,0.55)] transition-all hover:-translate-y-1 hover:shadow-[0_14px_28px_-18px_rgba(244,114,182,0.6)]"
                >
                  <div className="flex flex-col items-center text-center">
                    {student.avatar ? (
                      <div className="mb-5 flex size-24 items-center justify-center rounded-full bg-linear-to-br from-rose-500/10 to-pink-500/10 ring-1 ring-rose-500/20 transition-all group-hover:from-rose-500/20 group-hover:to-pink-500/20 group-hover:ring-rose-500/30">
                        <Image
                          src={student.avatar}
                          alt={student.name}
                          width={96}
                          height={96}
                          className="size-20 rounded-full object-cover shadow-sm transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="mb-5 flex size-24 items-center justify-center rounded-full bg-linear-to-br from-rose-500/10 to-pink-500/10 ring-1 ring-rose-500/20 transition-all group-hover:from-rose-500/20 group-hover:to-pink-500/20 group-hover:ring-rose-500/30">
                        <span className="text-3xl font-bold text-rose-500/80 transition-transform duration-300 group-hover:scale-110">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <h3 className="text-foreground mb-1 text-xl font-bold tracking-tight">
                      {student.name}
                    </h3>

                    <p className="text-muted-foreground/60 mb-4 text-xs font-medium">
                      Teacher:{" "}
                      {student.teacher.user.name ?? student.teacher.user.email}
                    </p>

                    <div className="bg-primary/5 text-primary/70 border-primary/10 mb-4 inline-flex rounded-full border px-3 py-1 text-xs font-medium">
                      {student._count.lessons} lessons recorded
                    </div>

                    {student.notes && (
                      <p className="text-muted-foreground/80 line-clamp-2 text-sm leading-relaxed font-light italic">
                        &ldquo;{student.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <StudentSheet
                      mode="edit"
                      studentId={student.id}
                      open={showEditSheet === student.id}
                      onOpenChange={(open) =>
                        setShowEditSheet(open ? student.id : null)
                      }
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-background/80 size-8 rounded-full"
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => setShowEditSheet(student.id)}
                        >
                          <Edit className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={reportLink(student.id)}>
                            <FileText className="mr-2 size-4" />
                            View Reports
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(student.id, student.name)}
                        >
                          <Trash className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full flex h-48 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">No students found.</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          Showing {table.getRowModel().rows.length} of {data.length} student(s)
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-1 text-sm">
            <span>Page</span>
            <span className="font-medium">
              {table.getState().pagination.pageIndex + 1}
            </span>
            <span>of</span>
            <span className="font-medium">{table.getPageCount()}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>

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
