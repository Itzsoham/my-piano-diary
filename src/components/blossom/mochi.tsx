"use client";

import { cn } from "@/lib/utils";
import { playMeow } from "@/lib/meow-sound";

/**
 * Mochi — the studio cat, ported verbatim from the mockups so the geometry is
 * identical everywhere she appears (dashboard-e / lessons-e / login). Two poses
 * share every measurement:
 *   <Mochi>       full, sat at her piano — heroes and empty states
 *   <MochiPeek>   head + paws, to hook over a card's top edge
 *
 * She is visually decorative (aria-hidden — nothing informational is lost to
 * assistive tech) but she does purr back on click: a tiny synthesized meow,
 * everywhere she appears in the app.
 */

type Mood = "content" | "delighted" | "sleepy";

function eyes(mood: Mood, y: number, lx: number, rx: number, r: number) {
  if (mood === "sleepy") {
    // Closed, happy arcs.
    return (
      <g fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round">
        <path d={`M${lx - 4} ${y}q4 3 8 0`} />
        <path d={`M${rx - 4} ${y}q4 3 8 0`} />
      </g>
    );
  }
  const rr = mood === "delighted" ? r + 0.6 : r;
  return (
    <g fill="var(--ink)">
      <circle cx={lx} cy={y} r={rr} />
      <circle cx={rx} cy={y} r={rr} />
      {mood === "delighted" && (
        <g fill="#fff">
          <circle cx={lx + 1} cy={y - 1} r={rr / 3} />
          <circle cx={rx + 1} cy={y - 1} r={rr / 3} />
        </g>
      )}
    </g>
  );
}

/** Full Mochi at the piano. */
export function Mochi({
  mood = "content",
  size = 132,
  className,
  bob = false,
  onClick,
  ...props
}: React.SVGProps<SVGSVGElement> & {
  mood?: Mood;
  size?: number;
  bob?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 132 108"
      width={size}
      height={(size * 108) / 132}
      aria-hidden="true"
      focusable="false"
      onClick={(event) => {
        playMeow();
        onClick?.(event);
      }}
      className={cn(
        "shrink-0 cursor-pointer transition-transform active:scale-90",
        bob && "motion-safe:animate-bob",
        className,
      )}
      {...props}
    >
      {/* piano */}
      <rect x="16" y="72" width="100" height="26" rx="5" fill="var(--ink)" />
      <rect x="20" y="76" width="92" height="18" rx="3" fill="var(--surface)" />
      <g fill="var(--ink)">
        <rect x="29" y="76" width="5" height="11" rx="1.4" />
        <rect x="42" y="76" width="5" height="11" rx="1.4" />
        <rect x="61" y="76" width="5" height="11" rx="1.4" />
        <rect x="74" y="76" width="5" height="11" rx="1.4" />
        <rect x="87" y="76" width="5" height="11" rx="1.4" />
      </g>
      {/* cat — ears up */}
      <path
        d="M46 34 L42 16 L58 26 Z"
        fill="var(--cotton)"
        stroke="var(--pink-500)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M86 34 L90 16 L74 26 Z"
        fill="var(--cotton)"
        stroke="var(--pink-500)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <ellipse
        cx="66"
        cy="46"
        rx="27"
        ry="24"
        fill="var(--surface)"
        stroke="var(--pink-500)"
        strokeWidth="2"
      />
      {eyes(mood, 44, 55, 77, 3)}
      <path
        d="M62 53q4 4 8 0"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="47" cy="52" r="4" fill="var(--cotton)" opacity="0.85" />
      <circle cx="85" cy="52" r="4" fill="var(--cotton)" opacity="0.85" />
      <g stroke="var(--ink-faint)" strokeWidth="1.5" strokeLinecap="round">
        <line x1="38" y1="46" x2="30" y2="43" />
        <line x1="38" y1="51" x2="29" y2="52" />
        <line x1="94" y1="46" x2="102" y2="43" />
        <line x1="94" y1="51" x2="103" y2="52" />
      </g>
      {/* paws on the keys */}
      <ellipse
        cx="52"
        cy="72"
        rx="7"
        ry="5"
        fill="var(--surface)"
        stroke="var(--pink-500)"
        strokeWidth="2"
      />
      <ellipse
        cx="80"
        cy="72"
        rx="7"
        ry="5"
        fill="var(--surface)"
        stroke="var(--pink-500)"
        strokeWidth="2"
      />
      {/* bow */}
      <path d="M88 26 l8 -6 v12 z" fill="var(--bubblegum)" />
      <path d="M104 26 l-8 -6 v12 z" fill="var(--bubblegum)" />
      <circle cx="96" cy="26" r="2.6" fill="var(--pink-600)" />
    </svg>
  );
}

/**
 * Mochi peeking — head + paws to hook over a card's top edge. Position her with
 * absolute placement so the paws (y≈57) sit on the card border. The parent card
 * needs `position: relative` and `overflow: visible`.
 */
export function MochiPeek({
  mood = "delighted",
  size = 92,
  className,
  onClick,
  ...props
}: React.SVGProps<SVGSVGElement> & {
  mood?: Mood;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 92 62"
      width={size}
      height={(size * 62) / 92}
      aria-hidden="true"
      focusable="false"
      onClick={(event) => {
        playMeow();
        onClick?.(event);
      }}
      className={cn(
        "cursor-pointer transition-transform active:scale-90",
        className,
      )}
      {...props}
    >
      {/* ears */}
      <path
        d="M22 30 L18 10 L34 21 Z"
        fill="var(--cotton)"
        stroke="var(--pink-500)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M62 30 L66 10 L50 21 Z"
        fill="var(--cotton)"
        stroke="var(--pink-500)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* head */}
      <ellipse
        cx="42"
        cy="38"
        rx="25"
        ry="22"
        fill="var(--surface)"
        stroke="var(--pink-500)"
        strokeWidth="2"
      />
      {eyes(mood, 36, 32, 52, 2.8)}
      <path
        d="M38 44q4 4 8 0"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="25" cy="43" r="3.6" fill="var(--cotton)" opacity="0.85" />
      <circle cx="59" cy="43" r="3.6" fill="var(--cotton)" opacity="0.85" />
      <g stroke="var(--ink-faint)" strokeWidth="1.4" strokeLinecap="round">
        <line x1="16" y1="38" x2="8" y2="35" />
        <line x1="16" y1="42" x2="7" y2="44" />
        <line x1="68" y1="38" x2="76" y2="35" />
        <line x1="68" y1="42" x2="77" y2="44" />
      </g>
      {/* bow */}
      <path d="M60 20 l7 -5 v10 z" fill="var(--bubblegum)" />
      <path d="M74 20 l-7 -5 v10 z" fill="var(--bubblegum)" />
      <circle cx="67" cy="20" r="2.3" fill="var(--pink-600)" />
      {/* paws hooked over the card edge */}
      <ellipse
        cx="20"
        cy="57"
        rx="7.5"
        ry="5"
        fill="var(--surface)"
        stroke="var(--pink-500)"
        strokeWidth="2"
      />
      <ellipse
        cx="64"
        cy="57"
        rx="7.5"
        ry="5"
        fill="var(--surface)"
        stroke="var(--pink-500)"
        strokeWidth="2"
      />
    </svg>
  );
}
