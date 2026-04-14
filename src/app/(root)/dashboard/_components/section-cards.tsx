"use client";

import {
  TrendingDown,
  CreditCard,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency";

export function SectionCards() {
  type DashboardOutput = RouterOutputs["earnings"]["getDashboard"];

  const { data: earnings, isLoading } =
    api.earnings.getDashboard.useQuery() as {
      data: DashboardOutput | undefined;
      isLoading: boolean;
    };
  const { currency } = useCurrency();

  // Determine last month name
  const now = new Date();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthName = lastMonthDate.toLocaleString("default", {
    month: "long",
  });

  // Placeholder progress - logic could be more dynamic if we had a goal
  const progressPercentage = 65;

  return (
    <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:gap-4 lg:px-6 xl:grid-cols-4">
      {/* 1st Card: Current Month Revenue */}
      <Card className="group relative overflow-hidden rounded-2xl border bg-white/70 shadow-[0_8px_20px_-12px_rgba(244,114,182,0.3)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-12px_rgba(244,114,182,0.45)]">
        <div className="p-4 sm:p-6">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium sm:text-sm">
            <CreditCard className="size-3 text-purple-500 sm:size-4" />
            Current Month Revenue
          </div>

          <div className="mt-2">
            <p className="text-2xl font-semibold text-rose-600 tabular-nums sm:text-3xl">
              {isLoading
                ? "Almost ready…"
                : formatCurrency(earnings?.currentMonthEarnings ?? 0, currency)}
            </p>

            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-pink-100">
                <div
                  className="h-full rounded-full bg-pink-400 transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <p className="text-muted-foreground/80 mt-2 text-xs">
              Revenue for{" "}
              {now.toLocaleString("default", { month: "long" })}
            </p>
          </div>
        </div>
      </Card>

      {/* 2nd Card: Missed Opportunities */}
      <Card className="group relative overflow-hidden rounded-2xl border bg-rose-50/50 shadow-[0_8px_20px_-12px_rgba(244,114,182,0.3)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-12px_rgba(244,114,182,0.45)]">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-medium text-rose-600/80 sm:text-sm">
            <TrendingDown className="size-3 sm:size-4" />
            Missed Opportunities
          </div>

          <div className="mt-2">
            <p className="text-2xl font-semibold text-rose-600/80 tabular-nums sm:text-3xl">
              {isLoading
                ? "Almost ready…"
                : formatCurrency(earnings?.currentMonthLoss ?? 0, currency)}
            </p>

            <div className="mt-auto pt-2">
              <Badge
                variant="secondary"
                className="border-none bg-rose-100 text-xs font-normal text-rose-600 hover:bg-rose-200"
              >
                Potential lost this month
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* 3rd Card: Payment Collected Last Month */}
      <Card className="group relative overflow-hidden rounded-2xl border bg-emerald-50/30 shadow-[0_8px_20px_-12px_rgba(16,185,129,0.2)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-12px_rgba(16,185,129,0.35)]">
        <div className="p-4 sm:p-6">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium sm:text-sm">
            <WalletCards className="size-3 text-emerald-500 sm:size-4" />
            Payment Last Month
          </div>

          <div className="mt-2">
            <p className="text-2xl font-semibold text-emerald-600 tabular-nums sm:text-3xl">
              {isLoading
                ? "Almost ready…"
                : formatCurrency(earnings?.lastMonthCollected ?? 0, currency)}
            </p>
            <p className="text-muted-foreground/80 mt-2 flex items-center gap-1 text-xs">
              Total cash collected in {lastMonthName}{" "}
              <Sparkles className="size-3 text-amber-400" />
            </p>
          </div>
        </div>
      </Card>

      {/* 4th Card: Outstanding Last Month */}
      <Card className="group relative overflow-hidden rounded-2xl border bg-amber-50/50 shadow-[0_8px_20px_-12px_rgba(245,158,11,0.2)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-12px_rgba(245,158,11,0.35)]">
        <div className="p-4 sm:p-6">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium sm:text-sm">
            <TrendingDown className="size-3 text-amber-500 sm:size-4" />
            Outstanding Last Month
          </div>

          <div className="mt-2">
            <p className="text-2xl font-semibold text-amber-700 tabular-nums sm:text-3xl">
              {isLoading
                ? "Almost ready…"
                : formatCurrency(earnings?.lastMonthOutstanding ?? 0, currency)}
            </p>
            <p className="text-muted-foreground/80 mt-2 text-xs">
              Pending dues from {lastMonthName}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
