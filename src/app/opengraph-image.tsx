import { ImageResponse } from "next/og";

import { APP_CONFIG } from "@/config/app-config";

/**
 * The 1200x630 share card behind every link to this site, generated at request
 * time instead of committed as a PNG so the copy can never drift from
 * app-config. This is what lets the root layout claim `summary_large_image`:
 * before it existed the only artwork was a 350x350 logo, which degrades to a
 * bare link on X and Slack.
 *
 * Satori (which renders this) supports a flexbox subset only — no CSS grid, no
 * custom properties, and every element holding more than one child needs an
 * explicit `display: flex`. Colours are literal hex copies of --bubblegum,
 * --floss, --ink, --pink-700 and --wintergreen.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${APP_CONFIG.name} — the studio diary for piano teachers`;

function Bloom({
  scale = 1,
  color = "#ffffff",
}: {
  scale?: number;
  color?: string;
}) {
  return (
    <svg width={96 * scale} height={96 * scale} viewBox="0 0 24 24">
      <g fill={color}>
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
      <circle cx="12" cy="12" r="2.9" fill="#c9407a" />
    </svg>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: 72,
        background:
          "linear-gradient(140deg, #e6f4f2 0%, #f0f9f8 38%, #ffffff 55%, #fdeef3 78%, #fbdde8 100%)",
      }}
    >
      {/* brand row */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 84,
            height: 84,
            borderRadius: 26,
            background: "linear-gradient(135deg, #f3a2be 0%, #81bfb7 100%)",
          }}
        >
          <Bloom scale={0.58} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#2b4442" }}>
            {APP_CONFIG.name}
          </div>
          <div style={{ fontSize: 20, color: "#4a726f" }}>
            Personal teaching space
          </div>
        </div>
      </div>

      {/* headline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#2b4442",
            maxWidth: 900,
          }}
        >
          Every lesson, every blossom, in one soft little diary.
        </div>
        <div style={{ fontSize: 28, color: "#4a726f", maxWidth: 880 }}>
          {APP_CONFIG.meta.shareDescription}
        </div>
      </div>

      {/* footer chips */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {["Attendance", "Blossom scoring", "Tuition", "Printable reports"].map(
          (chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 24px",
                borderRadius: 999,
                background: "#ffffff",
                border: "1px solid #dcecea",
                fontSize: 22,
                color: "#8a2b56",
                fontWeight: 600,
              }}
            >
              {chip}
            </div>
          ),
        )}
      </div>
    </div>,
    size,
  );
}
