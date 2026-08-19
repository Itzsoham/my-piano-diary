"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Github } from "lucide-react";

import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { LINKS } from "@/components/landing/landing-data";
import { useStableReducedMotion } from "@/components/landing/reveal";
import { useSound } from "@/components/landing/sound";
import { cn } from "@/lib/utils";

/**
 * The first screen: the promise on the left, a piano you can actually play on
 * the right.
 *
 * The keyboard is the whole argument in one object — this is a diary for
 * someone who teaches piano, so the hero lets you touch a piano before it asks
 * you for anything. Every key is a real <button> with its own aria-label, so it
 * is playable by keyboard and announced properly, and the two sizes below/above
 * `sm` exist so a phone gets seven fat keys instead of fourteen slivers.
 *
 * It costs the page one tab stop, not twenty-four: the keys are a roving
 * tabindex toolbar, so Tab lands on the piano once and the arrow keys walk it.
 * Anything else would make a keyboard visitor press Tab two dozen times to get
 * past the hero, and the skip link cannot help — it targets #main, which starts
 * above the piano.
 */

/** Semitone offsets are measured from A4 (440Hz), which is what playNote takes. */
type PianoKey = { note: string; label: string; semitone: number };
type BlackKey = PianoKey & { after: number };

const WHITE_KEYS: readonly PianoKey[] = [
  { note: "C4", label: "C4", semitone: -9 },
  { note: "D4", label: "D4", semitone: -7 },
  { note: "E4", label: "E4", semitone: -5 },
  { note: "F4", label: "F4", semitone: -4 },
  { note: "G4", label: "G4", semitone: -2 },
  { note: "A4", label: "A4", semitone: 0 },
  { note: "B4", label: "B4", semitone: 2 },
  { note: "C5", label: "C5", semitone: 3 },
  { note: "D5", label: "D5", semitone: 5 },
  { note: "E5", label: "E5", semitone: 7 },
  { note: "F5", label: "F5", semitone: 8 },
  { note: "G5", label: "G5", semitone: 10 },
  { note: "A5", label: "A5", semitone: 12 },
  { note: "B5", label: "B5", semitone: 14 },
];

/** Tagged so one sorted list can hold both lanes and still narrow cleanly. */
type LaidOutKey =
  | { kind: "white"; key: PianoKey }
  | { kind: "black"; key: BlackKey };

/** `after` is the index of the white key each black key sits behind. */
const BLACK_KEYS: readonly BlackKey[] = [
  { note: "C#4", label: "C sharp 4", semitone: -8, after: 0 },
  { note: "D#4", label: "D sharp 4", semitone: -6, after: 1 },
  { note: "F#4", label: "F sharp 4", semitone: -3, after: 3 },
  { note: "G#4", label: "G sharp 4", semitone: -1, after: 4 },
  { note: "A#4", label: "A sharp 4", semitone: 1, after: 5 },
  { note: "C#5", label: "C sharp 5", semitone: 4, after: 7 },
  { note: "D#5", label: "D sharp 5", semitone: 6, after: 8 },
  { note: "F#5", label: "F sharp 5", semitone: 9, after: 10 },
  { note: "G#5", label: "G sharp 5", semitone: 11, after: 11 },
  { note: "A#5", label: "A sharp 5", semitone: 13, after: 12 },
];

/** A bright C-major-ish spread, played when the demo button is hovered. */
const WELCOME_CHORD = [3, 7, 10, 15];

const TRUST = [
  "59 tests over the maths that bills people",
  "Timezone-correct by construction",
  "Your own Postgres, your own data",
];

/* Written out in full rather than composed from a variable: Tailwind scans the
   source text for whole class names, so a `hover:${...}` template would never
   be generated. */
const KEY_PRESS =
  "hover:translate-y-0.75 hover:scale-y-98 focus-visible:translate-y-0.75 focus-visible:scale-y-98 active:translate-y-0.75 active:scale-y-98";
const KEY_PRESSED = "translate-y-0.75 scale-y-98";

/** One quaver, used three times as a rising note above the keys. */
function NoteGlyph({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none absolute", className)}
    >
      <g fill="currentColor">
        <ellipse cx="9" cy="18" rx="5" ry="3.6" transform="rotate(-18 9 18)" />
        <path d="M13 17V4c0-.7.5-1.1 1.1-1 3.4.7 5.8 2.5 7 5.2.3.7-.6 1.3-1.1.7-1.4-1.7-3.1-2.7-5-3.1V17z" />
      </g>
    </svg>
  );
}

/**
 * A playable stretch of keyboard. Rendered as positioned buttons rather than
 * one SVG so each key can be focused, labelled and pressed on its own; the
 * black keys are placed on the seams by percentage, which is why the white keys
 * carry no gap — the seam has to be exactly where the maths says it is.
 *
 * The keys are emitted in pitch order — C4, C#4, D4, D#4 … — so the DOM order
 * matches what the eye sees left to right. The black keys are absolutely
 * positioned and therefore out of flow, so interleaving them costs the white
 * keys' flex layout nothing.
 *
 * Focus is roving: the whole row is one tab stop, the arrow keys walk it (and
 * play as they go, which is what a piano does), and Home/End jump to the ends.
 */
function Keyboard({
  whiteCount,
  heightClass,
  className,
}: {
  whiteCount: number;
  heightClass: string;
  className?: string;
}) {
  const { playNote } = useSound();
  const [pressed, setPressed] = useState<string | null>(null);
  const [focused, setFocused] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const strike = useCallback(
    (key: PianoKey) => {
      playNote(key.semitone);
      setPressed(key.note);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setPressed(null), 170);
    },
    [playNote],
  );

  const unit = 100 / whiteCount;
  const blackWidth = unit * 0.6;

  /** Every key this instance shows, sorted by pitch = sorted left to right. */
  const keys = useMemo<LaidOutKey[]>(() => {
    const whites = WHITE_KEYS.slice(0, whiteCount).map<LaidOutKey>((key) => ({
      kind: "white",
      key,
    }));
    const blacks = BLACK_KEYS.filter(
      (key) => key.after < whiteCount - 1,
    ).map<LaidOutKey>((key) => ({ kind: "black", key }));

    return [...whites, ...blacks].sort(
      (a, b) => a.key.semitone - b.key.semitone,
    );
  }, [whiteCount]);

  const moveTo = useCallback(
    (index: number) => {
      const next = (index + keys.length) % keys.length;
      const entry = keys[next];
      if (!entry) return;
      setFocused(next);
      buttons.current[next]?.focus();
      strike(entry.key);
    },
    [keys, strike],
  );

  // Enter and Space are handled here rather than left to the button's synthetic
  // click so the note sounds on key-down, like a real key does.
  const onKeyDown = (
    event: React.KeyboardEvent,
    key: PianoKey,
    index: number,
  ) => {
    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        strike(key);
        return;
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveTo(index + 1);
        return;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveTo(index - 1);
        return;
      case "Home":
        event.preventDefault();
        moveTo(0);
        return;
      case "End":
        event.preventDefault();
        moveTo(keys.length - 1);
        return;
      default:
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div aria-hidden="true" className="bg-ink h-2.5 w-full rounded-t-lg" />
      <div
        role="toolbar"
        aria-label="Try the keys"
        aria-orientation="horizontal"
        className={cn("relative flex w-full", heightClass)}
      >
        {keys.map(({ kind, key }, index) => {
          const shared = {
            ref: (node: HTMLButtonElement | null) => {
              buttons.current[index] = node;
            },
            type: "button" as const,
            tabIndex: index === focused ? 0 : -1,
            "aria-label": `Play ${key.label}`,
            onFocus: () => setFocused(index),
            onPointerDown: () => strike(key),
            onPointerEnter: (event: React.PointerEvent) => {
              if (event.pointerType === "mouse") playNote(key.semitone);
            },
            onKeyDown: (event: React.KeyboardEvent) =>
              onKeyDown(event, key, index),
          };

          if (kind === "black") {
            return (
              <button
                key={key.note}
                {...shared}
                style={{
                  left: `${(key.after + 1) * unit - blackWidth / 2}%`,
                  width: `${blackWidth}%`,
                }}
                className={cn(
                  "bg-ink focus-visible:ring-ring/50 absolute top-0 z-10 h-[62%] cursor-pointer rounded-b-md shadow-(--sh) transition-[transform,background-color] duration-150 outline-none hover:bg-pink-800 focus-visible:z-20 focus-visible:bg-pink-800 focus-visible:ring-3 active:bg-pink-800",
                  KEY_PRESS,
                  pressed === key.note && cn(KEY_PRESSED, "bg-pink-800"),
                )}
              />
            );
          }

          return (
            <button
              key={key.note}
              {...shared}
              className={cn(
                "focus-visible:ring-ring/50 relative min-w-0 flex-1 cursor-pointer rounded-b-xl border border-(--line-strong) bg-white shadow-(--sh-sm) transition-[transform,background-color] duration-150 outline-none hover:bg-pink-50 focus-visible:z-20 focus-visible:bg-pink-50 focus-visible:ring-3 active:bg-pink-50",
                KEY_PRESS,
                pressed === key.note && cn(KEY_PRESSED, "bg-pink-50"),
              )}
            >
              {/* Placeholder-grade type on a picture of a keyboard, which is
                  the one thing --ink-faint is sanctioned for. */}
              <span
                aria-hidden="true"
                className="text-ink-faint absolute inset-x-0 bottom-2 text-center text-[9px] font-semibold"
              >
                {key.note}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LandingHero({ isLoggedIn }: { isLoggedIn: boolean }) {
  const reduced = useStableReducedMotion();
  const { enabled, toggle, playChord } = useSound();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const blobSlow = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const blobFast = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const artLift = useTransform(scrollYProgress, [0, 1], [0, -46]);

  const scrollToStudio = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("studio");
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <section
      id="top"
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="hero-band scallop-b relative isolate flex min-h-[92svh] flex-col justify-center overflow-hidden px-4 pt-12 sm:px-6 lg:px-8 lg:pt-16"
      // `.scallop-b` is an unlayered rule, so its own padding-bottom outranks
      // any pb-* utility. Inline is the only way to give the band breathing
      // room under the scroll cue without editing globals.css.
      style={{ paddingBottom: "3.5rem" }}
    >
      {/* three soft blobs, drifting on their own and lagging behind the scroll */}
      <motion.div
        aria-hidden="true"
        style={reduced ? undefined : { y: blobSlow }}
        className="bg-cotton/50 motion-safe:animate-drift pointer-events-none absolute -top-16 -left-10 -z-10 size-64 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] blur-2xl sm:size-80"
      />
      <motion.div
        aria-hidden="true"
        style={reduced ? undefined : { y: blobFast }}
        className="bg-mint/45 pointer-events-none absolute top-1/3 -right-16 -z-10 size-72 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] blur-2xl motion-safe:animate-[drift_28s_ease-in-out_infinite] sm:size-96"
      />
      <motion.div
        aria-hidden="true"
        style={reduced ? undefined : { y: blobSlow }}
        className="pointer-events-none absolute -bottom-20 left-1/3 -z-10 size-64 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] bg-pink-100/60 blur-2xl motion-safe:animate-[drift_34s_ease-in-out_infinite] sm:size-80"
      />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)] lg:gap-14">
        {/* ── the promise ─────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p
            className="rise inline-flex items-center gap-2 rounded-full border border-(--line) bg-white/70 px-4 py-1.5 text-xs font-semibold text-teal-700 backdrop-blur"
            style={{ "--i": 0 } as React.CSSProperties}
          >
            {/* Blossom, not Sparkle: the same eyebrow pill runs down the whole
                page, and Sparkle is reserved for an actual win. */}
            <Blossom size={13} className="text-bubblegum" />
            Built for one teacher and every student they have
          </p>

          <h1
            id="hero-title"
            className="rise text-ink mt-5 font-serif text-[clamp(2.4rem,6.4vw,4.6rem)] leading-[1.05] font-bold text-balance"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            Every lesson, every blossom,
            <br />
            <span className="text-grad-pink">in one soft little diary.</span>
          </h1>

          <Squiggle
            className="rise text-bubblegum mt-3 h-3 w-56 max-w-full"
            style={{ "--i": 2 } as React.CSSProperties}
          />

          <p
            className="rise text-ink-soft mt-5 max-w-[52ch] text-base leading-relaxed sm:text-lg"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            A diary for one piano teacher — your students are records you keep,
            not accounts they sign into. It replaces the spreadsheet, the
            notebook by the metronome and the &ldquo;sorry, did I pay you for
            March?&rdquo; texts: attendance, one-to-five blossom scores, tuition
            at the rate each lesson was booked at, and a monthly report you can
            print for the parents.
          </p>

          <div
            className="rise mt-7 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row lg:items-start"
            style={{ "--i": 4 } as React.CSSProperties}
          >
            <Link
              href={isLoggedIn ? LINKS.dashboard : LINKS.demo}
              onPointerEnter={(event) => {
                // Pointer devices only: a chord that fires on a tap-through
                // would play as you leave the page.
                if (event.pointerType === "mouse") playChord(WELCOME_CHORD);
              }}
              className="focus-visible:ring-ring/50 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-white shadow-(--sh-pink) transition-transform outline-none hover:-translate-y-0.5 focus-visible:ring-3 sm:w-auto sm:text-base"
              style={{ background: "var(--grad-pink)" }}
            >
              {isLoggedIn ? "🎹 Open your studio" : "🎹 Try the demo studio"}
            </Link>

            <a
              href={LINKS.github}
              target="_blank"
              rel="noreferrer noopener"
              className="text-ink focus-visible:ring-ring/50 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-(--line-strong) bg-white/70 px-6 text-sm font-semibold shadow-(--sh-xs) backdrop-blur transition-colors outline-none hover:bg-white hover:text-pink-700 focus-visible:ring-3 sm:w-auto sm:text-base"
            >
              <Github className="size-4.5" aria-hidden="true" />
              Star on GitHub
            </a>
          </div>

          <p
            className="rise text-ink-soft mt-3 max-w-[46ch] text-xs"
            style={{ "--i": 5 } as React.CSSProperties}
          >
            {isLoggedIn
              ? "You are already signed in — your studio is one click away."
              : "No signup needed — the demo seeds 12 students, 2 months of lessons and a messy payment ledger in 7 steps."}
          </p>

          <ul
            className="rise mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start"
            style={{ "--i": 6 } as React.CSSProperties}
          >
            {TRUST.map((item) => (
              <li
                key={item}
                className="flex items-center gap-1.5 text-xs font-medium text-teal-700"
              >
                <Blossom size={12} className="text-bubblegum" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* ── the piano ───────────────────────────────────────────────────── */}
        <motion.div
          style={reduced ? undefined : { y: artLift }}
          className="flex justify-center lg:justify-end"
        >
          <div className="relative w-full max-w-136 rotate-[-1.2deg] rounded-3xl border border-(--line) bg-white/70 p-4 shadow-(--sh-lg) backdrop-blur-xl transition-transform duration-500 hover:rotate-0 sm:p-6">
            <style>{`
              .lh-note { animation: lh-floatnote 5.5s ease-in-out infinite; transform-origin: center; }
              .lh-note--2 { animation-duration: 6.8s; animation-delay: -1.4s; }
              .lh-note--3 { animation-duration: 6.1s; animation-delay: -3.2s; }
              @keyframes lh-floatnote {
                0%   { transform: translate(0, 8px) rotate(-6deg); opacity: 0; }
                18%  { opacity: 1; }
                70%  { opacity: .9; }
                100% { transform: translate(12px, -38px) rotate(10deg); opacity: 0; }
              }
              @media (prefers-reduced-motion: reduce) {
                .lh-note { animation: none !important; opacity: .55; }
              }
            `}</style>

            {/* Mochi sits at the left end, paws on the keys; the notes rise off
                the right-hand end of the keyboard. She is decoration here —
                pointer-events-none, so the cursor stops promising a click that
                a keyboard visitor could never make. The petting lives in
                MochiSection, where she is wrapped in a real button. */}
            <div className="relative h-28">
              <Mochi
                mood="delighted"
                bob
                size={128}
                className="pointer-events-none absolute bottom-0 left-0"
              />
              <NoteGlyph
                size={26}
                className="lh-note bottom-6 left-[56%] text-pink-600"
              />
              <NoteGlyph
                size={20}
                className="lh-note lh-note--2 bottom-2 left-[72%] text-pink-500"
              />
              <NoteGlyph
                size={16}
                className="lh-note lh-note--3 bottom-8 left-[86%] text-teal-600"
              />
            </div>

            {/* One octave on a phone so each key clears a fingertip, two on
                anything wider. The hidden one is display:none, so it leaves the
                accessibility tree instead of duplicating 24 buttons. */}
            <Keyboard whiteCount={7} heightClass="h-36" className="sm:hidden" />
            <Keyboard
              whiteCount={14}
              heightClass="h-44"
              className="hidden sm:block"
            />

            {/* ink-soft, not ink-faint: this is the page inviting you to press
                something, and a control has to be readable to be pressed. */}
            {enabled ? (
              <p className="text-ink-soft mt-3 text-center text-xs">
                psst — the keys really play. Sound is on.
              </p>
            ) : (
              <button
                type="button"
                onClick={toggle}
                className="text-ink-soft focus-visible:ring-ring/50 mt-3 flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full py-1.5 text-center text-xs transition-colors outline-none hover:text-pink-700 focus-visible:ring-3"
              >
                psst — the keys really play. Turn sound on ↗
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── down you go ─────────────────────────────────────────────────── */}
      <div className="mt-12 flex justify-center">
        <a
          href="#studio"
          onClick={scrollToStudio}
          className="text-ink-soft focus-visible:ring-ring/50 inline-flex h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold tracking-wide transition-colors outline-none hover:text-pink-700 focus-visible:ring-3"
        >
          see the studio
          <ChevronDown
            className="motion-safe:animate-bob size-4"
            aria-hidden="true"
          />
        </a>
      </div>
    </section>
  );
}
