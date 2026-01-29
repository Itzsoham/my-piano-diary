"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  MoreHorizontal,
  Trash,
  LayoutGrid,
  Table as TableIcon,
  Music,
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
import { PieceSheet } from "./piece-sheet";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Piece = {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  createdAt: Date;
  _count: {
    lessons: number;
  };
};

interface PiecesTableProps {
  data: Piece[];
}

export function PiecesTable({ data }: PiecesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [showEditSheet, setShowEditSheet] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"table" | "grid">("grid");
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    id: string;
    title: string;
  } | null>(null);

  const utils = api.useUtils();
  const router = useRouter();
  const deletePiece = api.piece.delete.useMutation({
    onSuccess: () => {
      toast.success("Piece deleted successfully");
      void utils.piece.getAll.invalidate();
      router.refresh();
      setDeleteConfirm(null);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete piece");
    },
  });

  const handleDelete = (id: string, title: string) => {
    setDeleteConfirm({ id, title });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deletePiece.mutate({ id: deleteConfirm.id });
    }
  };

  const columns: ColumnDef<Piece>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
            <Music className="text-primary size-4" />
          </div>
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "level",
      header: "Level",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.level ?? "—"}
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
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1">
          {row.original.description ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
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
      id: "actions",
      cell: ({ row }) => {
        const piece = row.original;

        return (
          <>
            <PieceSheet
              mode="edit"
              pieceId={piece.id}
              open={showEditSheet === piece.id}
              onOpenChange={(open) => setShowEditSheet(open ? piece.id : null)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="size-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setShowEditSheet(piece.id)}>
                  <Edit className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handleDelete(piece.id, piece.title)}
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
          placeholder="Filter pieces..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <div className="bg-background flex items-center rounded-lg border p-1">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-7 px-2"
            >
              <TableIcon className="size-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-7 px-2"
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>
          <PieceSheet mode="create" />
        </div>
      </div>

      {viewMode === "table" ? (
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
                    No pieces found.
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
              const piece = row.original;
              return (
                <div
                  key={piece.id}
                  className="group bg-card relative overflow-hidden rounded-xl border p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="ring-primary/10 flex size-20 items-center justify-center rounded-full bg-linear-to-br from-purple-100 to-pink-100 ring-2">
                      <Music
                        className="size-10 text-purple-500"
                        strokeWidth={1.5}
                      />
                    </div>

                    <div className="w-full space-y-2 text-center">
                      <h3 className="text-lg leading-none font-semibold">
                        {piece.title}
                      </h3>
                      {piece.level && (
                        <p className="text-muted-foreground text-sm">
                          {piece.level}
                        </p>
                      )}
                    </div>

                    <div className="flex w-full items-center justify-center gap-4 pt-2">
                      <div className="text-center">
                        <div className="text-primary text-2xl font-bold">
                          {piece._count.lessons}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Lessons
                        </div>
                      </div>
                    </div>

                    {piece.description && (
                      <p className="text-muted-foreground line-clamp-2 w-full text-center text-xs">
                        {piece.description}
                      </p>
                    )}

                    <div className="text-muted-foreground text-xs">
                      Added{" "}
                      {new Date(piece.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  <div className="absolute top-2 right-2">
                    <PieceSheet
                      mode="edit"
                      pieceId={piece.id}
                      open={showEditSheet === piece.id}
                      onOpenChange={(open) =>
                        setShowEditSheet(open ? piece.id : null)
                      }
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => setShowEditSheet(piece.id)}
                        >
                          <Edit className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(piece.id, piece.title)}
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
              <p className="text-muted-foreground">No pieces found.</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          Showing {table.getRowModel().rows.length} of {data.length} piece(s)
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
        title="Delete Piece"
        description={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
        isLoading={deletePiece.isPending}
      />
    </div>
  );
}
