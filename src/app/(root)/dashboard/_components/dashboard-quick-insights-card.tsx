"use client";

import { Ban, CalendarCheck2, Sparkles, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InsightSummary = {
  bestDay: string;
  completed: number;
  cancelled: number;
  inactiveCount: number;
};

type DashboardQuickInsightsCardProps = {
  insights: InsightSummary;
  className?: string;
};

export function DashboardQuickInsightsCard({
  insights,
  className,
}: DashboardQuickInsightsCardProps) {
  return (
    <Card
      className={cn(
        "h-full gap-1 overflow-hidden rounded-[2rem] border border-pink-100/70 bg-white shadow-none backdrop-blur",
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="text-2xl text-rose-950/90 sm:text-[1.75rem]">
          Quick Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 text-sm text-rose-800/90">
        <div className="rounded-[1.6rem] border border-pink-100/80 bg-[linear-gradient(135deg,rgba(255,248,251,0.95),rgba(255,255,255,1))] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-rose-400 uppercase">
                Best day
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-rose-950">
                {insights.bestDay}
              </p>
              <p className="mt-1 text-sm text-rose-500">
                Your strongest this month.
              </p>
            </div>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-500">
              <Sparkles className="size-5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.4rem] border border-emerald-100 bg-emerald-50/50 p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-emerald-600 uppercase">
              <CalendarCheck2 className="size-3.5" />
              Taught
            </div>
            <p className="mt-3 text-2xl font-semibold text-rose-950">
              {insights.completed}
            </p>
          </div>

          <div className="rounded-[1.4rem] border border-amber-100 bg-amber-50/60 p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-amber-600 uppercase">
              <Ban className="size-3.5" />
              Cancelled
            </div>
            <p className="mt-3 text-2xl font-semibold text-rose-950">
              {insights.cancelled}
            </p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-fuchsia-100 bg-fuchsia-50/35 p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-fuchsia-600 uppercase">
            <Users className="size-3.5" />
            Follow-up list
          </div>
          <p className="mt-2 text-sm leading-6 text-rose-700/85">
            <span className="font-semibold text-rose-950">
              {insights.inactiveCount}
            </span>{" "}
            students have not attended in the last 14 days.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
