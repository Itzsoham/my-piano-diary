"use client";

import { useState } from "react";
import { useBirthday } from "./birthday-provider";
import { X } from "lucide-react";

const SPARKLE_POSITIONS = [
  { top: "14%", left: "10%", delay: "0s", duration: "2.8s", size: "10px" },
  { top: "24%", left: "26%", delay: "0.5s", duration: "3.2s", size: "8px" },
  { top: "68%", left: "18%", delay: "1.1s", duration: "3.1s", size: "9px" },
  { top: "20%", left: "54%", delay: "0.3s", duration: "2.6s", size: "7px" },
  { top: "72%", left: "50%", delay: "1.4s", duration: "3.4s", size: "9px" },
  { top: "18%", left: "76%", delay: "0.9s", duration: "3.3s", size: "8px" },
  { top: "68%", left: "82%", delay: "1.7s", duration: "2.9s", size: "10px" },
  { top: "42%", left: "92%", delay: "0.7s", duration: "3.5s", size: "7px" },
] as const;

interface BirthdayBannerProps {
  text: string;
  icon?: string;
  /** Unique key for this banner used in sessionStorage dismiss */
  storageKey: string;
  /** Extra floating emojis that slide in from left on mount */
  leftEmojis?: string[];
  gradient?: string;
}

export function BirthdayBanner({
  text,
  icon = "🎂",
  storageKey,
  leftEmojis,
  gradient = "linear-gradient(135deg, rgba(251,207,232,0.55) 0%, rgba(233,213,255,0.45) 60%, rgba(253,230,138,0.35) 100%)",
}: BirthdayBannerProps) {
  const { isBirthdayMode } = useBirthday();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(`bday-banner-${storageKey}`) === "1";
  });

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(`bday-banner-${storageKey}`, "1");
  };

  if (!isBirthdayMode || dismissed) return null;

  return (
    <>
      <style>{`
        @keyframes bday-banner-in {
          0%   { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes bday-emoji-slide {
          0%   { opacity: 0; transform: translateX(-24px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes bday-banner-sparkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.7) rotate(0deg);
            filter: drop-shadow(0 0 0 rgba(251, 207, 232, 0));
          }
          50% {
            opacity: 0.95;
            transform: scale(1.18) rotate(10deg);
            filter: drop-shadow(0 0 8px rgba(251, 207, 232, 0.65));
          }
        }
      `}</style>

      <div
        className="relative mb-4 flex items-start gap-2 overflow-hidden rounded-xl border border-pink-200/50 px-3 py-2.5 text-sm sm:mb-5 sm:items-center sm:gap-3 sm:px-4"
        style={{
          background: gradient,
          backdropFilter: "blur(8px)",
          animation: "bday-banner-in 0.5s ease-out both",
        }}
        role="status"
        aria-label="Birthday message"
      >
        <span
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          {SPARKLE_POSITIONS.map((sparkle, index) => (
            <span
              key={index}
              className="absolute text-pink-300/80"
              style={{
                top: sparkle.top,
                left: sparkle.left,
                width: sparkle.size,
                height: sparkle.size,
                animation: `bday-banner-sparkle ${sparkle.duration} ease-in-out infinite`,
                animationDelay: sparkle.delay,
              }}
            >
              ✦
            </span>
          ))}
        </span>

        {/* Left floating emojis */}
        {leftEmojis && (
          <span
            className="flex shrink-0 items-center gap-0.5 sm:gap-1"
            aria-hidden="true"
          >
            {leftEmojis.map((emoji, i) => (
              <span
                key={i}
                style={{
                  animation: `bday-emoji-slide 0.5s ease-out both`,
                  animationDelay: `${i * 0.12}s`,
                  display: "inline-block",
                }}
              >
                {emoji}
              </span>
            ))}
          </span>
        )}

        {/* Icon */}
        <span
          className="shrink-0 text-sm sm:text-base"
          style={{ animation: "bday-float 3.2s ease-in-out infinite" }}
          aria-hidden="true"
        >
          {icon}
        </span>

        {/* Text */}
        <p className="flex-1 text-xs leading-snug font-medium text-rose-700/90 sm:text-sm">
          {text}
        </p>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="z-10 shrink-0 rounded-full p-1 text-rose-400 transition-colors hover:bg-pink-100/60 hover:text-rose-600"
          aria-label="Dismiss birthday message"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </>
  );
}
