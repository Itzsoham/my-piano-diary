"use client";

import type { ReactNode } from "react";

import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { Reveal } from "@/components/landing/reveal";
import { cn } from "@/lib/utils";

/**
 * The one section header on the page. Five sections were each drawing their own
 * eyebrow pill, serif h2, squiggle and lead paragraph, and they had quietly
 * drifted apart — different pill tracking, four different clamp() sizes, a
 * squiggle that was sometimes a fixed 11rem and sometimes the width of the
 * heading. Scrolling past them read as five pages rather than one, so the
 * treatment lives here and each section supplies only words.
 *
 * The squiggle is off by default and stays that way for all but one section.
 * It is meant to read as a hand-drawn mark, and a hand-drawn mark under every
 * single heading is just a horizontal rule with extra steps — the hero and the
 * closing CTA own theirs, and exactly one mid-page section is allowed to
 * answer them. When it is on, it is wrapped with the heading in an inline-block
 * so it grows to the heading's own width; an underline that overshoots the
 * words it underlines is the giveaway that it was not drawn by hand.
 *
 * `id` is required because every section is labelled by its heading through
 * aria-labelledby; passing the wrong one silently unnames the section.
 */
export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  tone = "pink",
  squiggle = false,
  className,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  /** Alternates down the page so consecutive sections do not both read pink. */
  tone?: "pink" | "mint";
  /** One section on the page at most. See the note above. */
  squiggle?: boolean;
  className?: string;
}) {
  return (
    <Reveal className={cn("mx-auto max-w-2xl text-center", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase",
          tone === "mint"
            ? "bg-mint text-teal-700"
            : "bg-pink-100 text-pink-700",
        )}
      >
        <Blossom size={12} />
        {eyebrow}
      </span>

      <div className="mt-4 inline-block max-w-full">
        <h2
          id={id}
          className="text-ink font-serif text-[clamp(1.8rem,4.6vw,2.9rem)] leading-tight font-bold text-balance"
        >
          {title}
        </h2>
        {squiggle && (
          <Squiggle className="text-bubblegum mx-auto mt-1 h-3 w-full" />
        )}
      </div>

      <p className="text-ink-soft mx-auto mt-4 text-base leading-relaxed text-pretty">
        {lead}
      </p>
    </Reveal>
  );
}
