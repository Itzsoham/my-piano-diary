"use client";

import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { formatScore } from "@/lib/ranking";

type LeaderboardHeroProps = {
  rankedStudents: number;
  ratedLessons: number;
  studioAverage: number | null;
  /** The month on screen, or null while the board covers every month. */
  scopeLabel: string | null;
};

/**
 * The Blossom Diary hero band for the ranking board — same anatomy as
 * Dashboard/Calendar/Pieces (scalloped gradient band, drifting blobs, serif
 * title + squiggle, bobbing Mochi).
 *
 * The stat block is a fixed two-tile grid rather than a lone average, so the
 * right-hand column keeps its width when a month has no ratings and the tiles
 * stop jumping as the teacher pages through months.
 */
export function LeaderboardHero({
  rankedStudents,
  ratedLessons,
  studioAverage,
  scopeLabel,
}: LeaderboardHeroProps) {
  const period = scopeLabel ?? "all time";

  const narrative =
    ratedLessons === 0
      ? scopeLabel
        ? `Nothing rated in ${scopeLabel} 🎀 — try another month.`
        : "Nothing rated yet 🎀 — score a completed lesson to start the board."
      : `${rankedStudents} student${rankedStudents === 1 ? "" : "s"} ranked across ${ratedLessons} rated lesson${ratedLessons === 1 ? "" : "s"}`;

  return (
    <section className="px-4 pt-4 lg:px-6">
      <div className="hero-band scallop-b relative isolate overflow-hidden rounded-[calc(var(--radius)+12px)] px-6 py-7 shadow-(--sh) sm:px-9 sm:py-9">
        <div
          aria-hidden="true"
          className="bg-cotton/50 motion-safe:animate-drift pointer-events-none absolute -top-10 -right-6 -z-10 size-40 rounded-[46%_54%_40%_60%/55%_45%_60%_40%]"
        />
        <div
          aria-hidden="true"
          className="bg-mint/40 pointer-events-none absolute -bottom-16 left-1/3 -z-10 size-44 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] motion-safe:animate-[drift_26s_ease-in-out_infinite]"
        />

        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
          <div className="min-w-0 flex-1">
            <div className="inline-block">
              <h1 className="text-ink font-serif text-[clamp(1.6rem,3.4vw,2.3rem)] leading-tight font-bold">
                Ranking
              </h1>
              <Squiggle className="text-bubblegum mt-0.5 h-2.5 w-full" />
            </div>
            <p className="text-ink-soft mt-2 text-sm sm:text-[15px]">
              Students ranked by their average lesson score
              {scopeLabel ? ` in ${scopeLabel}` : " across every month"}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-pink-700 italic sm:text-base">
              <Blossom className="text-bubblegum" size={14} />
              {narrative}
            </p>
          </div>

          <div className="flex items-end gap-3 sm:gap-4">
            <dl className="grid grid-cols-2 gap-2 sm:gap-3">
              <HeroStat
                label="Studio average"
                value={
                  studioAverage === null ? "—" : formatScore(studioAverage)
                }
                hint={period}
              />
              <HeroStat
                label="Rated lessons"
                value={String(ratedLessons)}
                hint={`${rankedStudents} ranked`}
              />
            </dl>
            <Mochi
              mood={ratedLessons === 0 ? "sleepy" : "delighted"}
              bob
              size={68}
              className="hidden shrink-0 sm:block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-card/80 min-w-27 rounded-2xl border border-pink-100 px-3.5 py-2.5 text-center shadow-(--sh-xs)">
      <dt className="text-[10px] font-semibold tracking-[0.08em] text-pink-700 uppercase">
        {label}
      </dt>
      <dd className="text-ink mt-0.5 font-serif text-2xl leading-none tabular-nums">
        {value}
      </dd>
      <dd className="text-ink-soft mt-1 truncate text-[10.5px]">{hint}</dd>
    </div>
  );
}
