"use client";

import { useSearchParams } from "next/navigation";

import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { api } from "@/trpc/react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

// Mirrors the bounds checks in reports/page.tsx so the hero's "current filter
// month" always agrees with the Month/Year selects rendered below it.
function getFilterMonthYear(searchParams: URLSearchParams) {
  const now = new Date();
  const month = Number.parseInt(searchParams.get("month") ?? "", 10);
  const year = Number.parseInt(searchParams.get("year") ?? "", 10);

  return {
    month:
      Number.isInteger(month) && month >= 1 && month <= 12
        ? month
        : now.getMonth() + 1,
    year:
      Number.isInteger(year) && year >= 2000 && year <= 2100
        ? year
        : now.getFullYear(),
  };
}

// Mirrors ReportsPage's own "student" -> studentId filter (reports-page.tsx)
// so the hero's report count always agrees with the "Existing Reports" badge
// and table rendered below it, even once a specific student is selected.
function getFilterStudentId(searchParams: URLSearchParams) {
  const studentId = searchParams.get("student");
  return studentId && studentId !== "all" ? studentId : undefined;
}

/**
 * The Blossom Diary hero band for the Reports list: a soft gradient with a
 * scalloped underside and two drifting blobs behind it, a serif heading under
 * a hand-drawn squiggle, the active filter month, one narrative line built
 * from how many reports are on file for it, and Mochi bobbing beside it.
 * Purely presentational — decoration is aria-hidden. print:hidden: the
 * printed artifact is a student's report sheet, never this list screen.
 */
export function ReportsHero() {
  const searchParams = useSearchParams();
  const { month, year } = getFilterMonthYear(searchParams);
  const studentId = getFilterStudentId(searchParams);

  const { data: reports = [] } = api.report.getAll.useQuery({
    month,
    year,
    studentId,
  });
  const count = reports.length;
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const narrative =
    count === 0
      ? `No reports saved yet for ${monthLabel} — generate one below 🎀`
      : `${count} report${count === 1 ? "" : "s"} saved for ${monthLabel}`;

  return (
    <section className="px-4 pt-4 lg:px-6 print:hidden">
      <div className="hero-band scallop-b relative isolate overflow-hidden rounded-[calc(var(--radius)+12px)] px-6 py-7 shadow-[var(--sh)] sm:px-9 sm:py-9">
        {/* drifting blobs — decorative */}
        <div
          aria-hidden="true"
          className="bg-cotton/50 pointer-events-none absolute -top-10 -right-6 -z-10 size-40 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] motion-safe:animate-[drift_22s_ease-in-out_infinite]"
        />
        <div
          aria-hidden="true"
          className="bg-mint/40 pointer-events-none absolute -bottom-16 left-1/3 -z-10 size-44 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] motion-safe:animate-[drift_26s_ease-in-out_infinite]"
        />

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-block">
              <h1 className="bday-animate-title text-ink font-serif text-[clamp(1.6rem,3.4vw,2.3rem)] leading-tight font-bold">
                Monthly <em className="text-pink-700 italic">Reports</em>
              </h1>
              <Squiggle className="text-bubblegum mt-0.5 h-2.5 w-full" />
            </div>
            <p className="mt-2 text-sm font-medium text-pink-700 italic sm:text-base">
              {monthLabel}
            </p>
            <p className="text-ink-soft mt-1 flex items-center gap-1.5 text-sm sm:text-[15px]">
              <Blossom className="text-bubblegum" size={14} />
              {narrative}
            </p>
          </div>

          {/* Mochi bobbing beside the heading — hidden on the narrowest
              phones so she never crowds the text. */}
          <Mochi
            mood={count === 0 ? "sleepy" : "content"}
            bob
            size={112}
            className="hidden shrink-0 sm:block"
          />
        </div>
      </div>
    </section>
  );
}
