"use client";

import { createContext, useCallback, useContext, useMemo } from "react";

import {
  MONTH_NAMES,
  compareMonthScopeDesc,
  formatMonthScope,
  parseMonthScopeParams,
  sameMonthScope,
  type MonthScope,
} from "@/lib/month-scope";
import { useFilterParams } from "@/lib/use-filter-params";

type DashboardMonthContextValue = {
  /** Always a concrete month — the dashboard has no "all time" mode. */
  scope: MonthScope;
  /** The teacher's live month, as the server saw it when the page rendered. */
  currentMonth: MonthScope;
  isCurrentMonth: boolean;
  /**
   * A month that has not started. The picker never offers one, but a
   * hand-edited `?month=` can still land here, and "100% of December elapsed"
   * would be a lie.
   */
  isFuture: boolean;
  /** "August 2026" — for headings that need the year spelled out. */
  label: string;
  /** "August", or "August 2026" once the year stops being the obvious one. */
  shortLabel: string;
  /** Pass `null` (or the current month) to clear the filter from the URL. */
  setScope: (scope: MonthScope | null) => void;
};

const DashboardMonthContext = createContext<DashboardMonthContextValue | null>(
  null,
);

/**
 * Holds the dashboard's "which month am I looking at" selection.
 *
 * It lives in the URL (`?month=6&year=2026`) rather than in component state so
 * the choice is shareable and survives a refresh — and so the four sibling
 * boards (KPI tiles, ranking, insights, trend) read one value instead of
 * passing it down through a tree they don't otherwise share.
 *
 * `defaultMonth`/`defaultYear` come from the server so the first render agrees
 * with what was sent over the wire; the query string only ever overrides them.
 */
export function DashboardMonthProvider({
  defaultMonth,
  defaultYear,
  children,
}: {
  defaultMonth: number;
  defaultYear: number;
  children: React.ReactNode;
}) {
  const { searchParams, setParams } = useFilterParams();

  const currentMonth = useMemo(
    () => ({ month: defaultMonth, year: defaultYear }),
    [defaultMonth, defaultYear],
  );

  const scope =
    parseMonthScopeParams(
      searchParams.get("month"),
      searchParams.get("year"),
    ) ?? currentMonth;

  const setScope = useCallback(
    (next: MonthScope | null) => {
      // The live month is the default, so it belongs in a clean URL rather
      // than as an explicit filter the teacher then has to clear twice.
      if (!next || sameMonthScope(next, currentMonth)) {
        setParams({ month: null, year: null });
        return;
      }

      setParams({ month: String(next.month), year: String(next.year) });
    },
    [currentMonth, setParams],
  );

  const value = useMemo<DashboardMonthContextValue>(() => {
    const isCurrentMonth = sameMonthScope(scope, currentMonth);

    return {
      scope,
      currentMonth,
      isCurrentMonth,
      // Newest-first ordering: a negative result puts `scope` ahead of the
      // live month, so it has not happened yet.
      isFuture: compareMonthScopeDesc(scope, currentMonth) < 0,
      label: formatMonthScope(scope),
      shortLabel:
        scope.year === currentMonth.year
          ? (MONTH_NAMES[scope.month - 1] ?? formatMonthScope(scope))
          : formatMonthScope(scope),
      setScope,
    };
  }, [scope, currentMonth, setScope]);

  return (
    <DashboardMonthContext.Provider value={value}>
      {children}
    </DashboardMonthContext.Provider>
  );
}

export function useDashboardMonth() {
  const context = useContext(DashboardMonthContext);

  if (!context) {
    throw new Error(
      "useDashboardMonth must be used inside <DashboardMonthProvider>",
    );
  }

  return context;
}
