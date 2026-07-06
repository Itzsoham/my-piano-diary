import * as React from "react";
import {
  flexRender,
  type Cell,
  type Header,
  type Row,
  type RowData,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DataTableBaseProps = {
  className?: string;
  viewportClassName?: string;
  surfaceClassName?: string;
  tableClassName?: string;
  headerClassName?: string;
};

type ClassNameValue<T> = string | ((value: T) => string);

type DataTableColumn<TData> = {
  id: string;
  header: React.ReactNode;
  cell: (row: TData) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: ClassNameValue<TData>;
};

type BasicDataTableProps<TData> = DataTableBaseProps & {
  columns: DataTableColumn<TData>[];
  data: TData[];
  getRowKey: (row: TData) => string;
  itemRowClassName?: ClassNameValue<TData>;
  emptyMessage?: string;
  emptyCellClassName?: string;
};

type TanstackDataTableProps<TData extends RowData> = DataTableBaseProps & {
  table: TanstackTable<TData>;
  emptyMessage?: string;
  tanstackRowClassName?: ClassNameValue<Row<TData>>;
  tanstackHeaderCellClassName?: ClassNameValue<Header<TData, unknown>>;
  tanstackCellClassName?: ClassNameValue<Cell<TData, unknown>>;
};

type DataTableProps<TData extends RowData> =
  | BasicDataTableProps<TData>
  | TanstackDataTableProps<TData>;

const resolveClassName = <T,>(
  value: ClassNameValue<T> | undefined,
  item: T,
) => {
  if (!value) {
    return undefined;
  }

  return typeof value === "function" ? value(item) : value;
};

function isTanstackDataTable<TData extends RowData>(
  props: DataTableProps<TData>,
): props is TanstackDataTableProps<TData> {
  return "table" in props;
}

function DataTableToolbar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    />
  );
}

type DataTableStateProps = React.ComponentProps<"div"> & {
  title: string;
  description?: string;
  icon?: React.ReactNode;
};

type TableViewMode = "table" | "grid";

/** Grid/table segmented toggle shared by list views. */
function DataTableViewToggle({
  value,
  onChange,
  className,
}: {
  value: TableViewMode;
  onChange: (mode: TableViewMode) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-muted/40 flex items-center gap-1 rounded-lg p-1",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("grid")}
        className={cn(
          "h-7 rounded-md px-2.5 transition-all",
          value === "grid"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="sr-only">Grid view</span>
        <LayoutGrid className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("table")}
        className={cn(
          "h-7 rounded-md px-2.5 transition-all",
          value === "table"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="sr-only">Table view</span>
        <TableIcon className="size-4" />
      </Button>
    </div>
  );
}

/** Standard "Showing X of Y" + first/prev/page/next/last footer for a table. */
function DataTablePagination<TData extends RowData>({
  table,
  totalCount,
  noun,
}: {
  table: TanstackTable<TData>;
  totalCount: number;
  noun: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground text-sm">
        Showing {table.getRowModel().rows.length} of {totalCount} {noun}(s)
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
  );
}

function DataTableState({
  className,
  title,
  description,
  icon,
  children,
  ...props
}: DataTableStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-pink-200 bg-white/70 py-12 text-center",
        className,
      )}
      {...props}
    >
      {icon ? <div className="mb-2 text-3xl">{icon}</div> : null}
      <p className="text-base font-medium text-pink-700">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-pink-600/80">{description}</p>
      ) : null}
      {children}
    </div>
  );
}

function DataTable<TData extends RowData>({
  className,
  viewportClassName,
  surfaceClassName,
  tableClassName,
  headerClassName,
  ...props
}: DataTableProps<TData>) {
  let content: React.ReactNode;

  if (isTanstackDataTable(props)) {
    const tanstackProps = props;

    content = (
      <Table className={tableClassName}>
        <TableHeader
          className={cn("sticky top-0 z-10 bg-rose-50/60", headerClassName)}
        >
          {tanstackProps.table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    "whitespace-nowrap",
                    resolveClassName(
                      tanstackProps.tanstackHeaderCellClassName,
                      header,
                    ),
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {tanstackProps.table.getRowModel().rows.length ? (
            tanstackProps.table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={resolveClassName(
                  tanstackProps.tanstackRowClassName,
                  row,
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "whitespace-nowrap",
                      resolveClassName(
                        tanstackProps.tanstackCellClassName,
                        cell,
                      ),
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={
                  tanstackProps.table.getVisibleLeafColumns().length || 1
                }
                className="h-24 text-center"
              >
                {tanstackProps.emptyMessage ?? "No results found."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  } else {
    const basicProps = props as BasicDataTableProps<TData>;

    content = (
      <Table className={tableClassName}>
        <TableHeader
          className={cn("sticky top-0 z-10 bg-rose-50/60", headerClassName)}
        >
          <TableRow>
            {basicProps.columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn("whitespace-nowrap", column.headerClassName)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {basicProps.data.length ? (
            basicProps.data.map((row) => (
              <TableRow
                key={basicProps.getRowKey(row)}
                className={resolveClassName(basicProps.itemRowClassName, row)}
              >
                {basicProps.columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      "whitespace-nowrap",
                      resolveClassName(column.cellClassName, row),
                    )}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={basicProps.columns.length || 1}
                className={cn(
                  "h-24 text-center",
                  basicProps.emptyCellClassName,
                )}
              >
                {basicProps.emptyMessage ?? "No results found."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "flex max-h-96 flex-col overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-md",
          viewportClassName,
        )}
      >
        <div className="flex-1 overflow-y-auto">
          <div className={cn("", surfaceClassName)}>{content}</div>
        </div>
      </div>
    </div>
  );
}

export type { DataTableColumn };
export {
  DataTable,
  DataTablePagination,
  DataTableState,
  DataTableToolbar,
  DataTableViewToggle,
};
