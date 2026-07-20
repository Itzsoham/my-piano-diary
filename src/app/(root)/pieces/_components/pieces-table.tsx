"use client";

import * as React from "react";
import { Edit, MoreHorizontal, Trash, Music, Search } from "lucide-react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
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
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  DataTableViewToggle,
} from "@/components/ui/data-table";
import { useTableViewPersistence } from "@/hooks/use-table-view-persistence";
import { Badge } from "@/components/ui/badge";
import { StarRating, difficultyScale } from "@/components/ui/star-rating";
import { Mochi } from "@/components/blossom/mochi";
import { PieceSheet } from "./piece-sheet";
import { api } from "@/trpc/react";
import { BirthdayBanner } from "@/components/birthday/birthday-banner";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// "Repertoire shelf" cover gradients, one per difficulty tier — the SAME 5
// tokens used everywhere else in Blossom Diary, never an invented hue.
const coverGradients: Record<number, string> = {
  1: "linear-gradient(135deg, color-mix(in srgb, var(--mint) 62%, var(--surface)), var(--floss))",
  2: "linear-gradient(135deg, color-mix(in srgb, var(--mint) 78%, var(--surface)), color-mix(in srgb, var(--cotton) 30%, var(--surface)))",
  3: "var(--grad-hero)",
  4: "linear-gradient(135deg, color-mix(in srgb, var(--cotton) 82%, var(--surface)), color-mix(in srgb, var(--mint) 34%, var(--surface)))",
  5: "linear-gradient(135deg, color-mix(in srgb, var(--bubblegum) 62%, var(--surface)), color-mix(in srgb, var(--cotton) 55%, var(--surface)))",
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
  const { viewMode, setViewMode, columnFilters, setColumnFilters } =
    useTableViewPersistence("pieces-list-view");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [showEditSheet, setShowEditSheet] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    id: string;
    title: string;
  } | null>(null);

  const utils = api.useUtils();
  const router = useRouter();
  const deletePiece = api.piece.delete.useMutation({
    onSuccess: () => {
      // Close only after the server confirms the delete.
      toast.success("Piece deleted successfully", { id: "piece-delete" });
      setDeleteConfirm(null);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete piece", {
        id: "piece-delete",
      });
    },
    onSettled: () => {
      void utils.piece.getAll.invalidate();
      router.refresh();
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
      <BirthdayBanner
        text="Every piece you teach lives on in your students 🎹"
        icon="🎹"
        storageKey="pieces"
      />
      <DataTableToolbar className="items-stretch">
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
          <DataTableViewToggle value={viewMode} onChange={setViewMode} />
          <PieceSheet mode="create" />
        </div>
      </DataTableToolbar>

      {viewMode === "table" ? (
        <DataTable
          className="-mx-4 sm:mx-0"
          viewportClassName="inline-block min-w-full align-middle"
          surfaceClassName="mx-4 sm:mx-0"
          table={table}
          emptyMessage="No pieces found."
          tanstackRowClassName="transition-colors hover:bg-pink-50"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, index) => {
              const piece = row.original;
              const difficulty = piece.difficulty ?? 1;
              const lessonCount = piece._count?.lessons ?? 0;
              const cover = coverGradients[difficulty] ?? coverGradients[1];

              return (
                <div
                  key={piece.id}
                  className="rise border-border bg-card flex min-w-0 flex-col overflow-hidden rounded-[1.6rem] border shadow-(--sh-sm)"
                  style={{ "--i": index } as React.CSSProperties}
                >
                  {/* Cover — a piano-key strip over a difficulty-tinted wash.
                      Not a link (there's no piece-detail route), so it never
                      lifts or blooms a shadow on hover — the ⋯ menu is the
                      only affordance this card actually offers. */}
                  <div
                    className="relative h-21 shrink-0 overflow-hidden"
                    style={{ backgroundImage: cover }}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-3.5"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(90deg, transparent 0 10px, var(--ink) 10px 18px, transparent 18px 24px, var(--ink) 24px 32px, transparent 32px 52px, var(--ink) 52px 60px, transparent 60px 66px, var(--ink) 66px 74px, transparent 74px 80px, var(--ink) 80px 88px, transparent 88px 98px)",
                        backgroundRepeat: "repeat-x",
                        opacity: 0.55,
                      }}
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-ink min-w-0 truncate text-[15.5px] font-bold tracking-tight">
                        {piece.title}
                      </h3>
                      <div className="flex shrink-0 items-center">
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
                              className="size-8 rounded-full hover:bg-[var(--surface-2)]"
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
                              onClick={() =>
                                handleDelete(piece.id, piece.title)
                              }
                            >
                              <Trash className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <StarRating value={difficulty} readOnly size="sm" />
                      <span className="text-ink-soft text-[11px] font-semibold tabular-nums">
                        {difficultyScale[difficulty]?.title ?? "Very Easy"}
                      </span>
                    </div>

                    {piece.description ? (
                      <p className="text-ink-soft line-clamp-2 min-h-9 text-[12.5px] leading-relaxed italic">
                        &ldquo;{piece.description}&rdquo;
                      </p>
                    ) : (
                      <p className="text-ink-soft flex min-h-9 items-center gap-1.5 text-[12.5px] italic">
                        No teaching notes yet
                      </p>
                    )}

                    <div className="border-border text-ink-soft mt-auto flex items-center gap-1.5 border-t border-dashed pt-3 text-xs font-semibold tabular-nums">
                      <Music className="size-3.5 shrink-0" aria-hidden="true" />
                      {lessonCount === 0 ? (
                        <span>Not yet played in a lesson</span>
                      ) : (
                        <span>
                          Played in <b className="text-ink">{lessonCount}</b>{" "}
                          {lessonCount === 1 ? "lesson" : "lessons"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="border-bubblegum col-span-full flex flex-col items-center justify-center gap-2 rounded-[1.6rem] border-2 border-dashed bg-[color-mix(in_srgb,var(--surface)_76%,transparent)] px-6 py-11 text-center">
              <Mochi mood="sleepy" size={104} />
              <p className="text-ink mt-1 text-[0.95rem] font-semibold">
                No pieces found
              </p>
              <p className="text-ink-soft text-sm">
                Try a different search, or add your first piece.
              </p>
            </div>
          )}
        </div>
      )}

      <DataTablePagination
        table={table}
        totalCount={data.length}
        noun="piece"
      />

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
