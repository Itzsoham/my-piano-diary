"use client";

import { Blossom, Sparkle } from "@/components/blossom/blossom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatScore, ordinal, splitPodium } from "@/lib/ranking";

export type PodiumStudent = {
  studentId: string;
  studentName: string;
  avgScore: number;
  ratedCount: number;
  rank: number;
  avatar: string | null;
};

// Generic over the row type so a caller with richer entries (the /leaderboard
// page) gets those fields straight back in `renderRunnerMeta`, instead of
// having to look the student up again by id.
type ScorePodiumProps<T extends PodiumStudent> = {
  students: T[];
  /** Extra copy under a runner's name (e.g. "12 lessons · best 5"). */
  renderRunnerMeta?: (student: T) => React.ReactNode;
  className?: string;
};

const MEDALS = ["🥇", "🥈", "🥉"] as const;

// Everything visual is keyed on RANK, never on array position — otherwise two
// students tied at rank 1 would stand on different-height pedestals in
// different colours, i.e. the pedestal would assert a winner the rank denies.
// Podium ranks are always <= 3: the rank of the entry at index i is at most
// i + 1, and splitPodium never returns more than three entries.
const PODIUM_COLUMN = [
  "border-pink-200 bg-pink-100",
  "border-teal-200 bg-teal-100",
  "border-sand-300 bg-sand-100",
] as const;

// Staircase floors/caps mirror the mockup (dashboard-e.html:759-761): min-height
// (never height) so a 3rd column whose own content is ~94px is floored — not
// clipped — while clamp keeps the 22/16px steps at small viewports and the
// 154/126/106 upper bounds at >=1024.
const PODIUM_HEIGHT = [
  "min-h-[clamp(138px,15vw,154px)]",
  "min-h-[clamp(116px,12.5vw,126px)]",
  "min-h-[clamp(100px,10.5vw,106px)]",
] as const;

// DOM order stays rank order; flex `order` builds the visual staircase — 1st
// centre, 2nd left, 3rd right. Only applied when there are three genuinely
// distinct ranks, because a centred "winner" is a lie the moment two students
// share rank 1; tied boards fall back to plain left-to-right rank order.
const PODIUM_ORDER = ["order-2", "order-1", "order-3"] as const;

export const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function ScorePodium<T extends PodiumStudent>({
  students,
  renderRunnerMeta,
  className,
}: ScorePodiumProps<T>) {
  const { podium, runners } = splitPodium(students);

  const showStaircase =
    podium.length === 3 && new Set(podium.map((s) => s.rank)).size === 3;

  const tieCounts = students.reduce<Record<number, number>>((acc, student) => {
    acc[student.rank] = (acc[student.rank] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className={className}>
      {podium.length > 0 && (
        <ol className="flex items-end justify-center gap-2 sm:gap-3">
          {podium.map((student, index) => {
            const tier = student.rank - 1;
            const isTied = (tieCounts[student.rank] ?? 0) > 1;

            return (
              <li
                key={student.studentId}
                className={cn(
                  "relative flex max-w-30 min-w-0 flex-1 flex-col items-center text-center",
                  showStaircase && PODIUM_ORDER[index],
                )}
              >
                {student.rank === 1 && (
                  <>
                    <Sparkle
                      className="text-bubblegum absolute top-5 left-0.5"
                      size={13}
                    />
                    <Sparkle
                      className="text-bubblegum absolute top-10 right-1"
                      size={9}
                    />
                    <Sparkle
                      className="text-bubblegum absolute top-1 right-3"
                      size={11}
                    />
                  </>
                )}

                <Blossom
                  size={20}
                  className={cn(
                    "text-bubblegum mb-0.5",
                    student.rank !== 1 && "invisible",
                  )}
                />

                <Avatar
                  className={cn(
                    "relative z-10 size-11 border-[3px] border-white shadow-sm",
                    student.rank === 1 && "ring-bubblegum ring-2",
                  )}
                >
                  <AvatarImage src={student.avatar ?? undefined} />
                  <AvatarFallback className="bg-pink-100 text-sm font-bold text-pink-700">
                    {getInitials(student.studentName)}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    "-mt-3.5 flex w-full flex-col items-center justify-end gap-1 rounded-t-2xl rounded-b-md border px-1.5 pt-5 pb-3",
                    PODIUM_COLUMN[tier],
                    PODIUM_HEIGHT[tier],
                  )}
                >
                  <span className="text-lg leading-none" aria-hidden="true">
                    {MEDALS[tier]}
                  </span>
                  <span className="sr-only">
                    {ordinal(student.rank)} place
                    {isTied ? " (tied)" : ""}
                  </span>
                  <span className="text-ink text-[11px] leading-tight font-semibold wrap-anywhere">
                    {student.studentName}
                  </span>
                  {isTied && (
                    <span className="text-ink-soft text-[9px] leading-none font-semibold tracking-wide uppercase">
                      tied
                    </span>
                  )}
                  <span className="border-border flex items-center gap-1 rounded-full border bg-white/70 px-2 py-1 text-[10px] font-bold whitespace-nowrap text-pink-700 tabular-nums">
                    <Blossom size={10} className="text-bubblegum" />
                    {formatScore(student.avgScore)}
                    <span className="text-pink-400">
                      · {student.ratedCount}
                    </span>
                    <span className="sr-only">
                      {" "}
                      average, from {student.ratedCount} rated{" "}
                      {student.ratedCount === 1 ? "lesson" : "lessons"}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {runners.length > 0 && (
        <ol
          // Real rank, not a hardcoded 4 — with ties the first runner can sit
          // at rank 1 (everyone tied) or rank 3, and the marker has to agree
          // with the badge rendered inside the row.
          start={runners[0]?.rank ?? 1}
          className={cn("flex flex-col gap-0.5", podium.length > 0 && "mt-4")}
        >
          {runners.map((student) => (
            <li key={student.studentId}>
              <div className="flex min-h-11 items-center gap-2.5 rounded-xl px-1.5">
                <span className="grid size-6 flex-none place-items-center rounded-md bg-pink-100 text-[11px] font-bold text-pink-700 tabular-nums">
                  <span aria-hidden="true">{student.rank}</span>
                  <span className="sr-only">{ordinal(student.rank)} place</span>
                </span>
                <Avatar className="size-7">
                  <AvatarImage src={student.avatar ?? undefined} />
                  <AvatarFallback className="bg-pink-100 text-[10px] font-bold text-pink-700">
                    {getInitials(student.studentName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <span className="text-ink block truncate text-[13px] font-semibold">
                    {student.studentName}
                  </span>
                  {renderRunnerMeta && (
                    <span className="text-ink-soft block truncate text-[11px]">
                      {renderRunnerMeta(student)}
                    </span>
                  )}
                </div>
                <span className="flex flex-none items-center gap-1 rounded-full bg-pink-100 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-pink-700 tabular-nums">
                  <Blossom size={11} className="text-bubblegum" />
                  {formatScore(student.avgScore)}
                  <span className="text-pink-400">
                    · {student.ratedCount} rated
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
