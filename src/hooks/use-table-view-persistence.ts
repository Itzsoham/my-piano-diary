"use client";

import * as React from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";

export type TableViewMode = "table" | "grid";

/**
 * Persists a list view's `viewMode` (grid/table) and `columnFilters` to
 * `sessionStorage` under `storageKey`, restoring them on mount. Extracted from
 * the students/pieces tables which each had an identical copy.
 */
export function useTableViewPersistence(storageKey: string) {
  const [viewMode, setViewMode] = React.useState<TableViewMode>("grid");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Restore on mount.
  React.useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          viewMode?: TableViewMode;
          columnFilters?: ColumnFiltersState;
        };
        // Restoring persisted UI state on mount legitimately needs setState in
        // an effect: sessionStorage isn't available during SSR, so a lazy
        // initializer would cause a hydration mismatch.
        /* eslint-disable react-hooks/set-state-in-effect */
        if (parsed.viewMode) setViewMode(parsed.viewMode);
        if (parsed.columnFilters) setColumnFilters(parsed.columnFilters);
        /* eslint-enable react-hooks/set-state-in-effect */
      } catch (e) {
        console.error("Failed to parse saved table view state", e);
      }
    }
    setIsLoaded(true);
  }, [storageKey]);

  // Persist on change (only after the initial restore, so we don't clobber it).
  React.useEffect(() => {
    if (!isLoaded) return;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ viewMode, columnFilters }),
    );
  }, [storageKey, viewMode, columnFilters, isLoaded]);

  return { viewMode, setViewMode, columnFilters, setColumnFilters, isLoaded };
}
