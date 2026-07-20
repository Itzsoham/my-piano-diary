"use client";

import { startOfDay, endOfDay } from "date-fns";

import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { api } from "@/trpc/react";

/**
 * The Blossom Diary hero band for the Lessons & Attendance screen: a soft
 * gradient band with two drifting blobs, the serif page title under a
 * hand-drawn squiggle, a literary subtitle, one honest narrative line built
 * from today's lessons, and Mochi bobbing beside it. Purely presentational —
 * decoration is aria-hidden.
 *
 * Unlike DashboardHero, this band does NOT carry the scalloped edge: per the
 * mockup (public/design-mockups/lessons-e.html), this screen spends its one
 * scallop on the river's sticky day headers, so the hero's bottom edge stays
 * plain — one scalloped edge per screen, and here it belongs downstream.
 */
export function LessonsHero() {
  const now = new Date();
  const { data: todayLessons = [] } = api.lesson.getAll.useQuery({
    from: startOfDay(now),
    to: endOfDay(now),
  });

  const count = todayLessons.length;
  const pendingCount = todayLessons.filter(
    (lesson) => lesson.status === "PENDING",
  ).length;

  // Honest, live narrative — never a fabricated figure. The Attendance page's
  // job is marking today's lessons, so "awaiting attendance" is the most
  // relevant thing to say about today's PENDING rows.
  const narrative =
    count === 0
      ? "No lessons on the books today — a quiet day on the bench 🎀"
      : pendingCount > 0
        ? `${count} lesson${count === 1 ? "" : "s"} today · ${pendingCount} awaiting attendance`
        : `${count} lesson${count === 1 ? "" : "s"} today · attendance all caught up`;

  const mochiMood =
    count === 0 ? "sleepy" : pendingCount === 0 ? "delighted" : "content";

  return (
    <section className="px-4 pt-4 lg:px-6">
      <div className="hero-band relative isolate overflow-hidden rounded-[calc(var(--radius)+12px)] px-6 py-7 shadow-[var(--sh)] sm:px-9 sm:py-9">
        {/* drifting blobs — decorative */}
        <div
          aria-hidden="true"
          className="bg-cotton/50 pointer-events-none absolute -top-10 -right-6 -z-10 size-40 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] motion-safe:animate-[drift_22s_ease-in-out_infinite]"
        />
        <div
          aria-hidden="true"
          className="bg-mint/40 pointer-events-none absolute -bottom-16 left-1/3 -z-10 size-44 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] motion-safe:animate-[drift_26s_ease-in-out_infinite]"
        />

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-block">
              <h1 className="bday-animate-title text-ink font-serif text-[clamp(1.6rem,3.4vw,2.3rem)] leading-tight font-bold">
                Lessons &amp;{" "}
                <span className="text-pink-700 italic">Attendance</span>
              </h1>
              <Squiggle className="text-bubblegum mt-0.5 h-2.5 w-full" />
            </div>
            <p className="mt-2 text-sm font-medium text-pink-700 italic sm:text-base">
              Track every beautiful session
            </p>
            <p className="text-ink-soft mt-1 flex items-center gap-1.5 text-sm sm:text-[15px]">
              <Blossom className="text-bubblegum" size={14} />
              {narrative}
            </p>
          </div>

          {/* Mochi bobbing beside the title — hidden on the narrowest phones
              so she never crowds the text. */}
          <Mochi
            mood={mochiMood}
            bob
            size={112}
            className="hidden shrink-0 sm:block"
          />
        </div>
      </div>
    </section>
  );
}
