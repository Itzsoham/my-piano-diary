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
function MarkSparkle({
  transform,
  fill = "#ffffff",
}: {
  transform: string;
  fill?: string;
}) {
  return (
    <path
      transform={transform}
      d="M12 1.5c.9 5.7 3.9 8.7 9.6 9.6-5.7.9-8.7 3.9-9.6 9.6-.9-5.7-3.9-8.7-9.6-9.6C8.1 10.2 11.1 7.2 12 1.5z"
      fill={fill}
    />
  );
}

const SAKURA_PETAL =
  "M0 0 C -5.5 -2 -6 -7 -4 -11 C -2.5 -14 -1 -15 0 -15 C 1 -15 2.5 -14 4 -11 C 6 -7 5.5 -2 0 0 Z";
const SAKURA_ANGLES = [0, 72, 144, 216, 288];

/**
 * A cherry-blossom bloom — 5 notched, veined petals around a center dot.
 * Used at full scale as the hero of "sakura-keys" and small as the accent
 * flower on "diary-keys". Stroke widths are pre-divided by `scale` so the
 * outline reads the same weight at either size instead of thinning out.
 */
function SakuraBloom({
  cx,
  cy,
  scale = 1,
  centerColor = "var(--sand-300)",
}: {
  cx: number;
  cy: number;
  scale?: number;
  centerColor?: string;
}) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <g fill="#ffffff" stroke="var(--pink-800)" strokeWidth={1.6 / scale}>
        {SAKURA_ANGLES.map((angle) => (
          <path key={angle} d={SAKURA_PETAL} transform={`rotate(${angle})`} />
        ))}
      </g>
      <g stroke="var(--pink-600)" strokeWidth={0.7 / scale} opacity="0.55">
        {SAKURA_ANGLES.map((angle) => (
          <line
            key={angle}
            x1="0"
            y1="-3"
            x2="0"
            y2="-13"
            transform={`rotate(${angle})`}
          />
        ))}
      </g>
      <circle
        cx="0"
        cy="0"
        r="4.2"
        fill={centerColor}
        stroke="var(--pink-800)"
        strokeWidth={1.4 / scale}
      />
    </g>
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
            d="M14 29 L11 10 L31 22 Z"
            fill="#ffffff"
            stroke="var(--pink-800)"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="M50 29 L53 10 L33 22 Z"
            fill="#ffffff"
            stroke="var(--pink-800)"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          {/* head — wide, filling most of the badge like the reference */}
          <ellipse
            cx="32"
            cy="38"
            rx="21"
            ry="17"
            fill="#ffffff"
            stroke="var(--pink-800)"
            strokeWidth="2.3"
          />
          {/* closed, happy eyes */}
          <path
            d="M22 36q3.4 3.2 6.8 0"
            fill="none"
            stroke="var(--pink-800)"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M35.2 36q3.4 3.2 6.8 0"
            fill="none"
            stroke="var(--pink-800)"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          {/* smile */}
          <path
            d="M28.5 44q3.5 3 7 0"
            fill="none"
            stroke="var(--pink-800)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* blush */}
          <ellipse cx="20" cy="41.5" rx="3.6" ry="2.3" fill="var(--bubblegum)" opacity="0.75" />
          <ellipse cx="44" cy="41.5" rx="3.6" ry="2.3" fill="var(--bubblegum)" opacity="0.75" />
          {/* whiskers */}
          <g stroke="var(--pink-800)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5">
            <line x1="13" y1="38" x2="4" y2="35" />
            <line x1="13" y1="41" x2="4" y2="41.5" />
            <line x1="13" y1="44" x2="4" y2="47" />
            <line x1="51" y1="38" x2="60" y2="35" />
            <line x1="51" y1="41" x2="60" y2="41.5" />
            <line x1="51" y1="44" x2="60" y2="47" />
          </g>
          {/* bow — bigger, tilted, off-center like the reference */}
          <g transform="translate(28 2) scale(0.62) rotate(-8 12 12)">
            <path
              d="M11.4 12C9.6 9.1 7.4 7.6 5.4 7.6 3.5 7.6 2.2 8.9 2.2 10.8c0 2.6 2.1 4.6 4.9 4.6 1.7 0 3.2-1.2 4.3-3.4z"
              fill="var(--pink-600)"
            />
            <path
              d="M12.6 12c1.8-2.9 4-4.4 6-4.4 1.9 0 3.2 1.3 3.2 3.2 0 2.6-2.1 4.6-4.9 4.6-1.7 0-3.2-1.2-4.3-3.4z"
              fill="var(--pink-600)"
            />
            <circle cx="12" cy="12" r="2.2" fill="var(--pink-800)" />
          </g>
          <MarkSparkle transform="translate(45 6) scale(0.5)" fill="var(--sand-300)" />
          <MarkSparkle transform="translate(8 47) scale(0.26)" />
        </>
      )}

      {variant === "sakura-keys" && (
        <>
          {/* piano keys — wide, spanning most of the badge */}
          <rect
            x="8"
            y="41"
            width="48"
            height="17"
            rx="3"
            fill="#ffffff"
            stroke="var(--pink-800)"
            strokeWidth="2.1"
          />
          <g stroke="var(--pink-800)" strokeWidth="1.1" opacity="0.7">
            <line x1="17.6" y1="41" x2="17.6" y2="58" />
            <line x1="27.2" y1="41" x2="27.2" y2="58" />
            <line x1="36.8" y1="41" x2="36.8" y2="58" />
            <line x1="46.4" y1="41" x2="46.4" y2="58" />
          </g>
          <g fill="var(--pink-800)">
            <rect x="13.4" y="41" width="4.6" height="10" rx="1" />
            <rect x="23" y="41" width="4.6" height="10" rx="1" />
            <rect x="32.6" y="41" width="4.6" height="10" rx="1" />
            <rect x="42.2" y="41" width="4.6" height="10" rx="1" />
          </g>
          {/* blossom, sitting on the keys */}
          <SakuraBloom cx={32} cy={24} />
          <MarkSparkle transform="translate(45 5) scale(0.48)" fill="var(--sand-300)" />
          <MarkSparkle transform="translate(9 8) scale(0.34)" />
          <circle cx="51" cy="15" r="1.6" fill="var(--bubblegum)" />
        </>
      )}

      {variant === "diary-keys" && (
        <>
          {/* spine (mint sliver on the left edge) + cover, then one unified outline */}
          <rect x="13" y="10" width="12" height="42" rx="4" fill="var(--wintergreen)" />
          <rect x="18" y="10" width="33" height="42" rx="4" fill="var(--bubblegum)" />
          <rect
            x="13"
            y="10"
            width="38"
            height="42"
            rx="4"
            fill="none"
            stroke="var(--pink-800)"
            strokeWidth="2.2"
          />
          {/* ribbon bookmark, hanging out the bottom */}
          <path d="M19 52v7l2.5-2.6 2.5 2.6v-7z" fill="var(--pink-600)" />
          {/* page-edge ticks along the right edge */}
          <g stroke="var(--pink-800)" strokeWidth="1" opacity="0.5">
            <line x1="49" y1="14" x2="51.5" y2="14" />
            <line x1="49" y1="18.5" x2="51.5" y2="18.5" />
            <line x1="49" y1="23" x2="51.5" y2="23" />
            <line x1="49" y1="27.5" x2="51.5" y2="27.5" />
            <line x1="49" y1="32" x2="51.5" y2="32" />
            <line x1="49" y1="36.5" x2="51.5" y2="36.5" />
            <line x1="49" y1="41" x2="51.5" y2="41" />
            <line x1="49" y1="45.5" x2="51.5" y2="45.5" />
          </g>
          {/* dashed rule above the keys */}
          <line
            x1="21"
            y1="38"
            x2="48"
            y2="38"
            stroke="var(--pink-800)"
            strokeWidth="1.1"
            strokeDasharray="2.2 2.2"
            opacity="0.6"
          />
          {/* piano keys along the bottom edge */}
          <rect
            x="19"
            y="41"
            width="30"
            height="10"
            rx="1.5"
            fill="#ffffff"
            stroke="var(--pink-800)"
            strokeWidth="1.7"
          />
          <g stroke="var(--pink-800)" strokeWidth="1" opacity="0.7">
            <line x1="25" y1="41" x2="25" y2="51" />
            <line x1="31" y1="41" x2="31" y2="51" />
            <line x1="37" y1="41" x2="37" y2="51" />
            <line x1="43" y1="41" x2="43" y2="51" />
          </g>
          <g fill="var(--pink-800)">
            <rect x="21.8" y="41" width="3.4" height="6" rx="0.8" />
            <rect x="27.8" y="41" width="3.4" height="6" rx="0.8" />
            <rect x="33.8" y="41" width="3.4" height="6" rx="0.8" />
            <rect x="39.8" y="41" width="3.4" height="6" rx="0.8" />
          </g>
          {/* small blossom accent, top-right of the cover */}
          <SakuraBloom cx={43} cy={18} scale={0.44} centerColor="var(--pink-600)" />
        </>
      )}
    </svg>
  );
}
