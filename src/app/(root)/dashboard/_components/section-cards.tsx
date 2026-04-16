"use client";

import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import {
  type LucideIcon,
  Wallet,
  ArrowDownRight,
  CheckCircle2,
  Clock,
} from "lucide-react";

export function SectionCards() {
  type DashboardOutput = RouterOutputs["earnings"]["getDashboard"];

  const { data: earnings, isLoading } =
    api.earnings.getDashboard.useQuery() as {
      data: DashboardOutput | undefined;
      isLoading: boolean;
    };
  const { currency } = useCurrency();

  const currentMonthEarnings = earnings?.currentMonthEarnings ?? 0;

  const cards: Array<{
    title: string;
    value: string;
    shell: string;
    titleClass: string;
    valueClass: string;
    icon: LucideIcon;
  }> = [
    {
      title: "This Month Revenue",
      value: isLoading
        ? "Almost ready..."
        : formatCurrency(currentMonthEarnings, currency),
      shell:
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(253,244,255,0.95),rgba(255,247,251,0.98))] shadow-lg",
      titleClass: "text-fuchsia-600",
      valueClass: "text-fuchsia-600",
      icon: Wallet,
    },
    {
      title: "Missed This Month",
      value: isLoading
        ? "Almost ready..."
        : formatCurrency(earnings?.currentMonthLoss ?? 0, currency),
      shell:
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,238,243,0.94),rgba(255,247,248,0.98))] shadow-lg",
      titleClass: "text-rose-500",
      valueClass: "text-rose-600",
      icon: ArrowDownRight,
    },
    {
      title: "Collected Last Month",
      value: isLoading
        ? "Almost ready..."
        : formatCurrency(earnings?.lastMonthCollected ?? 0, currency),
      shell:
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(236,253,245,0.95),rgba(248,255,252,0.98))] shadow-lg",
      titleClass: "text-emerald-600",
      valueClass: "text-emerald-600",
      icon: CheckCircle2,
    },
    {
      title: "Outstanding Last Month",
      value: isLoading
        ? "Almost ready..."
        : formatCurrency(earnings?.lastMonthOutstanding ?? 0, currency),
      shell:
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,251,235,0.96),rgba(255,247,237,0.98))] shadow-lg",
      titleClass: "text-amber-600",
      valueClass: "text-amber-500",
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-rose-950 sm:text-[2rem]">
          Dashboard Snapshot
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={`overflow-hidden rounded-[2rem] border-none backdrop-blur-xl transition-all duration-300 ease-out hover:shadow-xl ${card.shell}`}
            >
              <div className="flex h-full flex-col items-start justify-start p-8">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-5 shrink-0 items-center justify-center ${card.titleClass}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <p
                    className={`text-xs font-medium tracking-wide uppercase opacity-70 ${card.titleClass}`}
                  >
                    {card.title}
                  </p>
                </div>
                <p
                  className={`mt-3 text-[2rem] font-semibold tracking-tight tabular-nums ${card.valueClass}`}
                >
                  {card.value}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
