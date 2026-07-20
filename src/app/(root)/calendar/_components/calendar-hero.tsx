"use client";

import Link from "next/link";
import { List, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { Button } from "@/components/ui/button";
import { getBrowserTimezone, formatInTimezone } from "@/lib/timezone";

type CalendarHeroProps = {
  lessonCount: number;
  rangeLabel: string;
  onAddLesson: () => void;
};

/**
 * The Blossom Diary hero band for Calendar — same anatomy as the Dashboard
 * hero (scalloped gradient band, drifting blobs, serif title + squiggle,
 * bobbing Mochi) plus the page's own actions (List view / Add lesson), which
 * the mockup places beside Mochi in the hero's right-hand column.
 */
export function CalendarHero({
  lessonCount,
  rangeLabel,
  onAddLesson,
}: CalendarHeroProps) {
  const { data: session } = useSession();
  const timezone = session?.user?.timezone ?? getBrowserTimezone();
  const dateLine = formatInTimezone(new Date(), timezone, "EEEE, MMMM do");

  const narrative =
    lessonCount === 0
      ? `A quiet ${rangeLabel} 🎀 — nothing scheduled.`
      : `${lessonCount} lesson${lessonCount === 1 ? "" : "s"} this ${rangeLabel}`;

  return (
    <section className="px-4 pt-4 lg:px-6">
      <div className="hero-band scallop-b relative isolate overflow-hidden rounded-[calc(var(--radius)+12px)] px-6 py-7 shadow-(--sh) sm:px-9 sm:py-9">
        {/* drifting blobs — decorative */}
        <div
          aria-hidden="true"
          className="bg-cotton/50 pointer-events-none absolute -top-10 -right-6 -z-10 size-40 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] motion-safe:animate-[drift_22s_ease-in-out_infinite]"
        />
        <div
          aria-hidden="true"
          className="bg-mint/40 pointer-events-none absolute -bottom-16 left-1/3 -z-10 size-44 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] motion-safe:animate-[drift_26s_ease-in-out_infinite]"
        />

        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <div className="inline-block">
              <h1 className="bday-animate-title text-ink font-serif text-[clamp(1.6rem,3.4vw,2.3rem)] leading-tight font-bold">
                Calendar
              </h1>
              <Squiggle className="text-bubblegum mt-0.5 h-2.5 w-full" />
            </div>
            <p className="mt-2 text-sm font-medium text-pink-700 italic sm:text-base">
              {dateLine}
            </p>
            <p className="text-ink-soft mt-1 flex items-center gap-1.5 text-sm sm:text-[15px]">
              <Blossom className="text-bubblegum" size={14} />
              {narrative}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Mochi
              mood={lessonCount === 0 ? "sleepy" : "content"}
              bob
              size={68}
              className="hidden shrink-0 sm:block"
            />
            <Button
              asChild
              variant="outline"
              className="border-border bg-card text-ink h-11 rounded-full px-4 shadow-(--sh-xs) hover:bg-(--surface-2)"
            >
              <Link href="/lessons">
                <List className="mr-1.5 size-4" aria-hidden="true" />
                List view
              </Link>
            </Button>
            <Button
              onClick={onAddLesson}
              className="h-11 rounded-full [background-image:var(--grad-pink)] px-5 text-white shadow-(--sh-pink) hover:brightness-105"
            >
              <Plus className="mr-1.5 size-4" aria-hidden="true" />
              Add lesson
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
