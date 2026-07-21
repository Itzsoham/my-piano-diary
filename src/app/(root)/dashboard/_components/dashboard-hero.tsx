"use client";

import { startOfDay, endOfDay } from "date-fns";
import { useSession } from "next-auth/react";

import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { useUserStore } from "@/store/use-user-store";
import { useCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import { formatInTimezone, getBrowserTimezone } from "@/lib/timezone";
import { api } from "@/trpc/react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * The Blossom Diary hero band: a soft gradient with a scalloped underside and
 * two drifting blobs behind it, a serif greeting under a hand-drawn squiggle,
 * today's date, one warm narrative line built from live data, and Mochi bobbing
 * beside it. Purely presentational — decoration is aria-hidden.
 */
export function DashboardHero() {
  const { data: session } = useSession();
  const { user: storeUser } = useUserStore();
  const { currency } = useCurrency();

  const user = storeUser ?? session?.user ?? null;
  const firstName = (user?.name ?? "there").trim().split(/\s+/)[0];
  const timezone = session?.user?.timezone ?? getBrowserTimezone();

  const now = new Date();
  const { data: todayLessons = [] } = api.lesson.getAll.useQuery({
    from: startOfDay(now),
    to: endOfDay(now),
  });

  // Expected today = sum of every scheduled lesson's rate. (This is an at-a-
  // glance figure for the day, not a billed total.)
  const expectedToday = todayLessons.reduce(
    (sum, lesson) => sum + (lesson.rate ?? 0),
    0,
  );
  const count = todayLessons.length;

  const dateLine = formatInTimezone(now, timezone, "EEEE, MMMM do");

  const narrative =
    count === 0
      ? "A quiet day 🎀 — no lessons scheduled."
      : `${count} lesson${count === 1 ? "" : "s"} today · ${formatCurrency(
          expectedToday,
          currency,
        )} expected`;

  return (
    <section className="px-4 pt-4 lg:px-6">
      <div className="hero-band scallop-b relative isolate overflow-hidden rounded-[calc(var(--radius)+12px)] px-6 py-7 shadow-(--sh) sm:px-9 sm:py-9">
        {/* drifting blobs — decorative */}
        <div
          aria-hidden="true"
          className="bg-cotton/50 motion-safe:animate-drift pointer-events-none absolute -top-10 -right-6 -z-10 size-40 rounded-[46%_54%_40%_60%/55%_45%_60%_40%]"
        />
        <div
          aria-hidden="true"
          className="bg-mint/40 pointer-events-none absolute -bottom-16 left-1/3 -z-10 size-44 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] motion-safe:animate-[drift_26s_ease-in-out_infinite]"
        />

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-block">
              <h1 className="text-ink flex items-center gap-2 font-serif text-[clamp(1.6rem,3.4vw,2.3rem)] leading-tight font-bold">
                {getGreeting()}, {firstName}
                <span aria-hidden="true">✨</span>
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

          {/* Mochi bobbing beside the greeting — hidden on the narrowest phones
              so she never crowds the text. */}
          <Mochi
            mood={count === 0 ? "sleepy" : "content"}
            bob
            size={112}
            className="hidden shrink-0 sm:block"
          />
        </div>
      </div>
    </section>
  );
}
