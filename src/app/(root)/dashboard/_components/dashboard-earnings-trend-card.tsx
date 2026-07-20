"use client";

import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
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

// ── Plot geometry — mirrors public/design-mockups/dashboard-e.html ──────────
const LEFT = 72; // y-axis gutter / first point x
const RIGHT_PAD = 28; // margin past the last point
const TOP = 24; // top gridline (y-axis max)
const BOTTOM = 216; // zero baseline
const MID = (TOP + BOTTOM) / 2; // 120
const PLOT_H = BOTTOM - TOP; // 192
const STEP = 52; // px between days — fixed density, wide months scroll
const VIEW_H = 280;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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

// Round a data maximum up to a friendly axis ceiling (1 / 2 / 2.5 / 5 × 10ⁿ),
// keeping ~8% headroom so the peak never touches the top gridline.
const niceCeil = (value: number) => {
  if (value <= 0) {
    return 1;
  }
  const padded = value * 1.08;
  const magnitude = Math.pow(10, Math.floor(Math.log10(padded)));
  const fraction = padded / magnitude;
  const step =
    fraction <= 1
      ? 1
      : fraction <= 2
        ? 2
        : fraction <= 2.5
          ? 2.5
          : fraction <= 5
            ? 5
            : 10;
  return step * magnitude;
};

export function DashboardEarningsTrendCard({
  trendLoading,
  trendData,
  insights,
  currency,
  className,
}: DashboardEarningsTrendCardProps) {
  const gradientId = useId();

  return (
    <Card
      className={cn(
        "border-border bg-card flex h-full flex-col gap-2 overflow-hidden rounded-[2rem] border shadow-none",
        className,
      )}
    >
      <CardHeader className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-ink flex items-center gap-2 font-serif text-2xl font-normal">
              <Blossom className="text-bubblegum" size={20} />
              Earnings Trend This Month
            </CardTitle>
            <p className="text-ink-soft text-sm">
              Daily billed revenue · COMPLETE lessons only
            </p>
          </div>

          <Badge className="shrink-0 gap-1.5 self-start rounded-full border-none bg-teal-100 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-teal-700 uppercase tabular-nums hover:bg-teal-100">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12.5l2.5 2.5L16 9.5" />
            </svg>
            {insights.completionRate}% completion
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col justify-center px-4 pb-4 sm:px-6">
        {trendLoading ? (
          <Skeleton className="h-64 w-full rounded-[1.5rem] sm:h-72" />
        ) : trendData.length === 0 ? (
          <EarningsTrendEmpty />
        ) : (
          <EarningsTrendChart
            trendData={trendData}
            currency={currency}
            gradientId={gradientId}
          />
        )}
      </CardContent>
    </Card>
  );
}

function EarningsTrendEmpty() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-pink-200 bg-pink-50/50 px-6 py-10 text-center">
      <Mochi mood="sleepy" size={96} />
      <p className="text-ink-soft text-sm">
        No completed lessons yet this month.
      </p>
    </div>
  );
}

function EarningsTrendChart({
  trendData,
  currency,
  gradientId,
}: {
  trendData: TrendPoint[];
  currency: CurrencyCode;
  gradientId: string;
}) {
  const areaFill = `${gradientId}-area`;
  const lineStroke = `${gradientId}-line`;

  const count = trendData.length;
  const lastX = LEFT + (count - 1) * STEP;
  const width = lastX + RIGHT_PAD;

  const dataMax = trendData.reduce(
    (max, point) => Math.max(max, point.earned),
    0,
  );
  const axisMax = niceCeil(dataMax);
  const yFor = (value: number) => BOTTOM - (value / axisMax) * PLOT_H;

  const points = trendData.map((point, index) => ({
    ...point,
    x: LEFT + index * STEP,
    y: yFor(point.earned),
  }));

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${point.x},${point.y.toFixed(1)}`,
    )
    .join(" ");
  const areaPath =
    count >= 2 ? `${linePath} L${lastX},${BOTTOM} L${LEFT},${BOTTOM} Z` : "";

  // First / today anchors. This component is only rendered for non-empty data,
  // so the guard is unreachable — it exists to satisfy noUncheckedIndexedAccess.
  const firstPoint = points[0];
  const today = points[count - 1];
  if (!firstPoint || !today) {
    return null;
  }

  // Peak — the max billed day. Its blossom crowns the column from ABOVE the
  // plot band; every plotted day still owns an identical, undecorated dot.
  const peak = points.reduce(
    (best, point) => (point.earned > best.earned ? point : best),
    firstPoint,
  );
  const showPeak = peak.earned > 0;
  const peakLabelX = clamp(peak.x, LEFT + 34, width - 34);
  const peakBloomX = clamp(peak.x - 10, 2, width - 22);

  const todayLabelY = today.y > 64 ? today.y - 12 : today.y + 22;

  const ariaLabel = showPeak
    ? `Area chart of daily billed earnings this month across ${count} ${count === 1 ? "day" : "days"}, COMPLETE lessons only. Peak ${formatCurrency(peak.earned, currency)} on day ${peak.label}.`
    : `Area chart of daily billed earnings this month across ${count} ${count === 1 ? "day" : "days"}. No billed earnings yet.`;

  return (
    <div className="flex flex-col">
      <div
        className="w-full overflow-x-auto"
        tabIndex={0}
        role="group"
        aria-label="Earnings trend, scroll to see every day"
      >
        <svg
          viewBox={`0 0 ${width} ${VIEW_H}`}
          role="img"
          aria-label={ariaLabel}
          style={{
            width: "100%",
            minWidth: `${width}px`,
            height: `${VIEW_H}px`,
          }}
          className="block"
        >
          <defs>
            <linearGradient id={areaFill} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--bubblegum)"
                stopOpacity="0.5"
              />
              <stop offset="52%" stopColor="var(--mint)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--floss)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={lineStroke} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--pink-500)" />
              <stop offset="100%" stopColor="var(--teal-600)" />
            </linearGradient>
          </defs>

          {/* gridlines — the faint scaffold; names nothing, so --line is legal */}
          <g stroke="var(--line)" strokeWidth="1">
            <line x1={LEFT} y1={TOP} x2={width - 16} y2={TOP} />
            <line x1={LEFT} y1={72} x2={width - 16} y2={72} />
            <line x1={LEFT} y1={MID} x2={width - 16} y2={MID} />
            <line x1={LEFT} y1={168} x2={width - 16} y2={168} />
            <line
              x1={LEFT}
              y1={BOTTOM}
              x2={width - 16}
              y2={BOTTOM}
              stroke="var(--line-strong)"
            />
          </g>

          {/* y axis · compact currency ticks */}
          <g
            fill="var(--ink-soft)"
            fontSize="11"
            fontWeight="600"
            textAnchor="end"
          >
            <text x="62" y={TOP + 4}>
              {formatCompactAmount(axisMax, currency)}
            </text>
            <text x="62" y={MID + 4}>
              {formatCompactAmount(axisMax / 2, currency)}
            </text>
            <text x="62" y={BOTTOM + 4}>
              0
            </text>
          </g>

          {/* area + line — the DATA layer, no ornament inside the plot band */}
          {areaPath && <path fill={`url(#${areaFill})`} d={areaPath} />}
          {count >= 2 && (
            <path
              fill="none"
              stroke={`url(#${lineStroke})`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              d={linePath}
            />
          )}

          {/* data dots — identical for every past day (today gets its own mark) */}
          <g fill="var(--surface)" stroke="var(--teal-600)" strokeWidth="2">
            {points.slice(0, -1).map((point) => (
              <circle key={point.day} cx={point.x} cy={point.y} r="3.4" />
            ))}
          </g>

          {/* peak — one blossom crowning the column from OUTSIDE the plot band */}
          {showPeak && (
            <>
              <text
                x={peakLabelX}
                y="34"
                fill="var(--teal-700)"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
              >
                {formatCurrency(peak.earned, currency)}
              </text>
              <Blossom
                x={peakBloomX}
                y={2}
                size={20}
                className="text-bubblegum"
              />
            </>
          )}

          {/* today marker */}
          <line
            x1={today.x}
            y1={TOP}
            x2={today.x}
            y2={BOTTOM}
            stroke="var(--bubblegum)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <circle
            cx={today.x}
            cy={today.y}
            r="7"
            fill="var(--bubblegum)"
            opacity="0.3"
          />
          <circle cx={today.x} cy={today.y} r="4" fill="var(--pink-600)" />
          <text
            x={today.x - 8}
            y={todayLabelY}
            fill="var(--pink-700)"
            fontSize="11"
            fontWeight="700"
            textAnchor="end"
          >
            Today
          </text>

          {/* x axis · day of month */}
          <g textAnchor="middle">
            {points.map((point, index) => (
              <text
                key={point.day}
                x={point.x}
                y="238"
                fill={
                  index === count - 1 ? "var(--pink-700)" : "var(--ink-soft)"
                }
                fontSize="11"
                fontWeight={index === count - 1 ? 700 : 600}
              >
                {point.label}
              </text>
            ))}
          </g>
          <text
            x={LEFT + (lastX - LEFT) / 2}
            y="262"
            fill="var(--ink-soft)"
            fontSize="10.5"
            textAnchor="middle"
            letterSpacing="1.4"
          >
            DAY OF MONTH
          </text>
        </svg>
      </div>

      {/* legend — names the marks only; no invented figures */}
      <p className="border-border text-ink-soft mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="block size-2.5 rounded-[3px]"
            style={{ background: "var(--pink-500)" }}
          />
          Billed (COMPLETE only)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="block size-2.5 rounded-full"
            style={{ background: "var(--bubblegum)" }}
          />
          Today
        </span>
      </p>
    </div>
  );
}
