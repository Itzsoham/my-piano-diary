"use client";

import { Blossom, Petal } from "@/components/blossom/blossom";
import { TECH_STACK } from "@/components/landing/landing-data";
import { cn } from "@/lib/utils";

/**
 * The stack, as a strip that keeps moving. Fourteen pills is more than fits on
 * a phone, and a wrapped grid of logos reads as a badge wall — a slow loop lets
 * the list be long without taking a screen of height.
 *
 * The motion is decorative, so the whole track is aria-hidden and the same
 * names (with what each one does) are repeated in a visually hidden list. Under
 * prefers-reduced-motion the loop stops and the duplicate copy is removed. It
 * does NOT become a scrollable strip: an aria-hidden overflow container with
 * nothing focusable in it is a keyboard-focusable dead end in Chrome 127+, and
 * the sr-only list below already carries every name.
 *
 * The heading is deliberately given the same serif treatment as every other
 * section rather than being styled as a `.label`: this is a real <h2> that
 * names the section through aria-labelledby, and scrolling out of the FAQ into
 * a band where the page loses its voice reads as a missing style, not a choice.
 * It is set small because the strip is a footnote, not a chapter.
 */

/** Two identical copies + a -50% shift = one seamless loop with no JS. */
const MARQUEE_CSS = `
  .mpd-marquee-track {
    animation: mpd-marquee-scroll 46s linear infinite;
  }
  .mpd-marquee:hover .mpd-marquee-track {
    animation-play-state: paused;
  }
  @keyframes mpd-marquee-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .mpd-marquee-track { animation: none; transform: none; }
    .mpd-marquee-copy--dup { display: none; }
  }
`;

/** Fades the pills out at both edges instead of guillotining them. */
const EDGE_FADE = {
  maskImage:
    "linear-gradient(to right, transparent 0, #000 7%, #000 93%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(to right, transparent 0, #000 7%, #000 93%, transparent 100%)",
} as const;

const DOT_TONES = ["text-bubblegum", "text-wintergreen", "text-sand-300"];

function Copy({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div
      className={cn(
        "flex w-max shrink-0 items-center gap-3 pr-3",
        duplicate && "mpd-marquee-copy--dup",
      )}
    >
      {TECH_STACK.map((tech, i) => (
        <span
          key={tech.name}
          className="text-ink flex shrink-0 items-center gap-2 rounded-full border border-(--line) bg-white px-4 py-2 text-sm font-medium shadow-(--sh-xs)"
        >
          {i % 2 === 0 ? (
            <Blossom
              size={13}
              className={DOT_TONES[i % DOT_TONES.length] ?? "text-bubblegum"}
            />
          ) : (
            <Petal
              size={12}
              className={DOT_TONES[i % DOT_TONES.length] ?? "text-bubblegum"}
            />
          )}
          {tech.name}
        </span>
      ))}
    </div>
  );
}

export function TechMarquee() {
  return (
    <section
      aria-labelledby="tech-heading"
      className="w-full border-y border-(--line) bg-white/60 py-8 backdrop-blur"
    >
      <style>{MARQUEE_CSS}</style>

      <h2
        id="tech-heading"
        className="text-ink px-4 text-center font-serif text-[clamp(1.1rem,2.5vw,1.4rem)] font-bold"
      >
        The stack, if you are curious
      </h2>

      <div
        aria-hidden="true"
        className="mpd-marquee mt-5 overflow-hidden"
        style={EDGE_FADE}
      >
        <div className="mpd-marquee-track flex w-max items-center">
          <Copy />
          <Copy duplicate />
        </div>
      </div>

      {/* The same information, for assistive tech the marquee is hidden from. */}
      <ul className="sr-only">
        {TECH_STACK.map((tech) => (
          <li key={tech.name}>
            {tech.name} — {tech.hint}
          </li>
        ))}
      </ul>
    </section>
  );
}
