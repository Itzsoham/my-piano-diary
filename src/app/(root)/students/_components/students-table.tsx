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
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [showEditSheet, setShowEditSheet] = React.useState<string | null>(null);

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
        <span className="text-muted-foreground line-clamp-1">
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
                  <Link href={`/students/${student.id}/reports`}>
                    <FileText className="mr-2 size-4" />
                    View Reports
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    // TODO: Implement delete functionality
                    console.log("Delete student:", student.id);
                  }}
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
        <StudentSheet mode="create" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
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
    </div>
  );
}
