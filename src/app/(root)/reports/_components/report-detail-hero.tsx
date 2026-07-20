"use client";

import { Blossom, Squiggle } from "@/components/blossom/blossom";
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

interface ReportDetailHeroProps {
  studentId: string;
  month: number;
  year: number;
  studentName: string;
}

/**
 * The Blossom Diary hero band for a single student's report DETAIL screen —
 * the mockup's `.page-head`: a scalloped gradient band with two drifting
 * blobs, a serif "Monthly Report" heading under a hand-drawn squiggle, and
 * one narrative line built from live data (lesson + COMPLETE counts — never
 * the tuition figure, which is stated once on the paper itself, per the
 * mockup's money rule). Purely presentational — decoration is aria-hidden.
 * print:hidden: the printed artifact is the paper below, never this chrome.
 *
 * No Mochi here on purpose: the mockup's ornament budget for this screen
 * gives her exactly one seat — "on the mat beside the sheet" — and
 * ReportView already renders her there with her own narrative. A second
 * Mochi in the hero would duplicate that, not port it.
 *
 * Shares its query key with ReportView's own `getStudentReport` call (same
 * studentId/month/year), so mounting both here costs one request, not two.
 */
export function ReportDetailHero({
  studentId,
  month,
  year,
  studentName,
}: ReportDetailHeroProps) {
  const { data } = api.report.getStudentReport.useQuery({
    studentId,
    month,
    year,
  });

  const lessons = data?.lessons ?? [];
  const total = lessons.length;
  const complete = lessons.filter(
    (lesson) => lesson.status === "COMPLETE",
  ).length;
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const narrative =
    total === 0
      ? `No lessons logged yet for ${monthLabel} — the sheet is ready whenever you are 🎀`
      : `${total} lesson${total === 1 ? "" : "s"} on the sheet, ${complete} of them COMPLETE and billable.`;

  return (
    <section className="px-4 pt-4 lg:px-6 print:hidden">
      <div className="hero-band scallop-b relative isolate overflow-hidden rounded-3xl px-6 py-7 shadow-(--sh) sm:px-9 sm:py-9">
        {/* drifting blobs — decorative */}
        <div
          aria-hidden="true"
          className="bg-cotton/50 motion-safe:animate-drift pointer-events-none absolute -top-10 -right-6 -z-10 size-40 rounded-[46%_54%_40%_60%/55%_45%_60%_40%]"
        />
        <div
          aria-hidden="true"
          className="bg-mint/40 pointer-events-none absolute -bottom-16 left-1/3 -z-10 size-44 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] motion-safe:animate-[drift_26s_ease-in-out_infinite]"
        />

        <div className="min-w-0">
          <div className="inline-block">
            <h1 className="text-ink flex items-center gap-2 font-serif text-[clamp(1.6rem,3.4vw,2.3rem)] leading-tight font-bold">
              Monthly <em className="text-pink-700 italic">Report</em>
            </h1>
            <Squiggle className="text-bubblegum mt-0.5 h-2.5 w-full" />
          </div>
          <p className="mt-2 text-sm font-medium text-pink-700 italic sm:text-base">
            {studentName || "—"} · {monthLabel}
          </p>
          <p className="text-ink-soft mt-1 flex items-center gap-1.5 text-sm sm:text-[15px]">
            <Blossom className="text-bubblegum" size={14} />
            {narrative}
          </p>
        </div>
      </div>
    </section>
  );
}
