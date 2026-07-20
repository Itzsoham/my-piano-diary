"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { Blossom, Sparkle } from "@/components/blossom/blossom";
import { MochiPeek } from "@/components/blossom/mochi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type InsightSummary = {
  bestDay: string;
  completed: number;
  cancelled: number;
  inactiveCount: number;
};

type DashboardQuickInsightsCardProps = {
  insights: InsightSummary;
  insightsLoading?: boolean;
  className?: string;
};

export function DashboardQuickInsightsCard({
  insights,
  insightsLoading = false,
  className,
}: DashboardQuickInsightsCardProps) {
  return (
    <Card
      className={cn(
        // washi-tape sticker: a slight tilt that straightens on hover and sits
        // flat on touch. overflow-visible + relative let the tape strip and the
        // Mochi peek hook over the top edge.
        "bg-card relative flex h-full origin-top rotate-[-0.6deg] flex-col gap-2 overflow-visible rounded-[2rem] border border-(--line-strong) py-6 shadow-(--sh-sm) focus-within:rotate-0 hover:rotate-0 hover:shadow-(--sh-lg) [@media(hover:none)]:rotate-0",
        className,
      )}
    >
      {/* washi tape strip — decorative, kept out of the a11y tree */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-3 left-1/2 z-3 h-6.5 w-34.5 -translate-x-1/2 rotate-[1.8deg] rounded-sm border-x-2 border-dashed opacity-90"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--mint) 82%, transparent), color-mix(in srgb, var(--cotton) 72%, transparent))",
          borderColor:
            "color-mix(in srgb, var(--wintergreen) 45%, transparent)",
          boxShadow: "var(--sh-sm)",
        }}
      />

      {/* Mochi peeks over the top-right corner, paws hooked on the border */}
      <MochiPeek
        mood="delighted"
        size={78}
        className="absolute -top-7 right-3 z-2 motion-safe:animate-[bob_5.4s_ease-in-out_infinite]"
      />

      <CardHeader className="gap-1 pr-24">
        <CardTitle className="text-ink flex items-center gap-2 font-serif text-[1.375rem] font-normal sm:text-2xl">
          <Blossom className="text-bubblegum" size={17} />
          Quick Insights
        </CardTitle>
        <p className="text-ink-soft text-xs">Patterns worth a glance</p>
      </CardHeader>

      <CardContent className="text-ink-soft flex flex-col gap-3 pt-0 text-sm">
        {insightsLoading ? (
          <>
            <div className="bg-card rounded-xl border border-(--line-strong) p-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-ok-bg rounded-xl p-3.5">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="mt-2 h-3 w-16" />
              </div>
              <div className="bg-no-bg rounded-xl p-3.5">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="mt-2 h-3 w-16" />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-(--line-pink) bg-pink-50 p-3.5">
              <Skeleton className="size-8.5 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* hero stat — Best day, crowned by sparkles */}
            <div className="bg-card relative rounded-xl border border-(--line-strong) p-4">
              <Sparkle
                className="text-wintergreen absolute top-3 right-3.5"
                size={13}
              />
              <Sparkle
                className="text-bubblegum absolute top-8 right-7"
                size={9}
              />
              <div className="pr-9">
                <p className="text-ink-soft text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Best day
                </p>
                <p className="mt-1 text-[1.375rem] leading-tight font-semibold text-teal-700">
                  {insights.bestDay}
                </p>
                <p className="text-ink-soft mt-1 text-xs">
                  Your strongest this month.
                </p>
              </div>
            </div>

            {/* two mini-tiles — the numbers stay sober and undecorated */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-ok-bg flex flex-col gap-0.5 rounded-xl p-3.5">
                <span className="text-ok-fg text-[1.375rem] leading-none font-bold tabular-nums">
                  {insights.completed}
                </span>
                <span className="text-ok-fg text-[11px] font-semibold tracking-[0.04em] uppercase">
                  Taught
                </span>
              </div>
              <div className="bg-no-bg flex flex-col gap-0.5 rounded-xl p-3.5">
                <span className="text-no-fg text-[1.375rem] leading-none font-bold tabular-nums">
                  {insights.cancelled}
                </span>
                <span className="text-no-fg text-[11px] font-semibold tracking-[0.04em] uppercase">
                  Cancelled
                </span>
              </div>
            </div>

            {/* follow-up line */}
            <div className="flex items-center gap-3 rounded-xl border border-(--line-pink) bg-pink-50 p-3.5">
              <span
                aria-hidden="true"
                className="bg-no-bg text-no-fg flex size-8.5 shrink-0 items-center justify-center rounded-lg"
              >
                <MessageSquare className="size-4.25" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-ink text-xs font-semibold">Follow-up list</p>
                <p className="text-ink-soft mt-0.5 text-[11px] leading-snug">
                  <span className="text-ink font-semibold tabular-nums">
                    {insights.inactiveCount}
                  </span>{" "}
                  students have not attended in the last 14 days.
                </p>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-pink-700 hover:bg-pink-100 hover:text-pink-700"
              >
                <Link href="/students">View</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
