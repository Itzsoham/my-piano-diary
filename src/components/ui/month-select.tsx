"use client";

import { useCallback, useId, useMemo } from "react";
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
  const diagnosticId = useId();
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

  const logOpenState = useCallback(
    (open: boolean) => {
      // This picker is rendered in a Radix portal, outside the dashboard's
      // layout tree. Keep diagnostics development-only, but make a report
      // detailed enough to distinguish clipping from a position/stack issue.
      if (process.env.NODE_ENV !== "development") return;

      console.debug("[MonthSelect] state changed", {
        ariaLabel,
        open,
        value: value ? monthScopeKey(value) : ALL_TIME_KEY,
        optionCount: options.length,
      });

      if (!open) return;

      requestAnimationFrame(() => {
        const content = Array.from(
          document.querySelectorAll<HTMLElement>("[data-month-select-content]"),
        ).find((element) => element.dataset.monthSelectContent === diagnosticId);

        if (!content) {
          console.warn("[MonthSelect] open, but no menu element was mounted", {
            ariaLabel,
            diagnosticId,
          });
          return;
        }

        const styles = window.getComputedStyle(content);
        const rect = content.getBoundingClientRect();
        const point = document.elementFromPoint(
          Math.max(0, Math.min(window.innerWidth - 1, rect.left + rect.width / 2)),
          Math.max(0, Math.min(window.innerHeight - 1, rect.top + rect.height / 2)),
        );

        console.debug("[MonthSelect] open-menu diagnostics", {
          ariaLabel,
          diagnosticId,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          rect: {
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          computed: {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            position: styles.position,
            zIndex: styles.zIndex,
            transform: styles.transform,
            overflowY: styles.overflowY,
          },
          inViewport:
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < window.innerHeight &&
            rect.left < window.innerWidth,
          topElement: point
            ? {
                tag: point.tagName,
                slot: point.getAttribute("data-slot"),
                className: point.className,
              }
            : null,
        });
      });
    },
    [ariaLabel, diagnosticId, options.length, value],
  );

  return (
    <Select
      value={value ? monthScopeKey(value) : ALL_TIME_KEY}
      onValueChange={(next) => onChange(parseMonthScopeKey(next))}
      onOpenChange={logOpenState}
    >
      <SelectTrigger
        className={cn(TRIGGER_CLASS, className)}
        aria-label={ariaLabel}
        data-month-select-trigger={diagnosticId}
      >
        <CalendarRange className="size-4 text-pink-500" aria-hidden="true" />
        {/* Rendered here rather than through <SelectValue>, which clones the
            selected row's children — the "this month" badge and the lesson
            hint belong in the open list, not squeezed into the trigger. */}
        <span className="min-w-0 flex-1 truncate text-left">
          {value ? formatMonthScope(value) : (allTimeLabel ?? "All time")}
        </span>
      </SelectTrigger>
      {/*
        `item-aligned` (Radix's default) calculates an absolute page position.
        The dashboard scrolls inside the app shell, so that calculation can
        place the portalled menu below the visible viewport. Popper anchors to
        the trigger and applies viewport collision handling instead.
      */}
      <SelectContent
        position="popper"
        side="bottom"
        align="end"
        className="max-h-72"
        data-month-select-content={diagnosticId}
      >
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
