import { ImageResponse } from "next/og";

/**
 * The favicon, generated rather than shipped as a file: public/logo.png is
 * 350x350 and 141 KB, which is far too heavy to hand a browser on every page
 * load. This redraws the Blossom Diary mark — the five-petal bloom on the
 * brand gradient — at icon scale for about a kilobyte.
 *
 * Built from plain SVG shapes with literal hex colours because Satori resolves
 * neither CSS custom properties nor Tailwind; the values match --bubblegum,
 * --wintergreen and --pink-600 in src/styles/globals.css.
 */
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f3a2be 0%, #81bfb7 100%)",
        borderRadius: 112,
      }}
    >
      <svg width="340" height="340" viewBox="0 0 24 24">
        <g fill="#ffffff">
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
    </div>,
    size,
  );
}
