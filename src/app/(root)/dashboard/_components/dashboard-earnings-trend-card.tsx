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
import { Badge } from "@/components/ui/badge";
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
        "flex h-full flex-col gap-2 overflow-hidden rounded-[2rem] border border-pink-100/70 bg-white shadow-none",
        className,
      )}
    >
      <CardHeader className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl text-rose-950">
              Earnings Trend This Month
            </CardTitle>
          </div>

          <div className="self-start">
            <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-emerald-700 uppercase hover:bg-emerald-50">
              {insights.completionRate}% completion
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 overflow-hidden px-4 pb-1 sm:px-6">
        <div className="h-full min-h-64 w-full min-w-0 overflow-hidden rounded-[1.5rem] border border-rose-100 bg-rose-50/30 p-3 sm:min-h-80 sm:p-4">
          {trendLoading ? (
            <Skeleton className="h-full w-full rounded-4xl" />
          ) : trendData.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-4xl border border-dashed border-pink-200 bg-pink-50/40 text-sm text-rose-500">
              No completed lessons yet this month.
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto! h-full w-full min-w-0 overflow-hidden"
            >
              <LineChart
                accessibilityLayer
                data={trendData}
                margin={{ left: 4, right: 8, top: 10, bottom: 18 }}
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
                  width={48}
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
