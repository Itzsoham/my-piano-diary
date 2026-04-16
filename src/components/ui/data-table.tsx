import * as React from "react";
import {
  flexRender,
  type Cell,
  type Header,
  type Row,
  type RowData,
  type Table as TanstackTable,
} from "@tanstack/react-table";

import { cn } from "@/lib/utils";
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
        <TableHeader className={cn("bg-rose-50/60", headerClassName)}>
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
        <TableHeader className={cn("bg-rose-50/60", headerClassName)}>
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
      <div className={viewportClassName}>
        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-md",
            surfaceClassName,
          )}
        >
          {content}
        </div>
      </div>
    </div>
  );
}

export type { DataTableColumn };
export { DataTable, DataTableState, DataTableToolbar };
