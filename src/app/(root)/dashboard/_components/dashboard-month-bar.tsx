"use client";

import { RotateCcw } from "lucide-react";

import { Blossom } from "@/components/blossom/blossom";
import { Button } from "@/components/ui/button";
import { MonthSelect } from "@/components/ui/month-select";
import { api } from "@/trpc/react";

import { useDashboardMonth } from "./dashboard-month-provider";

/**
 * The dashboard's single month control. Everything month-shaped below it —
 * the four KPI tiles, the ranking, quick insights and the earnings trend —
 * follows this dropdown; the today's-lessons card keeps its own day picker,
 * because "today" is a day, not a month, and the note below says so when the
 * teacher has travelled back.
 */
export function DashboardMonthBar() {
  const { scope, currentMonth, isCurrentMonth, label, setScope } =
    useDashboardMonth();

  const { data: months = [] } = api.earnings.getActivityMonths.useQuery();

  return (
    <div className="px-4 lg:px-6">
      <div
        className="rise flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-[calc(var(--radius)+4px)] border border-pink-100 bg-[linear-gradient(160deg,var(--pink-50),var(--surface)_75%)] p-3 shadow-(--sh-sm) sm:p-4"
        style={{ "--i": 0 } as React.CSSProperties}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-pink-700 uppercase">
            Showing
          </p>
          <p className="text-ink mt-0.5 flex items-center gap-2 font-serif text-lg leading-tight font-normal">
            <Blossom className="text-bubblegum" size={15} />
            {label}
            {isCurrentMonth && (
              <span className="text-ink-soft font-sans text-xs">
                · in progress
              </span>
            )}
          </p>
          {!isCurrentMonth && (
            <p className="text-ink-soft mt-1 text-xs">
              Today&rsquo;s lessons still show today — only the monthly figures
              moved.
            </p>
          )}
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          {!isCurrentMonth && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setScope(null)}
              className="text-ink-soft h-11 flex-none gap-1.5 rounded-full px-3 text-xs font-semibold hover:bg-pink-100 hover:text-pink-700"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              This month
            </Button>
          )}
          <MonthSelect
            value={scope}
            onChange={setScope}
            months={months}
            currentMonth={currentMonth}
            ariaLabel="Dashboard month"
            renderHint={(option) =>
              option.lessons ? `${option.lessons} lessons` : "no lessons"
            }
            className="flex-1 sm:w-60 sm:flex-none"
          />
        </div>
      </div>
    </div>
  );
}
