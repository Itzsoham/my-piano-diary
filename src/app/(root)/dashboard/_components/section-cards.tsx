"use client";

import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { useBirthday } from "@/components/birthday/birthday-provider";
import { Blossom } from "@/components/blossom/blossom";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

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

  // Month-elapsed progress for the Revenue tile's piano-key strip. Derived
  // client-side from the local date after mount, so SSR and hydration never
  // disagree across timezones (the earnings query exposes no day-of-month).
  const [monthElapsed, setMonthElapsed] = useState<{
    day: number;
    days: number;
    pct: number;
    month: string;
  } | null>(null);

  useEffect(() => {
    const now = new Date();
    const day = now.getDate();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    setMonthElapsed({
      day,
      days,
      pct: Math.round((day / days) * 100),
      month: MONTH_NAMES[now.getMonth()]!,
    });
  }, []);

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

  // A candy tile per KPI. The frame blooms (corner blossom, base accent); the
  // number itself stays sober — undecorated, tabular, in its family ink.
  const cards: Array<{
    title: string;
    rawValue: number;
    animatedValue: number;
    washBg: string;
    borderClass: string;
    labelClass: string;
    valueClass: string;
    bloomClass: string;
    ruleStyle?: React.CSSProperties;
    isRevenue?: boolean;
    isSpoiler?: boolean;
    glowDelay: string;
    bdaySubtitle: string;
  }> = [
    {
      title: "This Month Revenue",
      rawValue: currentMonthEarnings,
      animatedValue: animatedRevenue,
      washBg: "linear-gradient(160deg, var(--pink-100), var(--surface) 70%)",
      borderClass: "border-pink-200/70",
      labelClass: "text-pink-700",
      valueClass: "text-ink",
      bloomClass: "text-bubblegum opacity-50",
      isRevenue: true,
      glowDelay: "0s",
      bdaySubtitle: bdaySubtitles[0]!,
    },
    {
      title: "Missed This Month",
      rawValue: missedAmount,
      animatedValue: animatedMissed,
      washBg: "linear-gradient(160deg, var(--no-bg), var(--surface) 72%)",
      borderClass: "border-pink-200/70",
      labelClass: "text-no-fg",
      valueClass: "text-no-fg",
      bloomClass: "text-no-dot opacity-50",
      ruleStyle: { background: "var(--grad-pink)" },
      isSpoiler: true,
      glowDelay: "0.75s",
      bdaySubtitle: bdaySubtitles[1]!,
    },
    {
      title: "Collected Last Month",
      rawValue: collectedAmount,
      animatedValue: animatedCollected,
      washBg: "linear-gradient(160deg, var(--teal-100), var(--surface) 70%)",
      borderClass: "border-teal-200/70",
      labelClass: "text-ok-fg",
      valueClass: "text-ok-fg",
      bloomClass: "text-ok-dot opacity-60",
      ruleStyle: {
        background: "linear-gradient(90deg, var(--wintergreen), var(--mint))",
      },
      glowDelay: "1.5s",
      bdaySubtitle: bdaySubtitles[2]!,
    },
    {
      title: "Outstanding Last Month",
      rawValue: outstandingAmount,
      animatedValue: animatedOutstanding,
      washBg: "linear-gradient(160deg, var(--sand-100), var(--surface) 70%)",
      borderClass: "border-sand-300/60",
      labelClass: "text-wait-fg",
      valueClass: "text-wait-fg",
      bloomClass: "text-wait-dot opacity-70",
      ruleStyle: {
        background: "linear-gradient(90deg, var(--sand-300), var(--cotton))",
      },
      glowDelay: "2.25s",
      bdaySubtitle: bdaySubtitles[3]!,
    },
  ];

  return (
    <div className="px-4 lg:px-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => {
          const displayValue = isLoading
            ? "Almost ready..."
            : formatCurrency(
                isBirthdayMode ? card.animatedValue : card.rawValue,
                currency,
              );

          const isHidden = card.isSpoiler && !isMissedRevealed;

          const cardStyle = {
            "--i": i,
            background: card.washBg,
            ...(isBirthdayMode
              ? {
                  animation: "bday-glow-pulse 3s ease-in-out infinite",
                  animationDelay: card.glowDelay,
                }
              : {}),
          } as React.CSSProperties;

          return (
            <Card
              key={card.title}
              style={cardStyle}
              className={cn(
                "rise relative flex min-h-42 flex-col overflow-hidden rounded-[calc(var(--radius)+8px)] border p-5 shadow-(--sh)",
                card.borderClass,
              )}
            >
              {/* Corner blossom — the tile's single family ornament (decorative). */}
              <Blossom
                size={58}
                className={cn(
                  "absolute -top-2.5 -right-2.5 z-0",
                  card.bloomClass,
                )}
              />

              <div className="relative z-10 flex min-w-0 flex-1 flex-col">
                <span
                  className={cn(
                    "pr-11 text-[11px] font-semibold tracking-[0.08em] uppercase",
                    card.labelClass,
                  )}
                >
                  {card.title}
                </span>

                {/* The data layer — blurred only for the spoiler, never emoji-fied. */}
                <div
                  className={cn(
                    "mt-2.5 flex flex-1 flex-col transition-[filter,opacity] duration-500",
                    isHidden && "opacity-40 blur-md select-none",
                  )}
                >
                  <span
                    className={cn(
                      "text-[1.5rem] leading-tight font-semibold tracking-tight whitespace-nowrap tabular-nums",
                      card.valueClass,
                    )}
                  >
                    {displayValue}
                  </span>

                  {isBirthdayMode && (
                    <span className="text-muted-foreground mt-2 text-[11px] italic">
                      {card.bdaySubtitle}
                    </span>
                  )}

                  {/* Base accent: piano-key strip on Revenue, a thin family rule elsewhere. */}
                  {card.isRevenue ? (
                    <div className="mt-auto pt-4">
                      {/* DATA-bearing: the empty keyboard is the track, the
                          pink fill is how much of the month has elapsed. */}
                      <span
                        className="relative block h-3.5 overflow-hidden rounded-md"
                        role="img"
                        aria-label={
                          monthElapsed
                            ? `Day ${monthElapsed.day} of ${monthElapsed.days} — ${monthElapsed.pct}% of ${monthElapsed.month} elapsed`
                            : "Month elapsed"
                        }
                        style={
                          {
                            "--p": monthElapsed ? `${monthElapsed.pct}%` : "0%",
                            background: "var(--surface)",
                            boxShadow: "inset 0 0 0 1px var(--line-strong)",
                          } as React.CSSProperties
                        }
                      >
                        <i
                          className="absolute inset-y-0 left-0 block transition-[width] duration-700 ease-out"
                          style={{
                            width: "var(--p)",
                            background: "var(--grad-pink)",
                            borderRight: "1.5px solid var(--pink-600)",
                          }}
                        />
                        <span
                          className="absolute inset-0"
                          style={{
                            backgroundImage:
                              "repeating-linear-gradient(90deg, transparent 0 8px, var(--ink) 8px 14px, transparent 14px 20px, var(--ink) 20px 26px, transparent 26px 42px, var(--ink) 42px 48px, transparent 48px 54px, var(--ink) 54px 60px, transparent 60px 66px, var(--ink) 66px 72px, transparent 72px 84px)",
                            backgroundSize: "84px 62%",
                            backgroundRepeat: "repeat-x",
                            backgroundPosition: "top left",
                            WebkitMaskImage:
                              "linear-gradient(90deg, transparent 0 var(--p), #000 var(--p))",
                            maskImage:
                              "linear-gradient(90deg, transparent 0 var(--p), #000 var(--p))",
                            opacity: 0.5,
                          }}
                        />
                      </span>
                      <span className="text-ink-soft mt-1.5 flex justify-between text-[10.5px] font-semibold tabular-nums">
                        <span>
                          {monthElapsed ? `Day ${monthElapsed.day}` : "Day —"}
                        </span>
                        <span>
                          {monthElapsed
                            ? `${monthElapsed.days} days`
                            : "— days"}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="mt-auto pt-4" aria-hidden>
                      <span
                        className="block h-0.75 rounded-full"
                        style={card.ruleStyle}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Spoiler reveal — the whole tile is the hit area (touch + keyboard). */}
              {isHidden && (
                <button
                  type="button"
                  onClick={() => setIsMissedRevealed(true)}
                  aria-label="Reveal missed revenue this month"
                  className="group absolute inset-0 z-20 grid cursor-pointer place-items-center focus-visible:outline-none"
                  style={{
                    background:
                      "linear-gradient(160deg, color-mix(in srgb, var(--cotton) 52%, transparent), color-mix(in srgb, var(--surface) 42%, transparent))",
                  }}
                >
                  <span
                    className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-xs font-semibold text-pink-700 shadow-(--sh-sm) transition-transform duration-200 group-hover:-translate-y-px group-focus-visible:-translate-y-px group-focus-visible:ring-2 group-focus-visible:ring-pink-500"
                    style={{
                      background:
                        "color-mix(in srgb, var(--surface) 94%, transparent)",
                      borderColor: "var(--line-pink)",
                    }}
                  >
                    <Eye className="size-4" aria-hidden />
                    Click to reveal
                  </span>
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
