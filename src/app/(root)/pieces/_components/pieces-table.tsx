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
  Search,
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
import { StarRating } from "@/components/ui/star-rating";
import { PieceSheet } from "./piece-sheet";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const difficultyCardStyles: Record<
  number,
  {
    border: string;
    ring: string;
    background: string;
    text: string;
    shadow: string;
    hoverShadow: string;
  }
> = {
  1: {
    border: "border-rose-300",
    ring: "ring-rose-300",
    background: "bg-rose-50",
    text: "text-rose-300",
    shadow: "shadow-[0_10px_24px_-18px_rgba(253,164,175,0.55)]",
    hoverShadow: "hover:shadow-[0_14px_28px_-18px_rgba(253,164,175,0.6)]",
  },
  2: {
    border: "border-orange-300",
    ring: "ring-orange-300",
    background: "bg-orange-50",
    text: "text-orange-300",
    shadow: "shadow-[0_10px_24px_-18px_rgba(253,186,116,0.55)]",
    hoverShadow: "hover:shadow-[0_14px_28px_-18px_rgba(253,186,116,0.6)]",
  },
  3: {
    border: "border-violet-300",
    ring: "ring-violet-300",
    background: "bg-violet-50",
    text: "text-violet-300",
    shadow: "shadow-[0_10px_24px_-18px_rgba(196,181,253,0.55)]",
    hoverShadow: "hover:shadow-[0_14px_28px_-18px_rgba(196,181,253,0.6)]",
  },
  4: {
    border: "border-pink-400",
    ring: "ring-pink-400",
    background: "bg-pink-50",
    text: "text-pink-400",
    shadow: "shadow-[0_10px_24px_-18px_rgba(244,114,182,0.55)]",
    hoverShadow: "hover:shadow-[0_14px_28px_-18px_rgba(244,114,182,0.6)]",
  },
  5: {
    border: "border-fuchsia-500",
    ring: "ring-fuchsia-500",
    background: "bg-fuchsia-100",
    text: "text-fuchsia-500",
    shadow: "shadow-[0_10px_24px_-18px_rgba(217,70,239,0.55)]",
    hoverShadow: "hover:shadow-[0_14px_28px_-18px_rgba(217,70,239,0.6)]",
  },
};

type Piece = {
  id: string;
  title: string;
  description: string | null;
  difficulty: number | null;
  createdAt: Date;
  _count?: {
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
      accessorKey: "difficulty",
      header: "Difficulty",
      cell: ({ row }) => (
        <div className="flex items-center">
          <StarRating value={row.original.difficulty ?? 1} readOnly size="md" />
        </div>
      ),
    },
    {
      accessorKey: "_count.lessons",
      header: "Lessons",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original._count?.lessons ?? 0}</Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-muted-foreground block max-w-60 truncate font-light">
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
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Filter pieces..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            className="bg-card w-full rounded-2xl pl-9"
          />
        </div>
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
          <PieceSheet mode="create" />
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="mx-4 overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-md sm:mx-0">
              <Table>
                <TableHeader className="bg-rose-50/60">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            key={header.id}
                            className="whitespace-nowrap"
                          >
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
                          <TableCell
                            key={cell.id}
                            className="whitespace-nowrap"
                          >
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
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const piece = row.original;
              const difficulty = piece.difficulty ?? 1;
              const fallbackCardStyle = difficultyCardStyles[1]!;
              const cardStyle =
                difficultyCardStyles[difficulty] ?? fallbackCardStyle;
              return (
                <div
                  key={piece.id}
                  className={cn(
                    "group bg-card relative overflow-hidden rounded-2xl border p-6 transition-all hover:-translate-y-1",
                    cardStyle.shadow,
                    cardStyle.hoverShadow,
                  )}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "mb-5 flex size-24 items-center justify-center rounded-full ring-1 transition-all",
                        cardStyle.background,
                        cardStyle.ring,
                      )}
                    >
                      <Music
                        className={cn(
                          "size-10 transition-transform duration-300 group-hover:scale-110",
                          cardStyle.text,
                        )}
                        strokeWidth={1.5}
                      />
                    </div>

                    <h3 className="text-foreground mb-1 text-xl font-bold tracking-tight">
                      {piece.title}
                    </h3>

                    <div className="mt-2 mb-4 flex flex-col items-center gap-1">
                      <StarRating
                        value={piece.difficulty ?? 1}
                        readOnly
                        size="md"
                      />
                    </div>

                    <p className="text-muted-foreground/60 mb-4 text-xs font-medium">
                      {(piece._count?.lessons ?? 0) === 0
                        ? "Not yet played in lessons"
                        : `Played in ${piece._count?.lessons ?? 0} ${(piece._count?.lessons ?? 0) === 1 ? "lesson" : "lessons"}`}
                    </p>

                    {piece.description && (
                      <div className="w-full">
                        <p className="text-muted-foreground/50 mb-1 text-xs font-medium">
                          Teaching notes
                        </p>
                        <p className="text-muted-foreground/80 line-clamp-2 text-sm leading-relaxed font-light italic">
                          &ldquo;{piece.description}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
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
