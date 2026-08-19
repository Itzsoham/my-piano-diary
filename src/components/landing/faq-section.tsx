"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { FAQS, LINKS } from "@/components/landing/landing-data";
import { Reveal } from "@/components/landing/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import { useSound } from "@/components/landing/sound";
import { cn } from "@/lib/utils";

/**
 * The questions a teacher actually asks before trying a tool — logins, data,
 * money, timezones — answered plainly.
 *
 * Hand-built rather than a <details> element so the open/close can animate its
 * height and so only one answer is open at a time; the trigger is still a real
 * button carrying aria-expanded, so keyboard and screen-reader behaviour match
 * a native disclosure. The first question is open on load so the pattern is
 * obvious without a click.
 */

/** A pentatonic run, so opening the answers in order sounds intentional. */
const NOTES = [-9, -7, -5, -2, 0, 3] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number>(0);
  const reduced = useReducedMotion();
  const { playNote } = useSound();

  function toggle(index: number) {
    const next = openIndex === index ? -1 : index;
    setOpenIndex(next);
    if (next !== -1) playNote(NOTES[index % NOTES.length] ?? 0);
  }

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          id="faq-heading"
          eyebrow="Straight answers"
          title="Fair questions"
          lead="The six things people ask before they hand a tool their studio."
        />

        <ul className="mt-10 space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            const triggerId = `faq-trigger-${i}`;
            const panelId = `faq-panel-${i}`;

            return (
              <li key={faq.q}>
                <Reveal delay={0.05 * i}>
                  <div
                    className={cn(
                      "overflow-hidden rounded-2xl border bg-white transition-colors",
                      isOpen
                        ? "border-(--line-pink) shadow-(--sh-sm)"
                        : "border-(--line) hover:border-(--line-pink)",
                    )}
                  >
                    <h3>
                      <button
                        type="button"
                        id={triggerId}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => toggle(i)}
                        className="focus-visible:ring-ring/50 flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-inset"
                      >
                        <span className="text-ink font-semibold">{faq.q}</span>
                        <ChevronDown
                          aria-hidden="true"
                          className={cn(
                            "size-5 shrink-0 text-pink-700 transition-transform duration-300",
                            isOpen && "rotate-180",
                          )}
                        />
                      </button>
                    </h3>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="panel"
                          id={panelId}
                          role="region"
                          aria-labelledby={triggerId}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: reduced ? 0 : 0.3,
                            ease: EASE,
                          }}
                          className="overflow-hidden"
                        >
                          <p className="text-ink-soft px-5 pb-4 text-sm leading-relaxed">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>

        <Reveal delay={0.1}>
          <p className="text-ink-soft mt-8 text-center text-sm">
            Still wondering something?{" "}
            <a
              href={LINKS.email}
              className="focus-visible:ring-ring/50 rounded-sm font-medium text-pink-700 underline decoration-pink-300 underline-offset-4 outline-none hover:decoration-pink-600 focus-visible:ring-3"
            >
              Email me
            </a>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}
