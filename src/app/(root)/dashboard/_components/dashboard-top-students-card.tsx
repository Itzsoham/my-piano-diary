"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import {
  ScorePodium,
  type PodiumStudent,
} from "@/components/ranking/score-podium";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Ranking is by average lesson score (podium pills adapted from the mockup
// at dashboard-e.html:1641/1650/1659). Only RATED lessons count toward the
// average — a student with no rated lessons this month simply doesn't
// appear, so this never penalises a family who opts out of scoring.
// The rank maths and the podium itself are shared with /leaderboard; see
// @/lib/ranking for why ties share a rank and where the podium cut falls.
type TopStudent = PodiumStudent;

type DashboardTopStudentsCardProps = {
  studentsLoading: boolean;
  topFiveStudents: TopStudent[];
  className?: string;
};

export function DashboardTopStudentsCard({
  studentsLoading,
  topFiveStudents,
  className,
}: DashboardTopStudentsCardProps) {
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
        <p className="text-ink-soft text-xs">
          By lesson score · ties share a rank
        </p>
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
          <ScorePodium students={topFiveStudents} />
        )}
      </CardContent>

      <div className="px-6">
        <Link
          href="/leaderboard"
          className="text-ink flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-pink-200 bg-pink-50/70 px-4 text-[13px] font-semibold transition-colors hover:bg-pink-100 hover:text-pink-700"
        >
          View full ranking
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
