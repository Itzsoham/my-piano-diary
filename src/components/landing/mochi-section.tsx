"use client";

import { useCallback, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";

import { Blossom, Petal } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { LINKS } from "@/components/landing/landing-data";
import { Reveal } from "@/components/landing/reveal";
import { useSound } from "@/components/landing/sound";

/** The three faces Mochi ships with, in the order a click cycles them. */
const MOODS = ["content", "delighted", "sleepy"] as const;

const MOOD_CAPTION = {
  content: "Content — her resting face.",
  delighted: "Delighted — you have her full attention.",
  sleepy: "Sleepy — it was a long Saturday of scales.",
} as const;

/** How many pets before the hidden door shows itself. */
const DOOR_AT = 5;

/**
 * Drifting decoration. These positions are a hardcoded literal on purpose: a
 * Math.random() scatter would differ between the server render and the first
 * client render and break hydration.
 *
 * All petals, no sparkles: nothing is being celebrated around the cat, and
 * Sparkle is the mark this palette keeps for a win.
 */
const ORNAMENTS = [
  {
    top: "10%",
    left: "3%",
    size: 26,
    tone: "text-bubblegum/70",
    rotate: -18,
    delay: "0s",
  },
  {
    top: "20%",
    left: "40%",
    size: 15,
    tone: "text-sand-300",
    rotate: 12,
    delay: "1.3s",
  },
  {
    top: "74%",
    left: "8%",
    size: 18,
    tone: "text-cotton",
    rotate: 26,
    delay: "3.4s",
  },
  {
    top: "82%",
    left: "47%",
    size: 22,
    tone: "text-wintergreen/60",
    rotate: 9,
    delay: "5.1s",
  },
  {
    top: "58%",
    left: "92%",
    size: 19,
    tone: "text-bubblegum/80",
    rotate: -7,
    delay: "2.4s",
  },
  {
    top: "7%",
    left: "86%",
    size: 24,
    tone: "text-cotton",
    rotate: -34,
    delay: "6.6s",
  },
] as const;

/**
 * The page's personality beat. Nothing here explains the product — it exists so
 * a visitor meets the cat who sits on every empty state in the app, and finds
 * out by playing that clicking her does something. One screen at most, and
 * deliberately skippable: no claim on this page depends on it.
 *
 * Mochi is decoration (aria-hidden), so the real control is the button wrapping
 * her and her own SVG click handler is switched off with pointer-events-none.
 * That gives keyboard users the same pet, and stops her built-in meow firing
 * on top of the page's sound switch as a double bark.
 */
export function MochiSection() {
  const reduced = useReducedMotion();
  const { meow, playChord } = useSound();
  const controls = useAnimationControls();
  const [pets, setPets] = useState(0);

  const mood = MOODS[pets % MOODS.length] ?? "content";
  const doorFound = pets >= DOOR_AT;

  const pet = useCallback(() => {
    meow();

    const next = pets + 1;
    setPets(next);

    // One small chord the moment the door appears — the only note this section
    // plays, and only ever once.
    if (next === DOOR_AT) playChord([0, 4, 7, 12]);

    if (!reduced) {
      void controls
        .start({ scale: 1.12 }, { type: "spring", stiffness: 620, damping: 14 })
        .then(() =>
          controls.start(
            { scale: 1 },
            { type: "spring", stiffness: 300, damping: 13 },
          ),
        );
    }
  }, [controls, meow, pets, playChord, reduced]);

  return (
    <section
      aria-labelledby="mochi-heading"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="hero-band relative isolate grid items-center gap-10 overflow-hidden rounded-[calc(var(--radius)+16px)] border border-(--line) px-6 py-10 shadow-(--sh-lg) sm:px-10 sm:py-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:px-14">
            {ORNAMENTS.map((ornament) => (
              <span
                key={`${ornament.top}-${ornament.left}`}
                aria-hidden="true"
                className={`motion-safe:animate-drift pointer-events-none absolute -z-10 ${ornament.tone}`}
                style={
                  {
                    top: ornament.top,
                    left: ornament.left,
                    animationDelay: ornament.delay,
                    rotate: `${ornament.rotate}deg`,
                  } as CSSProperties
                }
              >
                <Petal size={ornament.size} />
              </span>
            ))}

            <div className="min-w-0">
              {/* Same eyebrow pill as every other section, so this beat still
                  reads as part of the page rather than a pasted-in aside. */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold tracking-wider text-pink-700 uppercase">
                <Blossom size={12} />
                Studio staff
              </span>
              <h2
                id="mochi-heading"
                className="text-ink mt-4 font-serif text-[clamp(1.8rem,4.6vw,2.9rem)] leading-tight font-bold text-balance"
              >
                Meet Mochi, the studio cat
              </h2>
              <p className="text-ink-soft mt-4 text-[15px] leading-relaxed sm:text-base">
                She is the mascot of the whole thing. She sits on every empty
                state, so a screen with nothing on it yet still feels like
                somewhere. She has three moods. She meows when you click her.
                That is the entire specification.
              </p>
              <p className="text-ink-soft mt-3 text-[15px] leading-relaxed sm:text-base">
                There are a few doors in here that aren&apos;t on the sidebar.
                Click her enough and you&apos;ll find one.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <motion.button
                type="button"
                onClick={pet}
                animate={controls}
                aria-label="Pet Mochi, the studio cat"
                className="focus-visible:ring-ring/50 grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-[calc(var(--radius)+12px)] p-2 outline-none focus-visible:ring-3"
              >
                {/* pointer-events-none: the button owns the click, not the SVG */}
                <Mochi
                  mood={mood}
                  size={200}
                  bob
                  className="pointer-events-none h-auto w-full max-w-50"
                />
              </motion.button>

              <p className="text-ink-soft text-center text-sm">
                {MOOD_CAPTION[mood]}
              </p>

              <p className="text-center text-sm font-semibold text-pink-700">
                {pets === 0
                  ? "Go on, pet her."
                  : `Petted ${pets} time${pets === 1 ? "" : "s"}`}
              </p>

              {/* The height is reserved, so the door appearing never shoves the
                  rest of the section around. */}
              <div className="grid min-h-19 w-full place-items-start justify-items-center">
                <AnimatePresence>
                  {doorFound && (
                    <motion.div
                      initial={
                        reduced ? false : { opacity: 0, y: 8, scale: 0.94 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 340,
                        damping: 20,
                      }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <Link
                        href={LINKS.demo}
                        className="focus-visible:ring-ring/50 inline-flex min-h-11 items-center gap-2 rounded-full border border-(--line) bg-white/80 px-4 text-sm font-semibold text-pink-700 shadow-(--sh-sm) backdrop-blur transition-colors outline-none hover:bg-white focus-visible:ring-3"
                      >
                        <span aria-hidden="true">🎂</span>
                        you found a door
                      </Link>
                      <span className="text-ink-soft text-xs">
                        the real ones are behind the login
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
