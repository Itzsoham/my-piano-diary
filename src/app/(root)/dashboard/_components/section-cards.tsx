"use client";

import { CreditCard, Heart, Users, Sparkles } from "lucide-react";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency";

export function SectionCards() {
  type DashboardOutput = RouterOutputs["earnings"]["getDashboard"];
  type StudentEarningsOutput = RouterOutputs["earnings"]["getByStudent"];

  const { data: earnings, isLoading } =
    api.earnings.getDashboard.useQuery() as {
      data: DashboardOutput | undefined;
      isLoading: boolean;
    };
  const { data: studentEarnings } = api.earnings.getByStudent.useQuery() as {
    data: StudentEarningsOutput | undefined;
    isLoading: boolean;
  };
  const { currency } = useCurrency();

  const totalStudents = studentEarnings?.length ?? 0;

  // Placeholder progress - logic could be more dynamic if we had a goal
  // For now, let's just make it look nice
  const progressPercentage = 65;

  return (
    <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:gap-4 lg:px-6 xl:grid-cols-4">
      {/* Total Earnings */}
      <Card className="group relative overflow-hidden rounded-2xl border bg-white/70 shadow-[0_8px_20px_-12px_rgba(244,114,182,0.3)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-12px_rgba(244,114,182,0.45)]">
        <div className="p-4 sm:p-6">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium sm:text-sm">
            <Heart className="size-3 fill-pink-500/20 text-pink-500 sm:size-4" />
            Total Earnings
          </div>

          <div className="mt-2">
            <p className="text-2xl font-semibold text-rose-600 tabular-nums sm:text-3xl">
              {isLoading
                ? "Almost ready…"
                : formatCurrency(earnings?.totalEarnings ?? 0, currency)}
            </p>
            <p className="text-muted-foreground/80 mt-2 flex items-center gap-1 text-xs">
              Earned from your beautiful teaching{" "}
              <Sparkles className="size-3 text-amber-400" />
            </p>
          </div>
        </div>
      </Card>

      {/* Current Month Earnings */}
      <Card className="group relative overflow-hidden rounded-2xl border bg-white/70 shadow-[0_8px_20px_-12px_rgba(244,114,182,0.3)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-12px_rgba(244,114,182,0.45)]">
        <div className="p-4 sm:p-6">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium sm:text-sm">
            <CreditCard className="size-3 text-purple-500 sm:size-4" />
            Current Month
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
              {new Date().toLocaleString("default", { month: "long" })}
            </p>
          </div>
        </div>
      </Card>

      {/* Active Students */}
      <Card className="group relative overflow-hidden rounded-2xl border bg-white/70 shadow-[0_8px_20px_-12px_rgba(244,114,182,0.3)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-12px_rgba(244,114,182,0.45)]">
        <div className="p-4 sm:p-6">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium sm:text-sm">
            <Users className="size-3 text-pink-500 sm:size-4" />
            Active Students
          </div>

          <div className="mt-2">
            <p className="text-2xl font-semibold text-rose-600 tabular-nums sm:text-3xl">
              {totalStudents}
            </p>
            <p className="text-muted-foreground/80 mt-2 flex items-center gap-1 text-xs">
              Students learning with you{" "}
              <Heart className="size-3 fill-pink-400 text-pink-400" />
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
