"use client";

import { Petal } from "@/components/blossom/blossom";
import { cn } from "@/lib/utils";

/**
 * Cherry blossom falling across the whole viewport, behind the page.
 *
 * Every value is hardcoded. A landing page is server-rendered, so a
 * Math.random() layout would hand React a different DOM on the client and
 * blow up hydration — the field is a fixed table of 24 configurations, sliced
 * to `count`, and the variety comes from the numbers being hand-picked rather
 * than generated.
 *
 * The motion is CSS, not framer-motion: 20-odd elements looping forever is
 * exactly the case where the compositor should be left alone. Delays are
 * negative so the field is already mid-fall on the first paint instead of
 * starting empty. Under prefers-reduced-motion the petals stop and settle at
 * their `rest` position, so the decoration survives instead of hanging off the
 * top of the screen.
 */

type PetalConfig = {
  /** Horizontal position, % of viewport width. */
  left: number;
  /** Petal size in px. */
  size: number;
  /** Seconds for one fall. */
  duration: number;
  /** Negative seconds, so the loop starts part-way through. */
  delay: number;
  /** Sideways sway in px. */
  drift: number;
  /** Total rotation over one fall, in degrees. */
  spin: number;
  opacity: number;
  /** Where it settles when motion is switched off. */
  rest: string;
  tone: string;
};

// The table is hand-aligned so each petal reads as a single row.
// prettier-ignore
const PETALS: readonly PetalConfig[] = [
  { left: 4,  size: 14, duration: 19, delay: -2,  drift: 26,  spin: 220,  opacity: 0.55, rest: "12vh", tone: "text-bubblegum" },
  { left: 11, size: 18, duration: 24, delay: -11, drift: -34, spin: -180, opacity: 0.4,  rest: "62vh", tone: "text-cotton" },
  { left: 17, size: 11, duration: 16, delay: -6,  drift: 18,  spin: 260,  opacity: 0.6,  rest: "34vh", tone: "text-pink-200" },
  { left: 23, size: 20, duration: 26, delay: -17, drift: 40,  spin: -240, opacity: 0.35, rest: "80vh", tone: "text-bubblegum" },
  { left: 29, size: 13, duration: 21, delay: -3,  drift: -22, spin: 200,  opacity: 0.5,  rest: "20vh", tone: "text-cotton" },
  { left: 35, size: 16, duration: 18, delay: -14, drift: 30,  spin: -300, opacity: 0.45, rest: "70vh", tone: "text-bubblegum" },
  { left: 41, size: 10, duration: 23, delay: -8,  drift: -16, spin: 180,  opacity: 0.65, rest: "44vh", tone: "text-pink-200" },
  { left: 47, size: 19, duration: 25, delay: -19, drift: 36,  spin: 280,  opacity: 0.38, rest: "90vh", tone: "text-cotton" },
  { left: 53, size: 12, duration: 17, delay: -5,  drift: -28, spin: -220, opacity: 0.6,  rest: "28vh", tone: "text-bubblegum" },
  { left: 59, size: 15, duration: 22, delay: -12, drift: 24,  spin: 240,  opacity: 0.5,  rest: "56vh", tone: "text-pink-200" },
  { left: 65, size: 21, duration: 26, delay: -1,  drift: -38, spin: -260, opacity: 0.35, rest: "8vh",  tone: "text-cotton" },
  { left: 71, size: 13, duration: 20, delay: -16, drift: 20,  spin: 300,  opacity: 0.55, rest: "74vh", tone: "text-bubblegum" },
  { left: 77, size: 17, duration: 24, delay: -9,  drift: -30, spin: -200, opacity: 0.42, rest: "48vh", tone: "text-pink-200" },
  { left: 83, size: 11, duration: 15, delay: -4,  drift: 14,  spin: 260,  opacity: 0.7,  rest: "24vh", tone: "text-bubblegum" },
  { left: 89, size: 18, duration: 25, delay: -21, drift: -26, spin: 220,  opacity: 0.4,  rest: "96vh", tone: "text-cotton" },
  { left: 95, size: 14, duration: 19, delay: -7,  drift: 32,  spin: -280, opacity: 0.52, rest: "38vh", tone: "text-pink-200" },
  { left: 7,  size: 22, duration: 26, delay: -13, drift: -20, spin: 240,  opacity: 0.36, rest: "66vh", tone: "text-cotton" },
  { left: 20, size: 12, duration: 18, delay: -2,  drift: 28,  spin: -180, opacity: 0.62, rest: "16vh", tone: "text-bubblegum" },
  { left: 33, size: 16, duration: 23, delay: -18, drift: -34, spin: 200,  opacity: 0.44, rest: "84vh", tone: "text-pink-200" },
  { left: 44, size: 10, duration: 16, delay: -10, drift: 22,  spin: 300,  opacity: 0.68, rest: "52vh", tone: "text-bubblegum" },
  { left: 56, size: 20, duration: 26, delay: -6,  drift: -18, spin: -240, opacity: 0.37, rest: "30vh", tone: "text-cotton" },
  { left: 68, size: 13, duration: 21, delay: -15, drift: 34,  spin: 260,  opacity: 0.5,  rest: "78vh", tone: "text-pink-200" },
  { left: 80, size: 15, duration: 22, delay: -3,  drift: -24, spin: -220, opacity: 0.47, rest: "18vh", tone: "text-bubblegum" },
  { left: 92, size: 19, duration: 24, delay: -20, drift: 16,  spin: 180,  opacity: 0.4,  rest: "88vh", tone: "text-cotton" },
];

export function PetalField({
  count = 16,
  className,
}: {
  count?: number;
  className?: string;
}) {
  const petals = PETALS.slice(0, Math.max(0, Math.min(count, PETALS.length)));

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      <style>{`
        .pf-petal {
          position: absolute;
          top: -12vh;
          will-change: transform;
          animation-name: pf-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes pf-fall {
          0%   { transform: translate3d(0, 0, 0) rotate(0deg); }
          25%  { transform: translate3d(var(--pf-drift), 31vh, 0) rotate(calc(var(--pf-spin) * 0.25)); }
          50%  { transform: translate3d(0, 62vh, 0) rotate(calc(var(--pf-spin) * 0.5)); }
          75%  { transform: translate3d(calc(var(--pf-drift) * -1), 93vh, 0) rotate(calc(var(--pf-spin) * 0.75)); }
          100% { transform: translate3d(0, 124vh, 0) rotate(var(--pf-spin)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pf-petal {
            animation: none !important;
            transform: translate3d(0, var(--pf-rest), 0) rotate(var(--pf-spin));
          }
        }
      `}</style>

      {petals.map((petal) => (
        <span
          key={`${petal.left}-${petal.rest}`}
          className={cn("pf-petal", petal.tone)}
          style={
            {
              left: `${petal.left}%`,
              opacity: petal.opacity,
              animationDuration: `${petal.duration}s`,
              animationDelay: `${petal.delay}s`,
              "--pf-drift": `${petal.drift}px`,
              "--pf-spin": `${petal.spin}deg`,
              "--pf-rest": petal.rest,
            } as React.CSSProperties
          }
        >
          <Petal size={petal.size} />
        </span>
      ))}
    </div>
  );
}
