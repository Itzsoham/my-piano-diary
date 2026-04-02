"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TARGET_DATE = new Date("2026-04-24T00:00:00");
const PARTICLE_POOL = ["✨", "🎵", "💖", "🌸", "💛", "🎶", "🌷"];

function getTimeLeft() {
  const diff = TARGET_DATE.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
  };
}

interface Particle {
  id: number;
  left: number;
  emoji: string;
  dur: number;
}

function playChime() {
  try {
    type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
    const Ctx =
      window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.13;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch {
    // AudioContext unavailable — silently skip
  }
}

export function BirthdayCountdownCard() {
  const [tl, setTl] = useState<ReturnType<typeof getTimeLeft>>(null);
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Hydration-safe mount + countdown tick (per-minute)
  useEffect(() => {
    setMounted(true);
    setTl(getTimeLeft());
    const id = setInterval(() => setTl(getTimeLeft()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Spawn particles one by one with proper stagger
  useEffect(() => {
    if (!mounted) return;

    const cleanupTimers: Array<() => void> = [];

    const spawnOne = () => {
      const particle: Particle = {
        id: Math.random(),
        left: 4 + Math.random() * 92,
        emoji: PARTICLE_POOL[Math.floor(Math.random() * PARTICLE_POOL.length)]!,
        dur: 1.6 + Math.random() * 0.6,
      };
      setParticles((p) => [...p, particle]);
      const removeTimeout = setTimeout(() => {
        setParticles((p) => p.filter((x) => x.id !== particle.id));
      }, 2400);
      cleanupTimers.push(() => clearTimeout(removeTimeout));
    };

    // Spawn first particle after 300ms
    const firstSpawn = setTimeout(() => {
      spawnOne();
      // Then spawn every 350-450ms
      const spawnInterval = setInterval(
        () => {
          spawnOne();
        },
        350 + Math.random() * 100,
      );
      cleanupTimers.push(() => clearInterval(spawnInterval));
    }, 300);
    cleanupTimers.push(() => clearTimeout(firstSpawn));

    return () => {
      cleanupTimers.forEach((cleanup) => cleanup());
    };
  }, [mounted]);

  // Burst on click: spawn 4-5 emojis at once
  const handleBurst = () => {
    playChime();
    const burst: Particle[] = Array.from(
      { length: 4 + Math.floor(Math.random() * 2) },
      () => ({
        id: Math.random(),
        left: 4 + Math.random() * 92,
        emoji: PARTICLE_POOL[Math.floor(Math.random() * PARTICLE_POOL.length)]!,
        dur: 1.6 + Math.random() * 0.6,
      }),
    );
    setParticles((p) => [...p, ...burst]);
    setTimeout(() => {
      setParticles((p) => p.filter((x) => !burst.some((b) => b.id === x.id)));
    }, 2400);
  };

  if (!mounted) return null;

  if (!tl) {
    return (
      <button
        type="button"
        onClick={handleBurst}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-pink-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-rose-600 shadow-md backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <span>🎂</span>
        <span>It&apos;s your special day!</span>
        <span>💛</span>
      </button>
    );
  }

  return (
    <>
      {/* Keyframes injected once per client render */}
      <style>{`
        @keyframes bcd-float {
          0%   { opacity: 1;   transform: translateY(0)     scale(0.85); }
          60%  { opacity: 0.7; }
          100% { opacity: 0;   transform: translateY(-56px) scale(1.3); }
        }
        .bcd-particle {
          position: absolute;
          bottom: 30%;
          font-size: 13px;
          line-height: 1;
          pointer-events: none;
          user-select: none;
          z-index: 30;
        }
      `}</style>

      <button
        type="button"
        onClick={handleBurst}
        className={cn(
          "group relative inline-flex cursor-pointer items-center gap-2.5 rounded-full select-none",
          "border border-pink-200/60 bg-white/60 px-4 py-2 backdrop-blur-md",
          "shadow-[0_4px_18px_-4px_rgba(244,114,182,0.32)]",
          "transition-all duration-300 ease-out",
          "hover:scale-105 hover:bg-white/80 hover:shadow-[0_8px_26px_-6px_rgba(244,114,182,0.55)]",
          "active:scale-95",
        )}
      >
        {/* Floating particles */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="bcd-particle"
            style={{
              left: `${p.left}%`,
              animation: `bcd-float ${p.dur}s ease-out forwards`,
            }}
          >
            {p.emoji}
          </span>
        ))}

        {/* Music note icon */}
        <span className="text-[15px] leading-none">🎵</span>

        {/* Mystery label */}
        <span className="text-[11px] font-medium text-rose-500/80 sm:text-xs">
          Something special is coming
          <span className="ml-0.5 text-rose-400/50">…</span>
        </span>

        {/* Divider */}
        <span className="h-3.5 w-px shrink-0 bg-pink-200/80" />

        {/* Live countdown */}
        <span className="flex items-baseline gap-1 tabular-nums">
          <span className="text-sm font-bold text-rose-600">{tl.days}</span>
          <span className="text-[10px] font-medium text-rose-400">d</span>
          <span className="text-[10px] text-rose-300/70">·</span>
          <span className="text-sm font-bold text-rose-600">
            {String(tl.hours).padStart(2, "0")}
          </span>
          <span className="text-[10px] font-medium text-rose-400">h</span>
          <span className="text-[10px] text-rose-300/70">·</span>
          <span className="text-sm font-bold text-rose-600">
            {String(tl.minutes).padStart(2, "0")}
          </span>
          <span className="text-[10px] font-medium text-rose-400">m</span>
        </span>

        {/* Pulsing sparkle */}
        <span className="animate-pulse text-[14px] leading-none">✨</span>
      </button>
    </>
  );
}
