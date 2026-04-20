"use client";

import { useEffect, useRef } from "react";
import { useBirthday } from "./birthday-provider";

// Each entry: [emoji, glowColor, bgColor]
const EMOJI_POOL: [string, string, string][] = [
  // Musical
  ["🎵", "rgba(192,132,252,0.75)", "rgba(233,213,255,0.25)"],
  ["🎶", "rgba(192,132,252,0.75)", "rgba(233,213,255,0.25)"],
  ["🎹", "rgba(192,132,252,0.65)", "rgba(233,213,255,0.2)"],
  // Pink / love
  ["💖", "rgba(244,114,182,0.85)", "rgba(251,207,232,0.3)"],
  ["💝", "rgba(244,114,182,0.8)", "rgba(251,207,232,0.25)"],
  ["🌸", "rgba(244,114,182,0.7)", "rgba(251,207,232,0.2)"],
  ["🌷", "rgba(244,114,182,0.7)", "rgba(251,207,232,0.2)"],
  ["🪷", "rgba(244,114,182,0.75)", "rgba(251,207,232,0.25)"],
  ["🌹", "rgba(244,114,182,0.8)", "rgba(251,207,232,0.25)"],
  ["🎀", "rgba(244,114,182,0.75)", "rgba(251,207,232,0.2)"],
  // Gold / sparkle
  ["✨", "rgba(253,224,71,0.85)", "rgba(253,230,138,0.3)"],
  ["💫", "rgba(253,224,71,0.8)", "rgba(253,230,138,0.25)"],
  ["🌟", "rgba(253,224,71,0.8)", "rgba(253,230,138,0.25)"],
  ["🪄", "rgba(253,224,71,0.7)", "rgba(253,230,138,0.2)"],
  ["💛", "rgba(253,224,71,0.75)", "rgba(253,230,138,0.25)"],
  // Birthday
  ["🎂", "rgba(251,207,232,0.85)", "rgba(251,207,232,0.3)"],
  ["🎁", "rgba(244,114,182,0.75)", "rgba(251,207,232,0.2)"],
  ["🎊", "rgba(192,132,252,0.8)", "rgba(233,213,255,0.25)"],
  ["🎉", "rgba(192,132,252,0.75)", "rgba(233,213,255,0.2)"],
  ["🎈", "rgba(244,114,182,0.7)", "rgba(251,207,232,0.2)"],
  ["🍰", "rgba(253,224,71,0.75)", "rgba(253,230,138,0.2)"],
  // Nature / soft
  ["🌺", "rgba(244,114,182,0.7)", "rgba(251,207,232,0.2)"],
  ["🦋", "rgba(192,132,252,0.7)", "rgba(233,213,255,0.2)"],
];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function FloatingElements() {
  const { isBirthdayMode } = useBirthday();
  const containerRef = useRef<HTMLDivElement>(null);
  const countRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isBirthdayMode) return;
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const maxActive = isMobile ? 4 : 8;

    const spawn = () => {
      if (countRef.current >= maxActive) return;
      countRef.current++;

      const entry = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;
      const [emoji, glow, bg] = entry;

      const size = randomBetween(15, 24);
      const pad = size * 0.55;
      const left = randomBetween(2, 94);
      const duration = randomBetween(5.5, 9);
      const driftX = randomBetween(-30, 30);
      // slight random rotation wobble
      const rot1 = randomBetween(-18, 18);
      const rot2 = randomBetween(-12, 12);

      // Wrapper: glowing circle badge
      const wrapper = document.createElement("div");
      wrapper.style.cssText = `
        position: absolute;
        bottom: -40px;
        left: ${left}%;
        width: ${size + pad * 2}px;
        height: ${size + pad * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle at 40% 35%, ${bg} 0%, transparent 72%);
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        user-select: none;
        will-change: transform, opacity;
        --bday-drift-x: ${driftX}px;
        animation: bday-drift ${duration}s ease-in-out forwards;
        filter: drop-shadow(0 0 ${Math.round(size * 0.45)}px ${glow})
                drop-shadow(0 0 ${Math.round(size * 0.9)}px ${glow.replace(/[\d.]+\)$/, "0.35)")});
      `;

      // Inner emoji span with subtle rotation wobble via keyframe override
      const inner = document.createElement("span");
      inner.textContent = emoji;
      inner.style.cssText = `
        font-size: ${size}px;
        line-height: 1;
        display: block;
        animation: bday-fe-wobble ${(duration * 0.6).toFixed(1)}s ease-in-out infinite alternate;
        --r1: ${rot1}deg;
        --r2: ${rot2}deg;
      `;
      wrapper.appendChild(inner);
      container.appendChild(wrapper);

      setTimeout(() => {
        wrapper.remove();
        countRef.current = Math.max(0, countRef.current - 1);
      }, duration * 1000);
    };

    // Inject wobble keyframe once
    const styleId = "bday-fe-style";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = `
        @keyframes bday-fe-wobble {
          0%   { transform: rotate(var(--r1, -12deg)) scale(1);    }
          100% { transform: rotate(var(--r2,  12deg)) scale(1.08); }
        }
      `;
      document.head.appendChild(s);
    }

    intervalRef.current = setInterval(spawn, 2200);
    spawn(); // spawn one immediately

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      countRef.current = 0;
    };
  }, [isBirthdayMode]);

  if (!isBirthdayMode) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-5 overflow-hidden"
      aria-hidden="true"
    />
  );
}
