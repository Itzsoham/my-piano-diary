"use client";

import { useMemo } from "react";
import { CalendarRange } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  ALL_TIME_KEY,
  compareMonthScopeDesc,
  formatMonthScope,
  monthScopeKey,
  parseMonthScopeKey,
  sameMonthScope,
  type MonthScope,
} from "@/lib/month-scope";
import { cn } from "@/lib/utils";

export type MonthOption = MonthScope & {
  /** Lessons in that month — shown as a faint hint beside the label. */
  lessons?: number;
};

type MonthSelectProps = {
  /** `null` selects the all-time row, which only exists with `allTimeLabel`. */
  value: MonthScope | null;
  onChange: (scope: MonthScope | null) => void;
  /** Months worth offering. The current month and `value` are always added. */
  months: MonthOption[];
  /** The teacher's live month, marked "this month" and always listed. */
  currentMonth: MonthScope;
  /** Pass to add an all-time row on top; omit for a month-only picker. */
  allTimeLabel?: string;
  /** Faint hint after the label — e.g. `(n) => n + " lessons"`. */
  renderHint?: (option: MonthOption) => string | null;
  className?: string;
  ariaLabel?: string;
};

// The candy pill the Reports and Ranking filters use. SelectTrigger sets its
// own height through a `data-[size=default]:h-9` variant, so the override has
// to target that variant to win on specificity.
const TRIGGER_CLASS =
  "h-11 w-full min-w-0 rounded-full border-pink-200 bg-card px-4 text-sm font-medium shadow-(--sh-xs) focus-visible:ring-pink-400 data-[size=default]:h-11";

/**
 * One dropdown for "which month am I looking at". Shared by the dashboard and
 * the ranking board so the two never disagree about what a month is called or
 * which months exist.
 *
 * The option list is whatever the caller passes, merged with the current month
 * and the current selection — a URL pointing at a month the studio has no
 * lessons in still has to render its own value, otherwise the trigger goes
 * blank and the picker looks broken.
 */
export function MonthSelect({
  value,
  onChange,
  months,
  currentMonth,
  allTimeLabel,
  renderHint,
  className,
  ariaLabel = "Month",
}: MonthSelectProps) {
  const options = useMemo(() => {
    const merged = new Map<string, MonthOption>();

    for (const option of [
      ...months,
      currentMonth,
      ...(value ? [value] : []),
    ] as MonthOption[]) {
      const key = monthScopeKey(option);
      // First writer wins: a real option from the server carries its lesson
      // count, the fallbacks are bare scopes.
      if (!merged.has(key)) merged.set(key, option);
    }

    return [...merged.values()].sort(compareMonthScopeDesc);
  }, [months, currentMonth, value]);

  return (
    <Select
      value={value ? monthScopeKey(value) : ALL_TIME_KEY}
      onValueChange={(next) => onChange(parseMonthScopeKey(next))}
    >
      <SelectTrigger
        className={cn(TRIGGER_CLASS, className)}
        aria-label={ariaLabel}
      >
        <CalendarRange className="size-4 text-pink-500" aria-hidden="true" />
        {/* Rendered here rather than through <SelectValue>, which clones the
            selected row's children — the "this month" badge and the lesson
            hint belong in the open list, not squeezed into the trigger. */}
        <span className="min-w-0 flex-1 truncate text-left">
          {value ? formatMonthScope(value) : (allTimeLabel ?? "All time")}
        </span>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {allTimeLabel && (
          <SelectItem value={ALL_TIME_KEY}>{allTimeLabel}</SelectItem>
        )}
        {options.map((option) => {
          const isCurrent = sameMonthScope(option, currentMonth);
          const hint = renderHint?.(option);

          return (
            <SelectItem
              key={monthScopeKey(option)}
              value={monthScopeKey(option)}
            >
              <span className="flex w-full items-center gap-2">
                <span>{formatMonthScope(option)}</span>
                {isCurrent ? (
                  <span className="rounded-full bg-pink-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-pink-700 uppercase">
                    this month
                  </span>
                ) : (
                  hint && (
                    <span className="text-ink-soft text-[11px] tabular-nums">
                      {hint}
                    </span>
                  )
                )}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
