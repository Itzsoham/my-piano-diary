import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";

interface StudentsHeroProps {
  /** Studio's total student count, from the same server-side fetch the page
   * already made — avoids a redundant client round-trip (and the resulting
   * flash of the zero-state) for data the page already has in hand. */
  count: number;
}

/**
 * The Blossom Diary hero band for the Students screen: a soft gradient with a
 * scalloped underside and two drifting blobs behind it, a serif "Students"
 * heading under a hand-drawn squiggle, one warm narrative line built from live
 * data (the studio's student count), and Mochi bobbing beside it. Purely
 * presentational — decoration is aria-hidden. Mirrors dashboard-hero.tsx.
 */
export function StudentsHero({ count }: StudentsHeroProps) {
  const narrative =
    count === 0
      ? "Your garden is just getting started 🌱 — add your first student to begin."
      : `Your garden of ${count} student${count === 1 ? "" : "s"} — rates, notes, and attendance, all in one place.`;

  return (
    <section className="px-4 pt-4 lg:px-6">
      <div className="hero-band scallop-b relative isolate overflow-hidden rounded-[calc(var(--radius)+12px)] px-6 py-7 shadow-[var(--sh)] sm:px-9 sm:py-9">
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
              <h1 className="bday-animate-title text-ink flex items-center gap-2 font-serif text-[clamp(1.6rem,3.4vw,2.3rem)] leading-tight font-bold">
                Students
              </h1>
              <Squiggle className="text-bubblegum mt-0.5 h-2.5 w-full" />
            </div>
            <p className="text-ink-soft mt-2 flex items-center gap-1.5 text-sm sm:text-[15px]">
              <Blossom className="text-bubblegum" size={14} />
              {narrative}
            </p>
          </div>

          {/* Mochi bobbing beside the heading — hidden on the narrowest phones
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
