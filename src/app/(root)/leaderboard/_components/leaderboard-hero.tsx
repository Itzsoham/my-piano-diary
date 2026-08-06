"use client";

import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { formatScore } from "@/lib/ranking";

type LeaderboardHeroProps = {
  rankedStudents: number;
  ratedLessons: number;
  studioAverage: number | null;
};

/**
 * The Blossom Diary hero band for the leaderboard — same anatomy as
 * Dashboard/Calendar/Pieces (scalloped gradient band, drifting blobs, serif
 * title + squiggle, bobbing Mochi).
 */
export function LeaderboardHero({
  rankedStudents,
  ratedLessons,
  studioAverage,
}: LeaderboardHeroProps) {
  const narrative =
    ratedLessons === 0
      ? "Nothing rated yet 🎀 — score a completed lesson to start the board."
      : `${rankedStudents} student${rankedStudents === 1 ? "" : "s"} ranked across ${ratedLessons} rated lesson${ratedLessons === 1 ? "" : "s"}`;

  return (
    <section className="px-4 pt-4 lg:px-6">
      <div className="hero-band scallop-b relative isolate overflow-hidden rounded-[calc(var(--radius)+12px)] px-6 py-7 shadow-(--sh) sm:px-9 sm:py-9">
        <div
          aria-hidden="true"
          className="bg-cotton/50 pointer-events-none absolute -top-10 -right-6 -z-10 size-40 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] motion-safe:animate-[drift_22s_ease-in-out_infinite]"
        />
        <div
          aria-hidden="true"
          className="bg-mint/40 pointer-events-none absolute -bottom-16 left-1/3 -z-10 size-44 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] motion-safe:animate-[drift_26s_ease-in-out_infinite]"
        />

        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <div className="inline-block">
              <h1 className="text-ink font-serif text-[clamp(1.6rem,3.4vw,2.3rem)] leading-tight font-bold">
                Ranking
              </h1>
              <Squiggle className="text-bubblegum mt-0.5 h-2.5 w-full" />
            </div>
            <p className="text-ink-soft mt-2 text-sm sm:text-[15px]">
              Every student, ranked by their all-time average lesson score
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-pink-700 italic sm:text-base">
              <Blossom className="text-bubblegum" size={14} />
              {narrative}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {studioAverage !== null && (
              <div className="bg-card/80 rounded-2xl border border-pink-100 px-4 py-3 text-center shadow-(--sh-xs)">
                <div className="text-[10px] font-semibold tracking-[0.08em] text-pink-700 uppercase">
                  Studio average
                </div>
                <div className="text-ink mt-0.5 font-serif text-2xl tabular-nums">
                  {formatScore(studioAverage)}
                </div>
              </div>
            )}
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
