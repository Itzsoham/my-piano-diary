"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import type { LogoVariant } from "@/lib/logo-preference";

type LogoMarkProps = {
  variant?: LogoVariant;
  size?: number;
  className?: string;
};

/**
 * The app icon — a rounded-square badge on the brand gradient
 * (--bubblegum -> --wintergreen), in one of two marks:
 *   "blossom" — the app's own 5-petal blossom ornament, promoted to a badge
 *   "mochi"   — the studio cat's face, reduced to icon scale
 * Both reuse the exact geometry of Blossom/Mochi elsewhere in the app, just
 * scaled into a single 64x64 badge. Purely decorative (aria-hidden) — pair
 * with visible text (a nav label, an alt-bearing heading) wherever it's used
 * as the only brand mark on screen.
 */
export function LogoMark({
  variant = "blossom",
  size = 40,
  className,
}: LogoMarkProps) {
  const gradId = `logo-grad-${useId()}`;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--bubblegum)" />
          <stop offset="100%" stopColor="var(--wintergreen)" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="18" fill={`url(#${gradId})`} />

      {variant === "blossom" ? (
        <>
          <g transform="translate(15 15) scale(1.45)">
            <g fill="#ffffff">
              <ellipse cx="12" cy="6" rx="3.3" ry="4.6" />
              <ellipse
                cx="12"
                cy="6"
                rx="3.3"
                ry="4.6"
                transform="rotate(72 12 12)"
              />
              <ellipse
                cx="12"
                cy="6"
                rx="3.3"
                ry="4.6"
                transform="rotate(144 12 12)"
              />
              <ellipse
                cx="12"
                cy="6"
                rx="3.3"
                ry="4.6"
                transform="rotate(216 12 12)"
              />
              <ellipse
                cx="12"
                cy="6"
                rx="3.3"
                ry="4.6"
                transform="rotate(288 12 12)"
              />
            </g>
            <circle cx="12" cy="12" r="3" fill="var(--pink-600)" />
          </g>
          <path
            d="M50 8c.7 4.4 2.9 6.6 7.3 7.3-4.4.7-6.6 2.9-7.3 7.3-.7-4.4-2.9-6.6-7.3-7.3 4.4-.7 6.6-2.9 7.3-7.3z"
            fill="#ffffff"
            opacity="0.95"
          />
        </>
      ) : (
        <>
          <path
            d="M22 27 L18.5 13 L33 21.5 Z"
            fill="var(--cotton)"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M42 27 L45.5 13 L31 21.5 Z"
            fill="var(--cotton)"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <ellipse cx="32" cy="37" rx="17.5" ry="15.5" fill="#ffffff" />
          <circle cx="25.5" cy="35" r="2.3" fill="var(--ink)" />
          <circle cx="38.5" cy="35" r="2.3" fill="var(--ink)" />
          <path
            d="M27.5 42.5q4.5 4 9 0"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="20" cy="40" r="2.6" fill="var(--cotton)" opacity="0.9" />
          <circle cx="44" cy="40" r="2.6" fill="var(--cotton)" opacity="0.9" />
          <g stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" opacity="0.9">
            <line x1="13" y1="35" x2="5" y2="32" />
            <line x1="13" y1="39.5" x2="5" y2="41" />
            <line x1="51" y1="35" x2="59" y2="32" />
            <line x1="51" y1="39.5" x2="59" y2="41" />
          </g>
          <g transform="translate(39.5 11) scale(0.62)">
            <path
              d="M11.4 12C9.6 9.1 7.4 7.6 5.4 7.6 3.5 7.6 2.2 8.9 2.2 10.8c0 2.6 2.1 4.6 4.9 4.6 1.7 0 3.2-1.2 4.3-3.4z"
              fill="var(--pink-600)"
            />
            <path
              d="M12.6 12c1.8-2.9 4-4.4 6-4.4 1.9 0 3.2 1.3 3.2 3.2 0 2.6-2.1 4.6-4.9 4.6-1.7 0-3.2-1.2-4.3-3.4z"
              fill="var(--pink-600)"
            />
            <circle cx="12" cy="12" r="2.2" fill="var(--pink-600)" />
          </g>
        </>
      )}
    </svg>
  );
}
