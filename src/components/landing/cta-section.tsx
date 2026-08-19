"use client";

import { type MouseEvent } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useReducedMotion } from "framer-motion";

import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { LINKS } from "@/components/landing/landing-data";
import { Reveal } from "@/components/landing/reveal";

/**
 * The confetti is petals, not party poppers — the five brand hexes, in the same
 * order the palette lists them. Hard-coded rather than read from the CSS vars
 * because canvas-confetti needs plain colour strings, and these tokens are
 * oklch().
 */
const PETAL_COLORS = ["#f3a2be", "#ffd3dd", "#c6e6e3", "#81bfb7", "#f0f9f8"];

/* Not "no credit card" — there is no billing anywhere in this thing, and
   reassuring someone about a card implies a paid tier that does not exist. */
const REASSURANCES = [
  "Nothing to buy — it is open source.",
  "No student logins to manage.",
  "Your own database.",
] as const;

/**
 * The closer. One full-bleed band on the hero gradient with the signature
 * scalloped edge, and exactly one thing to do — seed the demo studio (or go
 * back to your own, if you are already signed in).
 *
 * The primary button throws petal confetti on click and then just lets the
 * navigation happen: no preventDefault, no artificial delay before routing.
 * Under prefers-reduced-motion the burst is skipped entirely rather than
 * shortened — canvas-confetti has no reduced-motion mode of its own.
 */
export function CtaSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const reduced = useReducedMotion();

  const primaryHref = isLoggedIn ? LINKS.dashboard : LINKS.demo;
  const primaryLabel = isLoggedIn
    ? "Back to your dashboard"
    : "🎹 Try the demo studio";

  function burst(event: MouseEvent<HTMLAnchorElement>) {
    if (reduced) return;

    const rect = event.currentTarget.getBoundingClientRect();

    void confetti({
      particleCount: 90,
      spread: 78,
      startVelocity: 34,
      scalar: 0.9,
      ticks: 150,
      origin: {
        x: (rect.left + rect.width / 2) / Math.max(window.innerWidth, 1),
        y: (rect.top + rect.height / 2) / Math.max(window.innerHeight, 1),
      },
      colors: PETAL_COLORS,
    });
  }

  return (
    <section aria-labelledby="cta-heading">
      <div className="hero-band scallop-b relative isolate overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div
          aria-hidden="true"
          className="bg-cotton/45 motion-safe:animate-drift pointer-events-none absolute -top-16 -left-10 -z-10 size-56 rounded-[46%_54%_40%_60%/55%_45%_60%_40%]"
        />
        <div
          aria-hidden="true"
          className="bg-mint/40 pointer-events-none absolute -right-12 -bottom-20 -z-10 size-60 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] motion-safe:animate-[drift_26s_ease-in-out_infinite]"
        />

        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <div
              aria-hidden="true"
              className="text-bubblegum flex items-end justify-center gap-2"
            >
              <Blossom size={18} className="opacity-70" />
              <Blossom size={26} className="text-pink-400" />
              <Blossom size={18} className="opacity-70" />
            </div>

            <h2
              id="cta-heading"
              className="text-ink mt-4 font-serif text-[clamp(2rem,5vw,3.4rem)] leading-[1.1] font-bold text-balance"
            >
              Your studio is <span className="text-grad-pink">one click</span>{" "}
              from being organised.
            </h2>
            <Squiggle className="text-bubblegum mx-auto mt-2 h-3 w-44 sm:w-64" />
          </Reveal>

          <Reveal delay={0.08}>
            <p className="text-ink-soft mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-pretty sm:text-base">
              Seed a full sample studio in seven visible steps. Twelve students,
              two months of lessons, and a payment ledger that is deliberately a
              bit of a mess — so you can see the app do real work.
            </p>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={primaryHref}
                onClick={burst}
                style={{ backgroundImage: "var(--grad-pink)" }}
                className="focus-visible:ring-ring/50 inline-flex h-13 w-full max-w-xs items-center justify-center rounded-full px-8 text-base font-semibold text-white shadow-(--sh-pink) transition-transform outline-none hover:-translate-y-0.5 focus-visible:ring-3 sm:w-auto sm:max-w-none"
              >
                {primaryLabel}
              </Link>

              <a
                href={LINKS.docsProjectState}
                target="_blank"
                rel="noreferrer noopener"
                className="focus-visible:ring-ring/50 inline-flex h-13 w-full max-w-xs items-center justify-center rounded-full border border-(--line) bg-white/70 px-6 text-sm font-semibold text-teal-700 shadow-(--sh-xs) backdrop-blur transition-colors outline-none hover:bg-white focus-visible:ring-3 sm:w-auto sm:max-w-none"
              >
                Read the docs
              </a>

              <a
                href={LINKS.mockups}
                target="_blank"
                rel="noreferrer noopener"
                className="focus-visible:ring-ring/50 inline-flex h-13 w-full max-w-xs items-center justify-center rounded-full px-6 text-sm font-semibold text-pink-700 transition-colors outline-none hover:bg-white/70 focus-visible:ring-3 sm:w-auto sm:max-w-none"
              >
                Browse the design mockups
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <ul className="text-ink-soft mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              {REASSURANCES.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Blossom
                    size={13}
                    className="text-bubblegum"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
