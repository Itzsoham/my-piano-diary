"use client";

import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";

type ProfileHeroProps = {
  name: string | null;
};

/**
 * The Blossom Diary hero band for Profile — same anatomy as every other
 * screen's hero (scalloped gradient band, drifting blobs, serif title +
 * squiggle, bobbing Mochi), keeping the app's visual family consistent.
 */
export function ProfileHero({ name }: ProfileHeroProps) {
  const firstName = (name ?? "").trim().split(/\s+/)[0];

  return (
    <section className="px-4 pt-4 lg:px-6">
      <div className="hero-band scallop-b relative isolate overflow-hidden rounded-[calc(var(--radius)+12px)] px-6 py-7 shadow-(--sh) sm:px-9 sm:py-9">
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
              <h1 className="text-ink font-serif text-[clamp(1.6rem,3.4vw,2.3rem)] leading-tight font-bold">
                My Studio
              </h1>
              <Squiggle className="text-bubblegum mt-0.5 h-2.5 w-full" />
            </div>
            <p className="text-ink-soft mt-2 flex items-center gap-1.5 text-sm sm:text-[15px]">
              <Blossom className="text-bubblegum" size={14} />
              {firstName
                ? `Your personal space and preferences, ${firstName}`
                : "Your personal space and preferences"}
            </p>
          </div>

          <Mochi
            mood="content"
            bob
            size={100}
            className="hidden shrink-0 sm:block"
          />
        </div>
      </div>
    </section>
  );
}
