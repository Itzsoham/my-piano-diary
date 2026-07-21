"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import type { LogoVariant } from "@/lib/logo-preference";

type LogoMarkProps = {
  variant?: LogoVariant;
  size?: number;
  className?: string;
};

/** Small 4-point sparkle accent, reused across the outlined marks below. */
function MarkSparkle({ transform }: { transform: string }) {
  return (
    <path
      transform={transform}
      d="M12 1.5c.9 5.7 3.9 8.7 9.6 9.6-5.7.9-8.7 3.9-9.6 9.6-.9-5.7-3.9-8.7-9.6-9.6C8.1 10.2 11.1 7.2 12 1.5z"
      fill="#ffffff"
    />
  );
}

/**
 * The app icon — a rounded-square badge on the brand gradient
 * (--bubblegum -> --wintergreen), in one of five marks:
 *   "blossom"     — the app's own 5-petal blossom ornament, as a flat badge
 *   "mochi"       — the studio cat's face, flat, reduced to icon scale
 *   "kitty"       — a sleepy cat face with a bow, outlined kawaii style
 *   "sakura-keys" — a blossom resting on piano keys, outlined kawaii style
 *   "diary-keys"  — a diary with piano keys along the bottom edge, outlined
 * "blossom"/"mochi" reuse the app's existing flat-icon language (no outline,
 * currentColor-style fills). The other three match a reference set of
 * outlined kawaii app icons the user supplied — heavier linework in
 * --pink-800 (already the app's deepest pink token) instead of the flat
 * style, so treat them as a deliberately distinct sub-family, not a mistake.
 * Purely decorative (aria-hidden) — pair with visible text wherever it's
 * used as the only brand mark on screen.
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

      {variant === "blossom" && (
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
      )}

      {variant === "mochi" && (
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

      {variant === "kitty" && (
        <>
          {/* ears — drawn first so the head silhouette's stroke covers the join */}
          <path
            d="M19 25 L14 13 L28 20 Z"
            fill="#ffffff"
            stroke="var(--pink-800)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M45 25 L50 13 L36 20 Z"
            fill="#ffffff"
            stroke="var(--pink-800)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* head */}
          <ellipse
            cx="32"
            cy="36"
            rx="18"
            ry="15"
            fill="#ffffff"
            stroke="var(--pink-800)"
            strokeWidth="2.2"
          />
          {/* closed, happy eyes */}
          <path
            d="M23 34q3 3 6 0"
            fill="none"
            stroke="var(--pink-800)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M35 34q3 3 6 0"
            fill="none"
            stroke="var(--pink-800)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* smile */}
          <path
            d="M29 41q3 2.6 6 0"
            fill="none"
            stroke="var(--pink-800)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          {/* blush */}
          <ellipse cx="22" cy="39.5" rx="3.1" ry="2" fill="var(--cotton)" opacity="0.9" />
          <ellipse cx="42" cy="39.5" rx="3.1" ry="2" fill="var(--cotton)" opacity="0.9" />
          {/* whiskers */}
          <g stroke="var(--pink-800)" strokeWidth="1.1" strokeLinecap="round" opacity="0.55">
            <line x1="15" y1="36" x2="6" y2="33" />
            <line x1="15" y1="39" x2="6" y2="39.5" />
            <line x1="49" y1="36" x2="58" y2="33" />
            <line x1="49" y1="39" x2="58" y2="39.5" />
          </g>
          {/* bow */}
          <g transform="translate(27 6.5) scale(0.42)">
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
          <MarkSparkle transform="translate(43 6) scale(0.42)" />
          <MarkSparkle transform="translate(8 44) scale(0.28)" />
        </>
      )}

      {variant === "sakura-keys" && (
        <>
          {/* piano keys */}
          <rect
            x="10"
            y="42"
            width="44"
            height="16"
            rx="3"
            fill="#ffffff"
            stroke="var(--pink-800)"
            strokeWidth="2"
          />
          <g stroke="var(--pink-800)" strokeWidth="1.1" opacity="0.7">
            <line x1="19.6" y1="42" x2="19.6" y2="58" />
            <line x1="28.4" y1="42" x2="28.4" y2="58" />
            <line x1="37.2" y1="42" x2="37.2" y2="58" />
            <line x1="46" y1="42" x2="46" y2="58" />
          </g>
          <g fill="var(--pink-800)">
            <rect x="15.5" y="42" width="4.4" height="9" rx="1" />
            <rect x="24.5" y="42" width="4.4" height="9" rx="1" />
            <rect x="35.5" y="42" width="4.4" height="9" rx="1" />
            <rect x="44.5" y="42" width="4.4" height="9" rx="1" />
          </g>
          {/* blossom, sitting on the keys */}
          <g transform="translate(32 27)">
            <g fill="#ffffff" stroke="var(--pink-800)" strokeWidth="1.6">
              <ellipse cx="0" cy="-8.2" rx="5.2" ry="7.4" />
              <ellipse cx="0" cy="-8.2" rx="5.2" ry="7.4" transform="rotate(72)" />
              <ellipse cx="0" cy="-8.2" rx="5.2" ry="7.4" transform="rotate(144)" />
              <ellipse cx="0" cy="-8.2" rx="5.2" ry="7.4" transform="rotate(216)" />
              <ellipse cx="0" cy="-8.2" rx="5.2" ry="7.4" transform="rotate(288)" />
            </g>
            <circle
              cx="0"
              cy="0"
              r="4"
              fill="var(--sand-300)"
              stroke="var(--pink-800)"
              strokeWidth="1.4"
            />
          </g>
          <MarkSparkle transform="translate(44 6) scale(0.42)" />
          <MarkSparkle transform="translate(9 10) scale(0.26)" />
        </>
      )}

      {variant === "diary-keys" && (
        <>
          {/* cover */}
          <rect
            x="14"
            y="12"
            width="36"
            height="40"
            rx="4"
            fill="var(--cotton)"
            stroke="var(--pink-800)"
            strokeWidth="2.2"
          />
          {/* ribbon bookmark */}
          <path d="M36 12h6v15l-3-3-3 3z" fill="var(--pink-600)" />
          {/* dashed rule above the keys */}
          <line
            x1="18"
            y1="38"
            x2="46"
            y2="38"
            stroke="var(--pink-800)"
            strokeWidth="1.1"
            strokeDasharray="2.2 2.2"
            opacity="0.6"
          />
          {/* piano keys along the bottom edge */}
          <rect
            x="17"
            y="41"
            width="30"
            height="9"
            rx="1.5"
            fill="#ffffff"
            stroke="var(--pink-800)"
            strokeWidth="1.6"
          />
          <g stroke="var(--pink-800)" strokeWidth="1" opacity="0.7">
            <line x1="24.5" y1="41" x2="24.5" y2="50" />
            <line x1="32" y1="41" x2="32" y2="50" />
            <line x1="39.5" y1="41" x2="39.5" y2="50" />
          </g>
          <g fill="var(--pink-800)">
            <rect x="21" y="41" width="3.4" height="5.4" rx="0.8" />
            <rect x="28.5" y="41" width="3.4" height="5.4" rx="0.8" />
            <rect x="36" y="41" width="3.4" height="5.4" rx="0.8" />
            <rect x="43" y="41" width="3.4" height="5.4" rx="0.8" />
          </g>
          {/* small blossom accent */}
          <g transform="translate(40 20) scale(0.55)">
            <g fill="#ffffff" stroke="var(--pink-800)" strokeWidth="1.6">
              <ellipse cx="0" cy="-7.4" rx="4.8" ry="6.8" />
              <ellipse cx="0" cy="-7.4" rx="4.8" ry="6.8" transform="rotate(72)" />
              <ellipse cx="0" cy="-7.4" rx="4.8" ry="6.8" transform="rotate(144)" />
              <ellipse cx="0" cy="-7.4" rx="4.8" ry="6.8" transform="rotate(216)" />
              <ellipse cx="0" cy="-7.4" rx="4.8" ry="6.8" transform="rotate(288)" />
            </g>
            <circle
              cx="0"
              cy="0"
              r="3.6"
              fill="var(--sand-300)"
              stroke="var(--pink-800)"
              strokeWidth="1.3"
            />
          </g>
          <MarkSparkle transform="translate(7 10) scale(0.3)" />
        </>
      )}
    </svg>
  );
}
