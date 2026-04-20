"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { isBirthdayToday } from "@/config/app-config";

const TARGET_DATE = new Date("2026-04-24T00:00:00");
const PARTICLE_POOL = [
  "✨",
  "🎵",
  "💖",
  "🌸",
  "💛",
  "🎶",
  "🌷",
  "🎂",
  "🌟",
  "💫",
];

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
  size: number;
}

function playChime() {
  try {
    type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
    const Ctx =
      window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    // Richer chime — 5 notes ascending
    [523.25, 587.33, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.11;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  } catch {
    // AudioContext unavailable — silently skip
  }
}

function fireBirthdayConfetti() {
  const colors = ["#fbcfe8", "#e9d5ff", "#fde68a", "#f9a8d4", "#c084fc"];
  void confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.3, y: 0.5 },
    colors,
  });
  setTimeout(() => {
    void confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.7, y: 0.5 },
      colors,
    });
  }, 250);
  setTimeout(() => {
    void confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
    });
    void confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
    });
  }, 600);
}

function LetterReveal({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={className} aria-label={text}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            animation: `bday-letter-reveal 0.5s ease-out both`,
            animationDelay: `${i * 0.04}s`,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

export function BirthdayCountdownCard() {
  const [tl, setTl] = useState<ReturnType<typeof getTimeLeft>>(null);
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [rings, setRings] = useState<number[]>([]);
  const isToday = isBirthdayToday();
  const confettiFiredRef = useRef(false);

  // Hydration-safe mount + countdown tick (per-minute)
  useEffect(() => {
    setMounted(true);
    setTl(getTimeLeft());
    const id = setInterval(() => setTl(getTimeLeft()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Auto-fire confetti on birthday day (once)
  useEffect(() => {
    if (!mounted || !isToday || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    const t = setTimeout(() => fireBirthdayConfetti(), 800);
    return () => clearTimeout(t);
  }, [mounted, isToday]);

  // Spawn particles one by one with proper stagger
  useEffect(() => {
    if (!mounted) return;
    const cleanupTimers: Array<() => void> = [];

    const spawnOne = () => {
      const particle: Particle = {
        id: Math.random(),
        left: 4 + Math.random() * 92,
        emoji: PARTICLE_POOL[Math.floor(Math.random() * PARTICLE_POOL.length)]!,
        dur: 1.4 + Math.random() * 0.8,
        size: 11 + Math.random() * 5,
      };
      setParticles((p) => [...p, particle]);
      const removeTimeout = setTimeout(() => {
        setParticles((p) => p.filter((x) => x.id !== particle.id));
      }, 2400);
      cleanupTimers.push(() => clearTimeout(removeTimeout));
    };

    const firstSpawn = setTimeout(() => {
      spawnOne();
      const spawnInterval = setInterval(
        () => spawnOne(),
        380 + Math.random() * 120,
      );
      cleanupTimers.push(() => clearInterval(spawnInterval));
    }, 300);
    cleanupTimers.push(() => clearTimeout(firstSpawn));

    return () => cleanupTimers.forEach((c) => c());
  }, [mounted]);

  // Burst on click: 12 sparkle particles + expanding rings
  const handleBurst = () => {
    playChime();
    const burst: Particle[] = Array.from({ length: 12 }, () => ({
      id: Math.random(),
      left: 4 + Math.random() * 92,
      emoji: PARTICLE_POOL[Math.floor(Math.random() * PARTICLE_POOL.length)]!,
      dur: 1.4 + Math.random() * 0.7,
      size: 12 + Math.random() * 8,
    }));
    setParticles((p) => [...p, ...burst]);
    setTimeout(() => {
      setParticles((p) => p.filter((x) => !burst.some((b) => b.id === x.id)));
    }, 2400);

    const ringIds = [Math.random(), Math.random(), Math.random()];
    setRings((r) => [...r, ...ringIds]);
    ringIds.forEach((id, i) => {
      setTimeout(
        () => {
          setRings((r) => r.filter((x) => x !== id));
        },
        800 + i * 150,
      );
    });
  };

  if (!mounted) return null;

  // ── Shared keyframes for both states ─────────────────────────────────────
  const sharedStyles = `
    @keyframes bcd-float {
      0%   { opacity: 1;   transform: translateY(0)     scale(0.85); }
      60%  { opacity: 0.7; }
      100% { opacity: 0;   transform: translateY(-60px) scale(1.4); }
    }
    @keyframes bday-letter-reveal {
      0%   { opacity: 0; transform: translateY(10px) scale(0.8); }
      100% { opacity: 1; transform: translateY(0)    scale(1);   }
    }
    @keyframes bcd-ring {
      0%   { transform: scale(0.4); opacity: 0.8; }
      100% { transform: scale(2.8); opacity: 0;   }
    }
    @keyframes bcd-digit-float {
      0%, 100% { transform: translateY(0);    }
      50%       { transform: translateY(-3px); }
    }
    @keyframes bday-halo {
      0%, 100% { opacity: 0.4; transform: scale(1);    }
      50%       { opacity: 0.8; transform: scale(1.08); }
    }
    .bcd-particle {
      position: absolute;
      bottom: 30%;
      line-height: 1;
      pointer-events: none;
      user-select: none;
      z-index: 30;
    }
    .bcd-ring {
      position: absolute;
      inset: 0;
      border-radius: 9999px;
      border: 2px solid rgba(251,207,232,0.7);
      pointer-events: none;
      animation: bcd-ring 0.75s ease-out forwards;
    }
  `;

  // ── Birthday Day State ────────────────────────────────────────────────────
  if (!tl || isToday) {
    return (
      <>
        <style>{sharedStyles}</style>
        <div className="relative">
          {/* Halo glow ring behind the button */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(135deg, #fbcfe8, #e9d5ff, #fde68a)",
              filter: "blur(20px)",
              animation: "bday-halo 2.5s ease-in-out infinite",
              zIndex: -1,
            }}
          />
          <button
            type="button"
            onClick={() => {
              handleBurst();
              fireBirthdayConfetti();
            }}
            className={cn(
              "group relative inline-flex cursor-pointer items-center gap-3 rounded-full px-6 py-3 select-none",
              "border-2 border-pink-300/60 bg-white/85 backdrop-blur-xl",
              "transition-all duration-300 hover:scale-105 active:scale-95",
            )}
            style={{
              boxShadow:
                "0 8px 40px -8px rgba(251,207,232,0.8), 0 0 0 3px rgba(251,207,232,0.3)",
              animation: "bday-glow-pulse 3s ease-in-out infinite",
            }}
          >
            {particles.map((p) => (
              <span
                key={p.id}
                className="bcd-particle"
                style={{
                  left: `${p.left}%`,
                  fontSize: `${p.size}px`,
                  animation: `bcd-float ${p.dur}s ease-out forwards`,
                }}
              >
                {p.emoji}
              </span>
            ))}
            <span className="text-xl">🎂</span>
            <LetterReveal
              text="Happy Birthday!"
              className="text-sm font-bold text-rose-600 sm:text-base"
            />
            <span className="animate-bounce text-xl">✨</span>
          </button>
        </div>
      </>
    );
  }

  // ── Countdown State ───────────────────────────────────────────────────────
  return (
    <>
      <style>{sharedStyles}</style>
      <button
        type="button"
        onClick={handleBurst}
        className={cn(
          "group relative inline-flex cursor-pointer items-center gap-3 rounded-full select-none",
          "border border-white/50 px-5 py-2.5 backdrop-blur-xl",
          "transition-all duration-500 hover:scale-105 active:scale-95",
          "hover:bg-white/80 hover:shadow-[0_12px_40px_-6px_rgba(244,114,182,0.5)]",
        )}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(251,207,232,0.22) 50%, rgba(233,213,255,0.18) 80%, rgba(255,255,255,0.78) 100%)",
          boxShadow: "0 8px 32px -4px rgba(244,114,182,0.3)",
          animation: "bday-glow-pulse 3s ease-in-out infinite",
        }}
      >
        {/* Floating particles */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="bcd-particle"
            style={{
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animation: `bcd-float ${p.dur}s ease-out forwards`,
            }}
          >
            {p.emoji}
          </span>
        ))}

        {/* Expanding rings on burst */}
        {rings.map((id) => (
          <span key={id} className="bcd-ring" />
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

        {/* Live countdown with staggered float animation per digit group */}
        <span className="flex items-baseline gap-1 tabular-nums">
          <span
            className="text-sm font-bold text-rose-600"
            style={{
              animation: "bcd-digit-float 4s ease-in-out infinite",
              animationDelay: "0s",
            }}
          >
            {tl.days}
          </span>
          <span className="text-[10px] font-medium text-rose-400">d</span>
          <span className="text-[10px] text-rose-300/70">·</span>
          <span
            className="text-sm font-bold text-rose-600"
            style={{
              animation: "bcd-digit-float 4s ease-in-out infinite",
              animationDelay: "0.5s",
            }}
          >
            {String(tl.hours).padStart(2, "0")}
          </span>
          <span className="text-[10px] font-medium text-rose-400">h</span>
          <span className="text-[10px] text-rose-300/70">·</span>
          <span
            className="text-sm font-bold text-rose-600"
            style={{
              animation: "bcd-digit-float 4s ease-in-out infinite",
              animationDelay: "1s",
            }}
          >
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
