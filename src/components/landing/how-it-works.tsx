"use client";

import { motion } from "framer-motion";

import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { STEPS } from "@/components/landing/landing-data";
import { Reveal, useStableReducedMotion } from "@/components/landing/reveal";
import { SectionHeading } from "@/components/landing/section-heading";

/**
 * The four-step timeline. A teaching week is a loop, not a funnel, so the
 * connector between the steps is a hand-drawn wave that draws itself in rather
 * than a corporate straight arrow — and the run ends with Mochi asleep and the
 * admission that next week you simply do it again.
 *
 * The dash length is deliberately longer than the path (~1040 user units) so
 * the stroke is guaranteed to be fully hidden at the start and fully drawn at
 * the end, whatever the container width does to the path's measured length.
 */

const CONNECTOR_PATH = "M4 24C130 4 210 44 336 24s210-20 332 0 210 20 328-4";
const CONNECTOR_DASH = 1200;

export function HowItWorks() {
  const reduced = useStableReducedMotion();

  return (
    <section
      id="how"
      aria-labelledby="how-heading"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="how-heading"
          tone="mint"
          eyebrow="Four steps"
          title="From empty diary to a printed month"
          lead="Seed a studio, book the week, mark what actually happened, then print the month and see who still owes you."
        />

        {/* The connectors live beside the list, not inside it — an <ol> may
            only contain <li> children. */}
        <div className="relative mt-12 lg:mt-16">
          {/* Vertical gutter, below lg: fades out under the last node. */}
          <span
            aria-hidden="true"
            className="from-bubblegum via-bubblegum/70 pointer-events-none absolute top-6 bottom-0 left-6 w-px bg-linear-to-b to-transparent lg:hidden"
          />

          {/* Horizontal hand-drawn connector, lg and up. Sits on the badge
              centre line, inset so it starts and ends inside the outer nodes. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-6 right-[12%] left-[12%] hidden h-10 -translate-y-1/2 lg:block"
          >
            <svg
              viewBox="0 0 1000 40"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
              className="h-full w-full"
            >
              {reduced ? (
                <path
                  d={CONNECTOR_PATH}
                  fill="none"
                  stroke="var(--bubblegum)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ) : (
                <motion.path
                  d={CONNECTOR_PATH}
                  fill="none"
                  stroke="var(--bubblegum)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray={CONNECTOR_DASH}
                  initial={{ strokeDashoffset: CONNECTOR_DASH }}
                  whileInView={{ strokeDashoffset: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              )}
            </svg>
          </div>

          <ol className="grid gap-9 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((step, i) => (
              <li key={step.n} className="relative">
                <Reveal
                  delay={0.12 * i}
                  className="flex gap-4 lg:flex-col lg:items-center lg:text-center"
                >
                  <div className="relative shrink-0">
                    <div className="flex size-12 items-center justify-center rounded-full [background-image:var(--grad-pink)] font-serif text-lg font-bold text-white shadow-(--sh-pink)">
                      {step.n}
                    </div>
                    <Blossom
                      size={16}
                      className="text-bubblegum absolute -top-1 -right-1"
                    />
                  </div>

                  <div className="min-w-0 lg:mt-3">
                    <h3 className="text-ink font-bold">{step.title}</h3>
                    <p className="text-ink-soft mt-1.5 text-sm leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        <Reveal
          delay={0.2}
          className="mt-12 flex flex-col items-center gap-1 text-center"
        >
          {/* Decoration only — her own SVG click handler is switched off so the
              cursor does not offer a pet that keyboard users cannot take. */}
          <Mochi mood="sleepy" size={72} className="pointer-events-none" />
          <p className="text-ink-soft flex items-center gap-2 text-sm italic">
            <Blossom size={12} className="text-bubblegum" />
            …and then you do it again next week.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
