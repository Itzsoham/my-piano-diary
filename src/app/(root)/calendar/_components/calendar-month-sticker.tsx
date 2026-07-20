"use client";

import { useCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StickerLesson {
  status: "PENDING" | "COMPLETE" | "CANCELLED";
  rate: number;
}

interface CalendarMonthStickerProps {
  className?: string;
  /** e.g. "July", "This week", "Today" — matches whatever range is loaded. */
  label: string;
  lessons: StickerLesson[];
}

/**
 * The one washi-tape card on the Calendar screen — a derived at-a-glance
 * summary. Every figure comes from the same `lessons` the grid renders, so it
 * can never drift out of sync. Carries money, so it wears tape + a piano-key
 * progress strip only — no blossoms/sparkles (THE ONE RULE).
 */
export function CalendarMonthSticker({
  className,
  label,
  lessons,
}: CalendarMonthStickerProps) {
  const { currency } = useCurrency();

  const summary = lessons.reduce(
    (acc, lesson) => {
      if (lesson.status === "COMPLETE") {
        acc.completeCount += 1;
        acc.billable += lesson.rate;
      } else if (lesson.status === "PENDING") {
        acc.pendingCount += 1;
      } else {
        acc.cancelledCount += 1;
      }
      return acc;
    },
    { completeCount: 0, pendingCount: 0, cancelledCount: 0, billable: 0 },
  );
  const total = lessons.length;
  const pct = total > 0 ? Math.round((summary.completeCount / total) * 100) : 0;

  return (
    <article
      className={cn(
        "relative mt-5 max-w-85 -rotate-1 rounded-[1.6rem] border border-(--line-pink) p-4.5 shadow-(--sh) transition-transform hover:rotate-0 hover:shadow-(--sh-lg)",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(160deg, var(--pink-50), var(--surface) 65%)",
      }}
    >
      {/* washi tape strip — decorative */}
      <span
        aria-hidden="true"
        className="border-wintergreen/45 absolute -top-3 left-[32%] h-6.5 w-33 -translate-x-1/2 rotate-[2.2deg] border-x-2 border-dashed opacity-90 shadow-(--sh-xs)"
        style={{
          backgroundImage:
            "linear-gradient(180deg, color-mix(in srgb, var(--mint) 82%, transparent), color-mix(in srgb, var(--cotton) 72%, transparent))",
        }}
      />

      <b className="text-ink block font-serif text-[1.05rem] leading-tight font-normal">
        {label} at a glance
      </b>
      <p className="text-ink-soft mt-2.5 text-[0.8rem] tabular-nums">
        <b className="text-ink font-bold">{total}</b> lesson
        {total === 1 ? "" : "s"} ·{" "}
        <b className="text-ink font-bold">{summary.completeCount}</b> complete ·{" "}
        <b className="text-ink font-bold">{summary.pendingCount}</b> pending ·{" "}
        <b className="text-ink font-bold">{summary.cancelledCount}</b> cancelled
      </p>
      <p className="text-ink mt-2 text-[1.2rem] leading-tight font-bold tracking-tight tabular-nums">
        {formatCurrency(summary.billable, currency)}
      </p>
      <p className="text-ink-soft mt-0.5 text-[0.72rem] font-medium">
        Billable — COMPLETE lessons only
      </p>

      <div className="mt-3.5">
        <span
          className="relative block h-3.5 overflow-hidden rounded-md"
          role="img"
          aria-label={`${summary.completeCount} of ${total} lessons marked complete — ${pct} percent`}
          style={{
            background: "var(--surface)",
            boxShadow: "inset 0 0 0 1px var(--line-strong)",
          }}
        >
          <i
            className="absolute inset-y-0 left-0 block"
            style={{
              width: `${pct}%`,
              backgroundImage: "var(--grad-mint)",
              borderRight: "1.5px solid var(--teal-600)",
            }}
          />
          {/* piano-key motif — masked off the filled portion so it never
              paints over the real value (THE ONE RULE: data stays legible) */}
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent 0 8px, var(--ink) 8px 14px, transparent 14px 20px, var(--ink) 20px 26px, transparent 26px 42px, var(--ink) 42px 48px, transparent 48px 54px, var(--ink) 54px 60px, transparent 60px 66px, var(--ink) 66px 72px, transparent 72px 84px)",
              backgroundSize: "84px 62%",
              backgroundRepeat: "repeat-x",
              backgroundPosition: "top left",
              WebkitMaskImage: `linear-gradient(90deg, transparent 0 ${pct}%, #000 ${pct}%)`,
              maskImage: `linear-gradient(90deg, transparent 0 ${pct}%, #000 ${pct}%)`,
              opacity: 0.5,
            }}
          />
        </span>
        <p className="text-ink-soft mt-1.5 flex justify-between text-[10px] font-semibold tabular-nums">
          <span>
            {summary.completeCount} of {total} marked complete
          </span>
          <span>{pct}%</span>
        </p>
      </div>
    </article>
  );
}
