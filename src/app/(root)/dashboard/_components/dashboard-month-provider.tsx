"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  MONTH_NAMES,
  compareMonthScopeDesc,
  formatMonthScope,
  sameMonthScope,
  type MonthScope,
} from "@/lib/month-scope";

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
 * Scope lives in React state (instant updates) and is synced to the URL via
 * `window.history.replaceState` so the address bar and Back button stay
 * correct — without triggering any Next.js navigation or server re-render.
 *
 * The initial scope is passed as props by the server (page.tsx reads
 * `searchParams` and parses them) so this component does NOT call
 * `useSearchParams()`. That is the key change: without a `useSearchParams()`
 * subscription, this component has zero interaction with the Next.js router,
 * which was what caused the dropdown to freeze the entire page on open.
 */
export function DashboardMonthProvider({
  defaultMonth,
  defaultYear,
  initialMonth,
  initialYear,
  children,
}: {
  /** The teacher's live month — used as the "reset to current" target. */
  defaultMonth: number;
  defaultYear: number;
  /** The initial scope to display, pre-parsed from the server's searchParams. */
  initialMonth: number;
  initialYear: number;
  children: React.ReactNode;
}) {
  const currentMonth = useMemo(
    () => ({ month: defaultMonth, year: defaultYear }),
    [defaultMonth, defaultYear],
  );

  // Seed from the server-resolved initial scope (handles shared links).
  const [scope, setScope_] = useState<MonthScope>(() => ({
    month: initialMonth,
    year: initialYear,
  }));

  const setScope = useCallback(
    (next: MonthScope | null) => {
      // Resolve: null or "same as live" → current month (clean URL).
      const resolved =
        !next || sameMonthScope(next, currentMonth) ? currentMonth : next;

      // 1. Update reactive state immediately — zero server round-trips.
      setScope_(resolved);

      // 2. Sync the URL via the browser history API so the address bar and
      //    Back button stay correct, without triggering any Next.js navigation.
      const params = new URLSearchParams(window.location.search);
      if (sameMonthScope(resolved, currentMonth)) {
        params.delete("month");
        params.delete("year");
      } else {
        params.set("month", String(resolved.month));
        params.set("year", String(resolved.year));
      }
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        query
          ? `${window.location.pathname}?${query}`
          : window.location.pathname,
      );
    },
    [currentMonth],
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
