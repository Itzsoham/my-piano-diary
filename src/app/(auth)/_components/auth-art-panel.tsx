const PIANO_FACE = "color-mix(in srgb, var(--ink) 84%, var(--surface))";
const PIANO_FELT = "color-mix(in srgb, var(--bubblegum) 70%, var(--ink) 8%)";
const FUR_LINE = "color-mix(in srgb, var(--ink) 28%, var(--surface))";

type AuthArtPanelProps = {
  heading: string;
  copy: string;
  valueProps: string[];
};

/**
 * The left-hand art panel for the auth screens — Mochi at her upright piano,
 * ported from the login.html mockup's inline SVG scene (its geometry is kept
 * verbatim; only the mockup's screen-local custom properties are inlined as
 * color-mix() expressions since they aren't part of the shared token set).
 * Hidden below `lg` — same simplification the pre-redesign auth pages already
 * used, rather than the mockup's clipped-banner responsive treatment.
 */
export function AuthArtPanel({ heading, copy, valueProps }: AuthArtPanelProps) {
  return (
    <div className="relative isolate hidden overflow-hidden [background:linear-gradient(150deg,color-mix(in_srgb,var(--mint)_62%,var(--surface))_0%,var(--floss)_32%,var(--pink-50)_62%,color-mix(in_srgb,var(--cotton)_78%,var(--surface))_100%)] lg:flex lg:w-[46%] lg:flex-col lg:justify-center lg:gap-7 lg:p-14 xl:p-18">
      {/* the signature scalloped seam — one per screen */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[15px]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 100% 50%, var(--floss) 15px, transparent 15.5px)",
          backgroundSize: "15px 30px",
          backgroundRepeat: "repeat-y",
          backgroundPosition: "100% 0",
        }}
      />

      <svg
        viewBox="0 0 360 300"
        aria-hidden="true"
        focusable="false"
        className="relative z-1 mx-auto w-full max-w-115 drop-shadow-[0_24px_34px_rgba(60,90,92,0.16)]"
      >
        <style>{`
          .mad-note { animation: mad-floatnote 5.5s ease-in-out infinite; transform-origin: center; }
          .mad-note--2 { animation-duration: 6.8s; animation-delay: -1.4s; }
          .mad-note--3 { animation-duration: 6.1s; animation-delay: -3.2s; }
          @keyframes mad-floatnote {
            0%   { transform: translate(0, 6px) rotate(-6deg); opacity: 0; }
            18%  { opacity: 1; }
            70%  { opacity: .9; }
            100% { transform: translate(10px, -34px) rotate(10deg); opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            .mad-note { animation: none !important; }
          }
        `}</style>

        {/* floating notes */}
        <g fill="var(--pink-600)">
          <g className="mad-note">
            <ellipse
              cx="150"
              cy="70"
              rx="7"
              ry="5.2"
              transform="rotate(-18 150 70)"
            />
            <path d="M156 68V44c0-1 .6-1.6 1.6-1.4 5 1 8.4 3.6 10 7.4.4 1-.9 1.8-1.6 1-2-2.4-4.4-3.8-7-4.4V68z" />
          </g>
          <g className="mad-note mad-note--2" opacity=".85">
            <ellipse
              cx="196"
              cy="52"
              rx="5.6"
              ry="4.2"
              transform="rotate(-18 196 52)"
            />
            <path d="M201 50V31c0-.9.6-1.4 1.4-1.2 3.9.9 6.6 2.9 7.9 6 .4.8-.7 1.5-1.3.9-1.6-1.9-3.5-3-5.6-3.5V50z" />
          </g>
          <g className="mad-note mad-note--3" opacity=".7">
            <ellipse
              cx="120"
              cy="46"
              rx="5"
              ry="3.8"
              transform="rotate(-18 120 46)"
            />
            <path d="M124.5 44V28c0-.8.5-1.2 1.2-1 3.3.7 5.6 2.4 6.7 5 .3.7-.6 1.3-1.1.7-1.4-1.6-3-2.5-4.8-2.9V44z" />
          </g>
        </g>

        {/* upright piano */}
        <g>
          <rect
            x="182"
            y="96"
            width="150"
            height="176"
            rx="12"
            fill="var(--ink)"
          />
          <rect
            x="174"
            y="86"
            width="166"
            height="18"
            rx="9"
            fill={PIANO_FACE}
          />
          <rect
            x="196"
            y="112"
            width="122"
            height="60"
            rx="8"
            fill={PIANO_FACE}
          />
          <g fill="var(--ink)" opacity=".55">
            <rect x="208" y="124" width="6" height="36" rx="3" />
            <rect x="222" y="124" width="6" height="36" rx="3" />
            <rect x="236" y="124" width="6" height="36" rx="3" />
            <rect x="250" y="124" width="6" height="36" rx="3" />
            <rect x="264" y="124" width="6" height="36" rx="3" />
            <rect x="278" y="124" width="6" height="36" rx="3" />
            <rect x="292" y="124" width="6" height="36" rx="3" />
          </g>
          <rect
            x="150"
            y="180"
            width="190"
            height="10"
            rx="5"
            fill={PIANO_FACE}
          />
          <rect
            x="150"
            y="190"
            width="190"
            height="26"
            rx="4"
            fill="var(--surface)"
          />
          <g stroke="var(--line-strong)" strokeWidth="1.4">
            <path d="M164 191v25M178 191v25M192 191v25M206 191v25M220 191v25M234 191v25M248 191v25M262 191v25M276 191v25M290 191v25M304 191v25M318 191v25M332 191v25" />
          </g>
          <g fill="var(--ink)">
            <rect x="159" y="190" width="8" height="15" rx="2" />
            <rect x="173" y="190" width="8" height="15" rx="2" />
            <rect x="201" y="190" width="8" height="15" rx="2" />
            <rect x="215" y="190" width="8" height="15" rx="2" />
            <rect x="229" y="190" width="8" height="15" rx="2" />
            <rect x="257" y="190" width="8" height="15" rx="2" />
            <rect x="271" y="190" width="8" height="15" rx="2" />
            <rect x="299" y="190" width="8" height="15" rx="2" />
            <rect x="313" y="190" width="8" height="15" rx="2" />
            <rect x="327" y="190" width="8" height="15" rx="2" />
          </g>
          <rect
            x="150"
            y="216"
            width="190"
            height="7"
            rx="3"
            fill={PIANO_FELT}
          />
          <rect
            x="196"
            y="272"
            width="14"
            height="16"
            rx="4"
            fill={PIANO_FACE}
          />
          <rect
            x="304"
            y="272"
            width="14"
            height="16"
            rx="4"
            fill={PIANO_FACE}
          />
          <rect
            x="246"
            y="258"
            width="24"
            height="4"
            rx="2"
            fill={PIANO_FACE}
          />
          <rect
            x="254"
            y="262"
            width="4"
            height="12"
            rx="2"
            fill="var(--wintergreen)"
          />
        </g>

        {/* stool */}
        <g>
          <rect
            x="56"
            y="228"
            width="76"
            height="12"
            rx="6"
            fill={PIANO_FACE}
          />
          <rect
            x="64"
            y="240"
            width="7"
            height="46"
            rx="3.5"
            fill={PIANO_FACE}
          />
          <rect
            x="117"
            y="240"
            width="7"
            height="46"
            rx="3.5"
            fill={PIANO_FACE}
          />
          <rect
            x="64"
            y="262"
            width="60"
            height="5"
            rx="2.5"
            fill={PIANO_FACE}
            opacity=".7"
          />
        </g>

        {/* Mochi the cat */}
        <g>
          <path
            d="M60 214c-16 4-30 16-28 32 1 10 10 16 18 12 7-3 6-12 0-13-4-.7-6 2-5 5"
            fill="none"
            stroke="var(--surface)"
            strokeWidth="13"
            strokeLinecap="round"
          />
          <path
            d="M60 214c-16 4-30 16-28 32 1 10 10 16 18 12 7-3 6-12 0-13-4-.7-6 2-5 5"
            fill="none"
            stroke={FUR_LINE}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity=".35"
          />
          <path
            d="M66 232c0-30 14-48 34-48s34 18 34 46c0 10-4 18-10 22H74c-6-4-8-12-8-20z"
            fill="var(--surface)"
            stroke={FUR_LINE}
            strokeWidth="1.2"
          />
          <path
            d="M120 208c8-6 20-14 30-14"
            fill="none"
            stroke="var(--surface)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M120 218c8-4 22-10 32-10"
            fill="none"
            stroke="var(--surface)"
            strokeWidth="13"
            strokeLinecap="round"
          />
          <ellipse
            cx="152"
            cy="192"
            rx="9"
            ry="7"
            fill="var(--surface)"
            stroke={FUR_LINE}
            strokeWidth="1.1"
          />
          <ellipse
            cx="153"
            cy="207"
            rx="9"
            ry="7"
            fill="var(--surface)"
            stroke={FUR_LINE}
            strokeWidth="1.1"
          />
          <path
            d="M74 138l-4-26c-.5-3.4 2.6-5 5-2.8l18 16z"
            fill="var(--surface)"
            stroke={FUR_LINE}
            strokeWidth="1.2"
          />
          <path
            d="M76 130l-2-13c-.2-1.7 1.3-2.5 2.5-1.4l9 8z"
            fill="var(--cotton)"
          />
          <path
            d="M126 138l4-26c.5-3.4-2.6-5-5-2.8l-18 16z"
            fill="var(--surface)"
            stroke={FUR_LINE}
            strokeWidth="1.2"
          />
          <path
            d="M124 130l2-13c.2-1.7-1.3-2.5-2.5-1.4l-9 8z"
            fill="var(--cotton)"
          />
          <ellipse
            cx="100"
            cy="150"
            rx="35"
            ry="31"
            fill="var(--surface)"
            stroke={FUR_LINE}
            strokeWidth="1.2"
          />
          <g fill="var(--ink)">
            <path d="M86 146c0-3.6 1.6-6.4 3.6-6.4s3.6 2.8 3.6 6.4-1.6 6.4-3.6 6.4-3.6-2.8-3.6-6.4z" />
            <path d="M107 146c0-3.6 1.6-6.4 3.6-6.4s3.6 2.8 3.6 6.4-1.6 6.4-3.6 6.4-3.6-2.8-3.6-6.4z" />
          </g>
          <circle cx="91.4" cy="143.6" r="1.4" fill="var(--ink-invert)" />
          <circle cx="112.4" cy="143.6" r="1.4" fill="var(--ink-invert)" />
          <path
            d="M100 158c-2.6 0-4.4-1.6-4.4-3.4 0-1.2 1-2 2.2-2h4.4c1.2 0 2.2.8 2.2 2 0 1.8-1.8 3.4-4.4 3.4z"
            fill="var(--bubblegum)"
          />
          <path
            d="M100 158v3m0 0c0 2.6-2.4 4.4-4.8 4.4M100 161c0 2.6 2.4 4.4 4.8 4.4"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <ellipse
            cx="78"
            cy="156"
            rx="6"
            ry="4"
            fill="var(--cotton)"
            opacity=".9"
          />
          <ellipse
            cx="122"
            cy="156"
            rx="6"
            ry="4"
            fill="var(--cotton)"
            opacity=".9"
          />
          <g stroke="var(--ink-faint)" strokeWidth="1.3" strokeLinecap="round">
            <path d="M68 150h-14M68 156l-13 3M132 150h14M132 156l13 3" />
          </g>
        </g>

        <ellipse
          cx="176"
          cy="290"
          rx="140"
          ry="7"
          fill="var(--wintergreen)"
          opacity=".16"
        />
      </svg>

      <div className="relative z-1 mx-auto w-full max-w-115">
        <div className="flex items-center gap-3">
          <span className="flex size-11.5 shrink-0 items-center justify-center rounded-xl [background-image:var(--grad-brand)] text-white shadow-(--sh-pink)">
            <svg
              viewBox="0 0 24 24"
              width="23"
              height="23"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M9 4v9M15 4v9M3 13h18" />
            </svg>
          </span>
          <span>
            <span className="text-ink block text-lg font-bold">
              My Piano Diary
            </span>
            <span className="block text-xs font-medium text-teal-700">
              Personal teaching space
            </span>
          </span>
        </div>

        <h1 className="text-ink mt-3.5 font-serif text-[clamp(1.7rem,2.6vw,2.1rem)] leading-tight font-normal">
          {heading}
        </h1>
        <p className="text-ink mt-3 max-w-[34ch] text-[15px] leading-relaxed font-medium">
          {copy}
        </p>

        <ul className="mt-5 grid gap-2.5">
          {valueProps.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2.5 text-[13.5px] font-medium text-teal-700"
            >
              <span
                aria-hidden="true"
                className="bg-wintergreen size-1.5 shrink-0 rounded-full"
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
