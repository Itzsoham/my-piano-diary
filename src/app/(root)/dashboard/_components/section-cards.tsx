"use client";

import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { useBirthday } from "@/components/birthday/birthday-provider";
import { useEffect, useRef, useState } from "react";
import {
  type LucideIcon,
  Wallet,
  ArrowDownRight,
  CheckCircle2,
  Clock,
} from "lucide-react";

// Smooth count-up hook
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

export function SectionCards() {
  type DashboardOutput = RouterOutputs["earnings"]["getDashboard"];

  const { data: earnings, isLoading } =
    api.earnings.getDashboard.useQuery() as {
      data: DashboardOutput | undefined;
      isLoading: boolean;
    };
  const { currency } = useCurrency();
  const { isBirthdayMode } = useBirthday();
  const [isMissedRevealed, setIsMissedRevealed] = useState(false);

  const currentMonthEarnings = earnings?.currentMonthEarnings ?? 0;
  const missedAmount = earnings?.currentMonthLoss ?? 0;
  const collectedAmount = earnings?.lastMonthCollected ?? 0;
  const outstandingAmount = earnings?.lastMonthOutstanding ?? 0;

  // Count-up values (only animate in birthday mode)
  const animatedRevenue = useCountUp(isBirthdayMode ? currentMonthEarnings : 0);
  const animatedMissed = useCountUp(isBirthdayMode ? missedAmount : 0);
  const animatedCollected = useCountUp(isBirthdayMode ? collectedAmount : 0);
  const animatedOutstanding = useCountUp(
    isBirthdayMode ? outstandingAmount : 0,
  );

  const bdaySubtitles = [
    "Your hard work is blooming 🌸",
    "Every day is a fresh start ✨",
    "You're doing amazing 💛",
    "Almost there, keep going 🎹",
  ];

  const cards: Array<{
    title: string;
    rawValue: number;
    animatedValue: number;
    shell: string;
    titleClass: string;
    valueClass: string;
    hoverShadow: string;
    borderClass: string;
    icon: LucideIcon;
    glowDelay: string;
    bdaySubtitle: string;
    isSpoiler?: boolean;
  }> = [
    {
      title: "This Month Revenue",
      rawValue: currentMonthEarnings,
      animatedValue: animatedRevenue,
      shell:
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(253,244,255,0.95),rgba(255,247,251,0.98))]",
      hoverShadow: "hover:shadow-[0_15px_30px_-12px_rgba(192,38,211,0.15)]",
      borderClass: "border-fuchsia-200/80",
      titleClass: "text-fuchsia-600",
      valueClass: "text-fuchsia-600",
      icon: Wallet,
      glowDelay: "0s",
      bdaySubtitle: bdaySubtitles[0]!,
    },
    {
      title: "Missed This Month",
      rawValue: missedAmount,
      animatedValue: animatedMissed,
      shell:
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,238,243,0.94),rgba(255,247,248,0.98))]",
      hoverShadow: "hover:shadow-[0_15px_30px_-12px_rgba(225,29,72,0.15)]",
      borderClass: "border-rose-200/80",
      titleClass: "text-rose-500",
      valueClass: "text-rose-600",
      icon: ArrowDownRight,
      glowDelay: "0.75s",
      bdaySubtitle: bdaySubtitles[1]!,
      isSpoiler: true,
    },
    {
      title: "Collected Last Month",
      rawValue: collectedAmount,
      animatedValue: animatedCollected,
      shell:
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(236,253,245,0.95),rgba(248,255,252,0.98))]",
      hoverShadow: "hover:shadow-[0_15px_30px_-12px_rgba(5,150,105,0.15)]",
      borderClass: "border-emerald-200/80",
      titleClass: "text-emerald-600",
      valueClass: "text-emerald-600",
      icon: CheckCircle2,
      glowDelay: "1.5s",
      bdaySubtitle: bdaySubtitles[2]!,
    },
    {
      title: "Outstanding Last Month",
      rawValue: outstandingAmount,
      animatedValue: animatedOutstanding,
      shell:
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,251,235,0.96),rgba(255,247,237,0.98))]",
      hoverShadow: "hover:shadow-[0_15px_30px_-12px_rgba(217,119,6,0.15)]",
      borderClass: "border-amber-200/80",
      titleClass: "text-amber-600",
      valueClass: "text-amber-500",
      icon: Clock,
      glowDelay: "2.25s",
      bdaySubtitle: bdaySubtitles[3]!,
    },
  ];

  return (
    <div className="px-4 lg:px-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const displayValue = isLoading
            ? "Almost ready..."
            : formatCurrency(
                isBirthdayMode ? card.animatedValue : card.rawValue,
                currency,
              );

          const isHidden = card.isSpoiler && !isMissedRevealed;

          return (
            <Card
              key={card.title}
              className={`overflow-hidden rounded-[2rem] border ${card.borderClass} shadow-xs backdrop-blur-xl transition-all duration-300 ease-out ${card.hoverShadow} ${card.shell} ${isHidden ? "cursor-pointer group" : ""}`}
              style={
                isBirthdayMode
                  ? {
                      animation: `bday-glow-pulse 3s ease-in-out infinite`,
                      animationDelay: card.glowDelay,
                    }
                  : undefined
              }
              onClick={() => {
                if (card.isSpoiler) setIsMissedRevealed(true);
              }}
            >
              <div className={`flex h-full flex-col items-start justify-start p-8 transition-all duration-300 ${isHidden ? "blur-md select-none opacity-40" : ""}`}>
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
                  className={`mt-3 text-[2rem] font-semibold tracking-tight tabular-nums transition-all duration-300 ${card.valueClass}`}
                >
                  {displayValue}
                </p>
                {isBirthdayMode && (
                  <p className="text-muted-foreground/70 mt-1.5 text-[11px] italic">
                    {card.bdaySubtitle}
                  </p>
                )}
              </div>
              {isHidden && (
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-rose-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Click to reveal
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
