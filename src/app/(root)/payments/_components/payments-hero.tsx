"use client";

import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { useCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import { api } from "@/trpc/react";

/**
 * The Blossom Diary hero band for the Payments screen: a soft gradient with a
 * scalloped underside and two drifting blobs behind it, a serif "Payments"
 * heading under a hand-drawn squiggle, one honest narrative line built from
 * live data (total outstanding across every recorded month), and Mochi
 * bobbing beside it. Purely presentational — decoration is aria-hidden.
 * Mirrors dashboard-hero.tsx / students-hero.tsx.
 *
 * Reuses payment.getOverallSummary — the same all-time query
 * PaymentsPageContent's summary tiles already run — so React Query dedupes
 * the two calls into a single request; this costs nothing extra on the wire.
 */
export function PaymentsHero() {
  const { currency } = useCurrency();
  const { data: overallSummary, isPending } =
    api.payment.getOverallSummary.useQuery();

  const totalOutstanding = overallSummary?.totalOutstanding ?? 0;

  // studentCount on the summary is the whole roster, not "students who owe" —
  // never phrase the narrative as "outstanding across N students" or it
  // implies every student has a balance due.
  const narrative = isPending
    ? "Adding up every lesson and every payment..."
    : totalOutstanding <= 0
      ? "Every student is settled up — nothing outstanding right now."
      : `${formatCurrency(totalOutstanding, currency)} outstanding across every month on record.`;

  const mood = isPending
    ? "sleepy"
    : totalOutstanding <= 0
      ? "delighted"
      : "content";

  return (
    <section className="px-4 pt-4 lg:px-6">
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
              <h1 className="bday-animate-title text-ink flex items-center gap-2 font-serif text-[clamp(1.6rem,3.4vw,2.3rem)] leading-tight font-bold">
                Payments
              </h1>
              <Squiggle className="text-bubblegum mt-0.5 h-2.5 w-full" />
            </div>
            <p className="text-ink-soft mt-2 flex items-center gap-1.5 text-sm sm:text-[15px]">
              <Blossom className="text-bubblegum" size={14} />
              {narrative}
            </p>
          </div>

          {/* Mochi bobbing beside the heading — hidden on the narrowest phones
              so she never crowds the text. */}
          <Mochi
            mood={mood}
            bob
            size={112}
            className="hidden shrink-0 sm:block"
          />
        </div>
      </div>
    </section>
  );
}
