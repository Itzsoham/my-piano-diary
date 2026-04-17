"use client";

import { Users } from "lucide-react";
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
        "h-full overflow-hidden rounded-[2rem] border border-pink-100/70 bg-white shadow-none backdrop-blur",
        className,
      )}
    >
      <CardHeader className="pb-1">
        <CardTitle className="mt-3 text-xl text-rose-950/90">
          Quick Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-0 text-sm text-rose-800/90">
        <div className="rounded-[1.35rem] bg-white/75 p-4 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-rose-400 uppercase">
            Best day
          </p>
          <p className="mt-2 text-lg font-semibold text-rose-950">
            {insights.bestDay}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.35rem] bg-white/75 p-4 shadow-sm">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-500 uppercase">
              Taught
            </p>
            <p className="mt-2 text-lg font-semibold text-rose-950">
              {insights.completed}
            </p>
          </div>
          <div className="rounded-[1.35rem] bg-white/75 p-4 shadow-sm">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-amber-500 uppercase">
              Cancelled
            </p>
            <p className="mt-2 text-lg font-semibold text-rose-950">
              {insights.cancelled}
            </p>
          </div>
        </div>
        <div className="rounded-[1.35rem] bg-white/75 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-fuchsia-500 uppercase">
            <Users className="size-3.5" />
            Follow-up list
          </div>
          <p className="mt-2 text-sm leading-6 text-rose-700/85">
            {insights.inactiveCount} students have not attended in the last 14
            days.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
