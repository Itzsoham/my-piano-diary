"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

import { Blossom } from "@/components/blossom/blossom";
import { STATS } from "@/components/landing/landing-data";
import { useStableReducedMotion } from "@/components/landing/reveal";
import { cn } from "@/lib/utils";

/**
 * The four facts about the shipped app, tucked under the hero on a floating
 * card so the page's first scroll lands on evidence rather than more adjectives.
 *
 * The figures count up once, together, when the strip first enters view — all
 * four driven by a single observer so they read as one gesture instead of four
 * independent tickers. Under reduced motion they are simply printed.
 *
 * Screen readers get the finished sentence from an sr-only line and the visible
 * cells are hidden from them, because a number that is mid-animation would
 * otherwise be announced as whatever it happened to be at that instant.
 */

const COUNT_MS = 1100;

/** Borders drawn per cell so the hairlines never touch the card's rounded edge.
 *  2 columns on mobile, 4 from md — the md classes undo the mobile row rule. */
const CELL_BORDERS = [
  "",
  "border-l",
  "border-t md:border-t-0 md:border-l",
  "border-t border-l md:border-t-0",
] as const;

function useCountUp(target: number, active: boolean, reduced: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || reduced) return;

    let frame = 0;
    const started = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / COUNT_MS);
      // easeOutCubic: fast off the mark, settles gently on the real number.
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, reduced, target]);

  // Reduced motion gets the finished figure by derivation rather than by a
  // setState in the effect body — there is nothing to animate, so there is no
  // reason to render twice for it.
  return reduced ? target : value;
}

function StatCell({
  stat,
  active,
  reduced,
  borders,
}: {
  stat: (typeof STATS)[number];
  active: boolean;
  reduced: boolean;
  borders: string;
}) {
  const value = useCountUp(stat.value, active, reduced);
  const suffix = "suffix" in stat ? stat.suffix : "";

  return (
    <div
      className={cn("border-(--line) px-4 py-6 text-center sm:px-6", borders)}
    >
      <span className="sr-only">
        {stat.value}
        {suffix} {stat.label}. {stat.hint}
      </span>

      {/* Sans, like every other figure in the product: the serif is for
          headings and the report paper, and a KPI on this page should be set
          the way the KPI cards in the real app are set. */}
      <p
        aria-hidden="true"
        className="text-grad-pink text-[clamp(1.9rem,4vw,2.8rem)] leading-none font-bold tracking-tight tabular-nums"
      >
        {value}
        {suffix}
      </p>
      <p aria-hidden="true" className="text-ink mt-2 text-sm font-semibold">
        {stat.label}
      </p>
      <p
        aria-hidden="true"
        className="text-ink-soft mx-auto mt-1.5 max-w-[34ch] text-xs leading-relaxed"
      >
        {stat.hint}
      </p>
    </div>
  );
}

export function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useStableReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.35 });

  return (
    <section
      aria-label="My Piano Diary in numbers"
      className="relative z-10 -mt-10 px-4 sm:px-6"
    >
      <div
        ref={ref}
        className="relative mx-auto grid max-w-5xl grid-cols-2 overflow-hidden rounded-3xl border border-(--line) bg-white/70 shadow-(--sh) backdrop-blur-md md:grid-cols-4"
      >
        <Blossom
          size={26}
          className="motion-safe:animate-drift pointer-events-none absolute top-3 left-3 text-pink-100"
        />
        <Blossom
          size={22}
          className="pointer-events-none absolute right-3 bottom-3 text-teal-100 motion-safe:animate-[drift_26s_ease-in-out_infinite]"
        />

        {STATS.map((stat, i) => (
          <StatCell
            key={stat.label}
            stat={stat}
            active={inView}
            reduced={reduced}
            borders={CELL_BORDERS[i] ?? ""}
          />
        ))}
      </div>
    </section>
  );
}
