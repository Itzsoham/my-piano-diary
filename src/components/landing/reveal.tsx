"use client";

import { useMemo, useSyncExternalStore } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scroll-reveal primitives for the landing page. Everything on the page fades
 * up on entry, so the motion lives here once instead of being re-typed into
 * every section.
 *
 * Two things this file has to get right, both of them about the server render.
 *
 * 1. framer-motion writes `initial` into the inline style during SSR, so a
 *    revealed block ships as `opacity: 0` and only becomes visible once the
 *    viewport observer fires. With no JS that never happens, so landing-page.tsx
 *    ships a `@media (scripting: none)` rule (plus a <noscript> twin) keyed on
 *    the `data-reveal` attribute every wrapper here carries.
 * 2. The reduced-motion answer must not change the *shape* of the render.
 *    `useReducedMotion()` is null on the server and the real boolean on the
 *    client's first pass, so branching on it would hand React two different
 *    trees for ~20 blocks. Reduced motion is expressed as a zero-length
 *    transition instead — same element, same markup, no animation.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/** The flag flips exactly once, at hydration, so there is nothing to watch. */
const noopSubscribe = () => () => undefined;

/**
 * `useReducedMotion()` with the server/hydration answer pinned to false, so the
 * value can be used during render without splitting server and client markup.
 * It tells the truth from the first post-hydration render onwards.
 */
export function useStableReducedMotion(): boolean {
  const reduced = useReducedMotion() ?? false;
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return hydrated && reduced;
}

export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const reduced = useStableReducedMotion();

  return (
    <motion.div
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.25 }}
      transition={
        reduced ? { duration: 0 } : { duration: 0.55, delay, ease: EASE }
      }
    >
      {children}
    </motion.div>
  );
}

/**
 * Child variants for RevealStagger — attach them to your own motion elements.
 * A hook rather than a constant so the reduced-motion visitor gets the same
 * snap-into-place the wrapper above gives them.
 */
export function useRevealItem(): Variants {
  const reduced = useStableReducedMotion();

  return useMemo(
    () => ({
      hidden: { opacity: 0, y: reduced ? 0 : 18 },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: reduced ? 0 : 0.5, ease: EASE },
      },
    }),
    [reduced],
  );
}

/**
 * Parent for a list of `useRevealItem` children: they arrive one after another
 * rather than all at once, which reads as a page being dealt out by hand.
 */
export function RevealStagger({
  children,
  className,
  step = 0.07,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
}) {
  const reduced = useStableReducedMotion();

  return (
    <motion.div
      data-reveal=""
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduced ? 0 : step } },
      }}
    >
      {children}
    </motion.div>
  );
}
