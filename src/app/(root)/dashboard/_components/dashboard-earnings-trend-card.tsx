"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import type { CurrencyCode } from "@/lib/currency";
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
  trendLoading: boolean;
  trendData: TrendPoint[];
  insights: InsightSummary;
  currency: CurrencyCode;
  className?: string;
};

const chartConfig = {
  earned: {
    label: "Earnings",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const formatCompactAmount = (value: number, currency: CurrencyCode) => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const compact = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

  return `${compact} ${currency}`;
};

export function DashboardEarningsTrendCard({
  trendLoading,
  trendData,
  insights,
  currency,
  className,
}: DashboardEarningsTrendCardProps) {
  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[2rem] border border-pink-100/70 bg-white shadow-none backdrop-blur",
        className,
      )}
    >
      <CardHeader className="relative space-y-4 pb-0">
        <div className="absolute top-4 right-4 h-24 w-24 rounded-full bg-pink-100/70 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl text-rose-950">
              Earnings Trend This Month
            </CardTitle>
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
      <CardContent className="flex min-h-0 flex-1 pt-4 pb-4">
        <div className="h-full min-h-72 w-full rounded-[1.6rem] bg-white/65 p-3 shadow-inner shadow-rose-100/30 sm:p-5">
          {trendLoading ? (
            <Skeleton className="h-full w-full rounded-4xl" />
          ) : trendData.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-4xl border border-dashed border-pink-200 bg-pink-50/40 text-sm text-rose-500">
              No completed lessons yet this month.
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto! h-full w-full"
            >
              <LineChart
                accessibilityLayer
                data={trendData}
                margin={{ left: 16, right: 12, top: 12, bottom: 24 }}
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
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 8"
                  opacity={0.24}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  minTickGap={20}
                  tickMargin={10}
                  interval="preserveStartEnd"
                />
                <YAxis
                  width={56}
                  axisLine={false}
                  tickLine={false}
                  domain={[
                    0,
                    (dataMax: number) => Math.max(Math.ceil(dataMax * 1.1), 1),
                  ]}
                  allowDecimals={false}
                  tickFormatter={(value: number) =>
                    formatCompactAmount(value, currency)
                  }
                />
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
                <ChartLegend
                  verticalAlign="top"
                  align="left"
                  content={
                    <ChartLegendContent className="pt-0 pb-2 text-xs font-medium text-rose-700" />
                  }
                />
                <Line
                  type="linear"
                  dataKey="earned"
                  stroke="url(#dashboard-earnings-gradient)"
                  strokeWidth={4}
                  dot={{ r: 2, fill: "#ec4899", strokeWidth: 0 }}
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
