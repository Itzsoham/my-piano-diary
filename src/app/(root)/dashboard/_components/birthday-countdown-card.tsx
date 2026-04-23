"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useBirthday } from "@/components/birthday/birthday-provider";

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
  "🎀",
  "🪷",
  "💝",
  "🎁",
  "🎊",
  "🦋",
  "🪄",
  "🌹",
];

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
    // AudioContext unavailable
  }
}

function getTimeLeft() {
  const TARGET_DATE = new Date("2026-04-24T00:00:00");
  const diff = TARGET_DATE.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
  };
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
  const [clickCount, setClickCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isMessageFadingOut, setIsMessageFadingOut] = useState(false);
  const [sparkleKey, setSparkleKey] = useState(0);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const { isBirthdayDay, isBirthdayMode, activateBirthdayMode } = useBirthday();

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    setTl(getTimeLeft());
    const id = setInterval(() => setTl(getTimeLeft()), 60_000);
    return () => clearInterval(id);
  }, []);

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
      const t = setTimeout(() => {
        setParticles((p) => p.filter((x) => x.id !== particle.id));
      }, 2400);
      cleanupTimers.push(() => clearTimeout(t));
    };
    const first = setTimeout(() => {
      spawnOne();
      const iv = setInterval(() => spawnOne(), 380 + Math.random() * 120);
      cleanupTimers.push(() => clearInterval(iv));
    }, 300);
    cleanupTimers.push(() => clearTimeout(first));
    return () => cleanupTimers.forEach((c) => c());
  }, [mounted]);

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
        () => setRings((r) => r.filter((x) => x !== id)),
        800 + i * 150,
      );
    });
  };

  const CLICK_MESSAGES: Record<number, string> = {
    5: "hmm… curious already? 🤭✨",
    10: "hey hey… easy there, baby 🎹💛",
    20: "you’re not giving up, are you… 😌",
    30: "something tells me you *really* want to know… ✨",
    50: "okay… now I’m getting a little nervous 😳💛",
    70: "you’re getting closer… don’t stop now 🎵✨",
    100: "alright… I think you’ve earned this 💛",
  };

  const getClickMessage = (count: number) => CLICK_MESSAGES[count] ?? null;

  const clearMessageTimeout = () => {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

  const handleBirthdayClick = () => {
    handleBurst();

    const next = clickCount + 1;
    setClickCount(next);
    setSparkleKey((prev) => prev + 1);

    if (next === 101) {
      setMessage("one more… just one more 🎂✨");
      clearMessageTimeout();
      messageTimerRef.current = setTimeout(
        () => router.push("/birthday-room"),
        650,
      );
      return;
    }

    const nextMessage = getClickMessage(next);
    if (nextMessage) {
      setMessage(nextMessage);
      setIsMessageFadingOut(false);
      clearMessageTimeout();
      fadeTimerRef.current = setTimeout(
        () => setIsMessageFadingOut(true),
        29200,
      );
      messageTimerRef.current = setTimeout(() => {
        setMessage(null);
        setIsMessageFadingOut(false);
      }, 30000);
    }

    if (!isBirthdayMode && next === 2) {
      activateBirthdayMode();
    }
  };

  if (!mounted) return null;

  const sharedStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap');
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
    @keyframes bday-hint-in {
      0%   { opacity: 0; transform: translateY(6px); }
      100% { opacity: 1; transform: translateY(0);   }
    }
    @keyframes bday-hint-out {
      0%   { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(1.12); }
    }
    @keyframes bcd-sparkle {
      0%   { transform: translate(-50%, 0) scale(0.7); opacity: 0; }
      35%  { transform: translate(-50%, -6px) scale(1); opacity: 1; }
      65%  { transform: translate(-50%, -14px) scale(1.1); opacity: 0.8; }
      100% { transform: translate(-50%, -24px) scale(1.3); opacity: 0; }
    }
    .bcd-particle {
      position: absolute; bottom: 30%; line-height: 1;
      pointer-events: none; user-select: none; z-index: 30;
    }
    .bcd-ring {
      position: absolute; inset: 0; border-radius: 9999px;
      border: 2px solid rgba(251,207,232,0.7);
      pointer-events: none;
      animation: bcd-ring 0.75s ease-out forwards;
    }
  `;

  if (isBirthdayDay) {
    return (
      <>
        <style>{sharedStyles}</style>
        <div className="relative flex flex-col items-center gap-1.5">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #fbcfe8, #e9d5ff, #fde68a)",
                filter: "blur(20px)",
                animation: "bday-halo 2.5s ease-in-out infinite",
                zIndex: -1,
              }}
            />
            <button
              type="button"
              onClick={handleBirthdayClick}
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
              {rings.map((id) => (
                <span key={id} className="bcd-ring" />
              ))}
              <span className="text-xl">🎂</span>
              {isBirthdayMode ? (
                <LetterReveal
                  text="Happy Birthday!"
                  className="text-sm font-bold text-rose-600 uppercase sm:text-base"
                />
              ) : (
                <span className="text-sm font-bold text-rose-600 uppercase sm:text-base">
                  Happy Birthday Baby!
                </span>
              )}
              <span
                className={cn(
                  "text-xl transition-all",
                  clickCount === 1 ? "animate-spin" : "animate-bounce",
                )}
              >
                ✨
              </span>
            </button>
          </div>
          {message ? (
            <div
              key={sparkleKey}
              className="mt-3 text-center text-base leading-relaxed text-rose-600"
              style={{
                animation: isMessageFadingOut
                  ? "bday-hint-out 0.8s ease-in forwards"
                  : "bday-hint-in 0.35s ease-out both",
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 400,
              }}
            >
              {message}
            </div>
          ) : null}
        </div>
      </>
    );
  }

  if (!tl) return null;

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
        {rings.map((id) => (
          <span key={id} className="bcd-ring" />
        ))}
        <span className="text-[15px] leading-none">🎵</span>
        <span className="text-[11px] font-medium text-rose-500/80 sm:text-xs">
          Something special is coming
          <span className="ml-0.5 text-rose-400/50">…</span>
        </span>
        <span className="h-3.5 w-px shrink-0 bg-pink-200/80" />
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
        <span className="animate-pulse text-[14px] leading-none">✨</span>
      </button>
    </>
  );
}
