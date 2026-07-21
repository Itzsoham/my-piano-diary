"use client";

import { Blossom, Sparkle } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Ranking is by average lesson score (podium pills adapted from the mockup
// at dashboard-e.html:1641/1650/1659). Only RATED lessons count toward the
// average — a student with no rated lessons this month simply doesn't
// appear, so this never penalises a family who opts out of scoring.
type TopStudent = {
  studentId: string | number;
  studentName: string;
  avgScore: number;
  ratedCount: number;
  avatar: string | null;
};

type DashboardTopStudentsCardProps = {
  studentsLoading: boolean;
  topFiveStudents: TopStudent[];
  className?: string;
};

const MEDALS = ["🥇", "🥈", "🥉"] as const;
const PLACES = ["1st", "2nd", "3rd", "4th", "5th"] as const;

// DOM order stays rank order (1, 2, 3); flex `order` builds the visual
// staircase — 1st centre, 2nd to its left, 3rd to its right.
const PODIUM_ORDER = ["order-2", "order-1", "order-3"] as const;
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

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function DashboardTopStudentsCard({
  studentsLoading,
  topFiveStudents,
  className,
}: DashboardTopStudentsCardProps) {
  const podium = topFiveStudents.slice(0, 3);
  const runners = topFiveStudents.slice(3);
  const showStaircase = podium.length === 3;

  return (
    <Card
      className={cn(
        "border-border bg-card flex h-full flex-col gap-3 overflow-hidden rounded-[2rem] py-5 shadow-(--sh)",
        className,
      )}
    >
      <CardHeader className="gap-1 pb-0">
        <CardTitle className="text-ink flex items-center gap-2 font-serif text-[1.35rem] leading-tight font-normal">
          <Blossom className="text-bubblegum" size={17} />
          Top Students This Month
        </CardTitle>
        <p className="text-ink-soft text-xs">By lesson score</p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col overflow-y-auto pt-2">
        {studentsLoading ? (
          <div className="space-y-4">
            <div className="flex items-end justify-center gap-2 sm:gap-3">
              {[
                "clamp(116px,12.5vw,126px)",
                "clamp(138px,15vw,154px)",
                "clamp(100px,10.5vw,106px)",
              ].map((height) => (
                <div
                  key={height}
                  className="flex w-full max-w-30 flex-col items-center gap-2"
                >
                  <Skeleton className="size-11 rounded-full" />
                  <Skeleton
                    className="w-full rounded-t-2xl rounded-b-md"
                    style={{ height }}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>
        ) : topFiveStudents.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
            <Mochi mood="sleepy" size={104} />
            <div>
              <p className="text-ink font-serif text-base">
                No rated lessons yet this month
              </p>
              <p className="text-ink-soft mt-1 text-xs">
                Rate a completed lesson to crown your star performers here.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <ol className="flex items-end justify-center gap-2 sm:gap-3">
              {podium.map((student, index) => (
                <li
                  key={student.studentId}
                  className={cn(
                    "relative flex max-w-30 min-w-0 flex-1 flex-col items-center text-center",
                    showStaircase && PODIUM_ORDER[index],
                  )}
                >
                  {index === 0 && (
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
                      index !== 0 && "invisible",
                    )}
                  />

                  <Avatar
                    className={cn(
                      "relative z-10 size-11 border-[3px] border-white shadow-sm",
                      index === 0 && "ring-bubblegum ring-2",
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
                      PODIUM_COLUMN[index],
                      PODIUM_HEIGHT[index],
                    )}
                  >
                    <span className="text-lg leading-none" aria-hidden="true">
                      {MEDALS[index]}
                    </span>
                    <span className="sr-only">{PLACES[index]} place</span>
                    <span className="text-ink text-[11px] leading-tight font-semibold wrap-anywhere">
                      {student.studentName}
                    </span>
                    <span className="border-border flex items-center gap-1 rounded-full border bg-white/70 px-2 py-1 text-[10px] font-bold whitespace-nowrap text-pink-700 tabular-nums">
                      <Blossom size={10} className="text-bubblegum" />
                      {student.avgScore.toFixed(1)}
                      <span className="sr-only">
                        {" "}
                        average, from {student.ratedCount} rated{" "}
                        {student.ratedCount === 1 ? "lesson" : "lessons"}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ol>

            {runners.length > 0 && (
              <ol start={4} className="mt-4 flex flex-col gap-0.5">
                {runners.map((student, index) => (
                  <li key={student.studentId}>
                    <div className="flex min-h-11 items-center gap-2.5 rounded-xl px-1.5">
                      <span className="grid size-6 flex-none place-items-center rounded-md bg-pink-100 text-[11px] font-bold text-pink-700 tabular-nums">
                        <span aria-hidden="true">{index + 4}</span>
                        <span className="sr-only">
                          {PLACES[index + 3]} place
                        </span>
                      </span>
                      <Avatar className="size-7">
                        <AvatarImage src={student.avatar ?? undefined} />
                        <AvatarFallback className="bg-pink-100 text-[10px] font-bold text-pink-700">
                          {getInitials(student.studentName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-ink min-w-0 flex-1 truncate text-[13px] font-semibold">
                        {student.studentName}
                      </span>
                      <span className="flex flex-none items-center gap-1 rounded-full bg-pink-100 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-pink-700 tabular-nums">
                        <Blossom size={11} className="text-bubblegum" />
                        {student.avgScore.toFixed(1)}
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
        )}
      </CardContent>
    </Card>
  );
}
