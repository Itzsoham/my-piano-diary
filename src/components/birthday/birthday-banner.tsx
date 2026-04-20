"use client";

import { useState } from "react";
import { useBirthday } from "./birthday-provider";
import { X } from "lucide-react";

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
      `}</style>

      <div
        className="relative mb-4 flex items-center gap-3 overflow-hidden rounded-xl border border-pink-200/50 px-4 py-2.5 text-sm"
        style={{
          background: gradient,
          backdropFilter: "blur(8px)",
          animation: "bday-banner-in 0.5s ease-out both",
        }}
        role="status"
        aria-label="Birthday message"
      >
        {/* Left floating emojis */}
        {leftEmojis && (
          <span className="flex items-center gap-1" aria-hidden="true">
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
        <span className="shrink-0 text-base" aria-hidden="true">
          {icon}
        </span>

        {/* Text */}
        <p className="flex-1 font-medium text-rose-700/90">{text}</p>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="shrink-0 rounded-full p-0.5 text-rose-400 transition-colors hover:bg-pink-100/60 hover:text-rose-600"
          aria-label="Dismiss birthday message"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </>
  );
}
