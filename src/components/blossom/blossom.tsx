import { cn } from "@/lib/utils";

/**
 * The Blossom Diary ornament set — the signature marks ported verbatim from the
 * design mockups (public/design-mockups/dashboard-e.html). All are purely
 * decorative: they render aria-hidden and never receive pointer events, so they
 * never carry meaning or block a control. Colour comes from `currentColor`, so
 * set it with a text-* utility (e.g. `text-ok-dot`, `text-bubblegum`).
 */

type OrnamentProps = React.SVGProps<SVGSVGElement> & {
  /** Pixel size for both width and height. Defaults to 1em so it scales with text. */
  size?: number | string;
};

const base = (className?: string) =>
  cn("pointer-events-none inline-block shrink-0", className);

/** 5-petal blossom — heading ornament, timeline node, bullet, podium crown, chart peak. */
export function Blossom({ size = "1em", className, ...props }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={base(className)}
      {...props}
    >
      <g fill="currentColor">
        <ellipse cx="12" cy="6" rx="3.2" ry="4.5" />
        <ellipse
          cx="12"
          cy="6"
          rx="3.2"
          ry="4.5"
          transform="rotate(72 12 12)"
        />
        <ellipse
          cx="12"
          cy="6"
          rx="3.2"
          ry="4.5"
          transform="rotate(144 12 12)"
        />
        <ellipse
          cx="12"
          cy="6"
          rx="3.2"
          ry="4.5"
          transform="rotate(216 12 12)"
        />
        <ellipse
          cx="12"
          cy="6"
          rx="3.2"
          ry="4.5"
          transform="rotate(288 12 12)"
        />
      </g>
      <circle cx="12" cy="12" r="2.7" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}

/** Single petal — small accents and bullets. */
export function Petal({ size = "1em", className, ...props }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={base(className)}
      {...props}
    >
      <path
        fill="currentColor"
        d="M12 2c4 5 5.4 9.5 4.2 14.2C15.3 19.6 13.8 21.4 12 22c-1.8-.6-3.3-2.4-4.2-5.8C6.6 11.5 8 7 12 2z"
      />
    </svg>
  );
}

/** 4-point sparkle — celebration only (best day, a paid badge, a streak). */
export function Sparkle({ size = "1em", className, ...props }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={base(className)}
      {...props}
    >
      <path
        fill="currentColor"
        d="M12 1.5c.9 5.7 3.9 8.7 9.6 9.6-5.7.9-8.7 3.9-9.6 9.6-.9-5.7-3.9-8.7-9.6-9.6C8.1 10.2 11.1 7.2 12 1.5z"
      />
    </svg>
  );
}

/** Ribbon bow — the brand-mark ornament. */
export function Bow({ size = "1em", className, ...props }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={base(className)}
      {...props}
    >
      <path
        fill="currentColor"
        d="M11.4 12C9.6 9.1 7.4 7.6 5.4 7.6 3.5 7.6 2.2 8.9 2.2 10.8c0 2.6 2.1 4.6 4.9 4.6 1.7 0 3.2-1.2 4.3-3.4z"
      />
      <path
        fill="currentColor"
        d="M12.6 12c1.8-2.9 4-4.4 6-4.4 1.9 0 3.2 1.3 3.2 3.2 0 2.6-2.1 4.6-4.9 4.6-1.7 0-3.2-1.2-4.3-3.4z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        d="M10.7 13.7 9.1 19.6M13.3 13.7l1.6 5.9"
      />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </svg>
  );
}

/** Hand-drawn squiggle — underlines a heading instead of a straight rule. */
export function Squiggle({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none block", className)}
      {...props}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        d="M3 8C13 2 23 11 33 6.5S53 1.5 63 7s20 4.5 30 -.5 20 -4 30 1.5 20 3 30 -2 20 -3.5 30 1.5 12 3 14 2"
      />
    </svg>
  );
}
