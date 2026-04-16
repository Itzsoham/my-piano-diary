"use client";

import { Sparkles } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type TrendPoint = {
  day: number;
  label: string;
  earned: number;
};

type InsightSummary = {
  completed: number;
  completionRate: number;
};

type DashboardEarningsTrendCardProps = {
  lessonsLoading: boolean;
  trendData: TrendPoint[];
  insights: InsightSummary;
  currency: string;
  className?: string;
};

const chartConfig = {
  earned: {
    label: "Earnings",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function DashboardEarningsTrendCard({
  lessonsLoading,
  trendData,
  insights,
  currency,
  className,
}: DashboardEarningsTrendCardProps) {
  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.94),rgba(255,245,249,0.92),rgba(255,252,245,0.95))] shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
        className,
      )}
    >
      <CardHeader className="relative space-y-4 pb-0">
        <div className="absolute top-4 right-4 h-24 w-24 rounded-full bg-pink-100/70 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-200/70 bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-pink-500 uppercase shadow-sm">
              <Sparkles className="size-3.5" />
              This month
            </div>
            <CardTitle className="text-2xl text-rose-950">
              Earnings Trend This Month
            </CardTitle>
            <p className="max-w-lg text-sm leading-6 text-rose-600/85">
              A cleaner, softer view of how your income is moving through the
              month.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 self-start sm:min-w-64">
            <div className="rounded-[1.35rem] bg-white/75 p-3 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-rose-400 uppercase">
                Completed
              </p>
              <p className="mt-2 text-2xl font-semibold text-rose-950">
                {insights.completed}
              </p>
            </div>
            <div className="rounded-[1.35rem] bg-white/75 p-3 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-500 uppercase">
                Completion
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600">
                {insights.completionRate}%
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-5">
        <div className="h-full rounded-[1.6rem] bg-white/65 p-3 shadow-inner shadow-rose-100/30 sm:p-5">
          {lessonsLoading ? (
            <Skeleton className="h-full min-h-72 w-full rounded-4xl" />
          ) : trendData.length === 0 ? (
            <div className="flex h-full min-h-72 items-center justify-center rounded-4xl border border-dashed border-pink-200 bg-pink-50/40 text-sm text-rose-500">
              No completed lessons yet this month.
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full min-h-72 w-full">
              <LineChart
                accessibilityLayer
                data={trendData}
                margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
              >
                <defs>
                  <linearGradient
                    id="dashboard-earnings-gradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="45%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 8" opacity={0.18} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={20} />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      className="rounded-2xl border border-white/80 bg-white/95 shadow-xl"
                      formatter={(value) => [
                        formatCurrency(Number(value), currency),
                        "Earnings",
                      ]}
                      labelFormatter={(label) =>
                        typeof label === "string" || typeof label === "number"
                          ? `Day ${label}`
                          : "Day"
                      }
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="earned"
                  stroke="url(#dashboard-earnings-gradient)"
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 5, fill: "#ec4899" }}
                  animationDuration={900}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
