"use client";

import { useEffect, useRef } from "react";
import { useBirthday } from "./birthday-provider";

const EMOJI_POOL = ["🎵", "✨", "💖", "🌸", "💛", "🎶", "🌷"];

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
    const maxActive = isMobile ? 3 : 6;

    const spawn = () => {
      if (countRef.current >= maxActive) return;

      countRef.current++;
      const el = document.createElement("span");
      el.textContent =
        EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;

      const size = randomBetween(13, 21);
      const left = randomBetween(2, 95);
      const duration = randomBetween(5, 8);
      const driftX = randomBetween(-25, 25);

      el.style.cssText = `
        position: absolute;
        bottom: -30px;
        left: ${left}%;
        font-size: ${size}px;
        line-height: 1;
        pointer-events: none;
        user-select: none;
        will-change: transform, opacity;
        --bday-drift-x: ${driftX}px;
        animation: bday-drift ${duration}s ease-in-out forwards;
      `;

      container.appendChild(el);

      setTimeout(() => {
        el.remove();
        countRef.current = Math.max(0, countRef.current - 1);
      }, duration * 1000);
    };

    intervalRef.current = setInterval(spawn, 2500);

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
