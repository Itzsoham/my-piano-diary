"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";

type BurstParticle = {
  id: number;
  x: number;
  y: number;
  icon: string;
  size: number;
  duration: number;
};

type FloatingParticle = {
  id: number;
  x: number;
  size: number;
  icon: string;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
};

type PhotoBubble = {
  id: number;
  left: string;
  top: string;
  size: number;
  delay: number;
};

const FLOATING_ICONS = ["🎈", "🎂", "🥳", "🎁", "🎉", "✨", "🕯️"];
const BURST_ICONS = ["🎉", "🎂", "🎈", "🥳", "🎁", "✨"];
const LIGHT_BEAMS = [8, 18, 29, 41, 54, 67, 79, 90];
const PHOTO_BUBBLES: PhotoBubble[] = [
  { id: 1, left: "8%", top: "20%", size: 18, delay: 0 },
  { id: 2, left: "18%", top: "7%", size: 26, delay: 0.2 },
  { id: 3, left: "36%", top: "2%", size: 16, delay: 0.35 },
  { id: 4, left: "67%", top: "3%", size: 24, delay: 0.5 },
  { id: 5, left: "84%", top: "14%", size: 17, delay: 0.65 },
  { id: 6, left: "91%", top: "45%", size: 20, delay: 0.8 },
  { id: 7, left: "78%", top: "78%", size: 25, delay: 1 },
  { id: 8, left: "55%", top: "91%", size: 18, delay: 1.2 },
  { id: 9, left: "23%", top: "88%", size: 23, delay: 1.35 },
  { id: 10, left: "4%", top: "66%", size: 16, delay: 1.55 },
];

function random(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeFloatingParticle(id: number): FloatingParticle {
  return {
    id,
    x: random(6, 94),
    size: random(16, 30),
    icon: FLOATING_ICONS[Math.floor(random(0, FLOATING_ICONS.length))] ?? "✨",
    duration: random(6.5, 10.5),
    delay: random(0, 0.6),
    drift: random(-45, 45),
    opacity: random(0.48, 0.9),
  };
}

function chimeAt(
  audioContext: AudioContext,
  frequency: number,
  startAt: number,
) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(frequency, startAt);
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.998, startAt + 1.2);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.16, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 1.28);

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start(startAt);
  osc.stop(startAt + 1.35);
}

function playSoftPianoChime() {
  const Ctx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return;

  const audioContext = new Ctx();
  const now = audioContext.currentTime;

  chimeAt(audioContext, 523.25, now);
  chimeAt(audioContext, 659.25, now + 0.08);
  chimeAt(audioContext, 783.99, now + 0.16);

  const closeCtx = () => {
    void audioContext.close();
  };

  setTimeout(closeCtx, 1800);
}

function playBubblePopSound() {
  const Ctx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return;

  const audioContext = new Ctx();
  const now = audioContext.currentTime;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(920, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + 0.12);

  setTimeout(() => {
    void audioContext.close();
  }, 220);
}

export function BirthdayRevealPage() {
  const clickSparkleId = useRef(0);
  const floatingId = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [didPlayIntroSound, setDidPlayIntroSound] = useState(false);
  const [burstParticles, setBurstParticles] = useState<BurstParticle[]>([]);
  const [floatingParticles, setFloatingParticles] = useState<
    FloatingParticle[]
  >([]);
  const [poppedBubbleIds, setPoppedBubbleIds] = useState<number[]>([]);
  const [floatingSettings, setFloatingSettings] = useState({
    maxParticles: 18,
    spawnEveryMs: 1100,
  });

  useEffect(() => {
    const updateByScreen = () => {
      const isMobile = window.innerWidth < 768;
      setFloatingSettings(
        isMobile
          ? { maxParticles: 14, spawnEveryMs: 1250 }
          : { maxParticles: 24, spawnEveryMs: 900 },
      );
    };

    updateByScreen();
    window.addEventListener("resize", updateByScreen);
    return () => window.removeEventListener("resize", updateByScreen);
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setFloatingParticles((prev) => {
        const next = [...prev, makeFloatingParticle(++floatingId.current)];
        const overflow = next.length - floatingSettings.maxParticles;
        return overflow > 0 ? next.slice(overflow) : next;
      });
    }, floatingSettings.spawnEveryMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [floatingSettings.maxParticles, floatingSettings.spawnEveryMs]);

  const spawnClickSparkles = useCallback((x: number, y: number) => {
    const vw = Math.max(window.innerWidth, 1);
    const vh = Math.max(window.innerHeight, 1);
    const xPct = (x / vw) * 100;
    const yPct = (y / vh) * 100;

    const particles = Array.from({ length: 7 }, (_, index) => ({
      id: ++clickSparkleId.current,
      x: xPct + random(-3.3, 3.3),
      y: yPct + random(-2.8, 2.8),
      icon: BURST_ICONS[index % BURST_ICONS.length] ?? "✨",
      size: random(14, 24),
      duration: random(0.9, 1.45),
    }));

    setBurstParticles((prev) => [...prev, ...particles]);

    setTimeout(() => {
      setBurstParticles((prev) =>
        prev.filter((item) => !particles.some((p) => p.id === item.id)),
      );
    }, 1600);
  }, []);

  const handleInteraction = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const x = event.clientX;
      const y = event.clientY;

      spawnClickSparkles(x, y);

      void confetti({
        particleCount: 10,
        spread: 35,
        startVelocity: 14,
        gravity: 1.15,
        ticks: 90,
        scalar: 0.6,
        origin: {
          x: x / Math.max(window.innerWidth, 1),
          y: y / Math.max(window.innerHeight, 1),
        },
        colors: ["#fbcfe8", "#e9d5ff", "#fde68a"],
      });

      if (!didPlayIntroSound) {
        playSoftPianoChime();
        setDidPlayIntroSound(true);
      }
    },
    [didPlayIntroSound, spawnClickSparkles],
  );

  const handleBubblePop = useCallback(
    (event: PointerEvent<HTMLButtonElement>, bubbleId: number) => {
      event.stopPropagation();

      if (poppedBubbleIds.includes(bubbleId)) return;

      setPoppedBubbleIds((prev) => [...prev, bubbleId]);
      playBubblePopSound();
      spawnClickSparkles(event.clientX, event.clientY);

      setTimeout(() => {
        setPoppedBubbleIds((prev) => prev.filter((id) => id !== bubbleId));
      }, 1800);
    },
    [poppedBubbleIds, spawnClickSparkles],
  );

  return (
    <motion.div
      className="relative h-svh overflow-hidden"
      onPointerDown={handleInteraction}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          backgroundImage:
            "radial-gradient(1200px 700px at 50% -8%, rgba(255,244,198,0.75), transparent 54%), radial-gradient(800px 420px at 14% 18%, rgba(244,114,182,0.22), transparent 72%), radial-gradient(840px 480px at 86% 14%, rgba(251,191,36,0.2), transparent 68%), linear-gradient(180deg, #7f4a45 0%, #c47e67 26%, #f5d6b7 62%, #a26f55 62.5%, #8e5f47 100%)",
          backgroundSize: "100% 100%",
          animation: "birthdayGradientFloat 16s ease-in-out infinite alternate",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        animate={{ opacity: [0.45, 0.75, 0.5] }}
        transition={{
          duration: 8.5,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
        }}
      >
        <div className="absolute inset-x-[6%] top-[7%] h-[58%] rounded-[3rem] border border-white/18 bg-white/7 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
        <div className="absolute inset-x-[10%] top-[11%] h-[44%] rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,247,210,0.26),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))]" />
        <div className="absolute bottom-0 left-[-8%] h-[34%] w-[116%] bg-[linear-gradient(180deg,rgba(76,43,29,0)_0%,rgba(76,43,29,0.18)_10%,rgba(88,51,35,0.84)_11%,rgba(126,84,58,0.98)_100%)] [clip-path:polygon(0_0,100%_0,92%_100%,8%_100%)]" />
        <div className="absolute top-[12%] left-[12%] h-52 w-52 rounded-full bg-amber-100/18 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute right-[10%] bottom-[24%] h-60 w-60 rounded-full bg-rose-200/16 blur-3xl sm:h-80 sm:w-80" />
      </motion.div>

      <div
        className="pointer-events-none fixed top-0 right-0 left-0 z-0 h-[52vh] overflow-hidden"
        aria-hidden="true"
      >
        {LIGHT_BEAMS.map((left, index) => (
          <motion.div
            key={left}
            className="absolute -top-10 h-[68vh] origin-top"
            style={{
              left: `${left}%`,
              transform: "translateX(-50%)",
              width: index % 2 === 0 ? "20vw" : "16vw",
              background:
                index % 2 === 0
                  ? "linear-gradient(to bottom, rgba(255,240,167,0.72), rgba(255,240,167,0.14) 45%, rgba(255,240,167,0.0) 100%)"
                  : "linear-gradient(to bottom, rgba(255,219,121,0.62), rgba(255,219,121,0.12) 48%, rgba(255,219,121,0.0) 100%)",
              filter: "blur(6px)",
              clipPath: "polygon(47% 0%, 53% 0%, 100% 100%, 0% 100%)",
            }}
            animate={{
              rotate: [index % 2 === 0 ? -15 : 12, index % 2 === 0 ? 14 : -11],
              opacity: [0.14, 0.74, 0.18, 0.85, 0.2],
              scaleY: [0.82, 1.12, 0.9, 1.18, 0.88],
            }}
            transition={{
              duration: 2.2 + index * 0.22,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              repeatType: "mirror",
            }}
          />
        ))}
        <motion.div
          className="absolute top-0 left-1/2 h-20 w-[84%] -translate-x-1/2 rounded-b-[2.8rem] border-x border-b border-white/20 bg-[linear-gradient(180deg,rgba(104,60,47,0.98),rgba(147,98,74,0.95))] shadow-[0_18px_40px_rgba(65,32,20,0.35)]"
          animate={{ opacity: [0.92, 1, 0.95] }}
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
        >
          {LIGHT_BEAMS.map((left, index) => (
            <motion.span
              key={`lamp-${left}`}
              className="absolute top-5 h-3.5 w-10 -translate-x-1/2 rounded-full bg-amber-100 shadow-[0_0_24px_rgba(255,236,179,0.92)]"
              style={{ left: `${left}%` }}
              animate={{ opacity: [0.55, 1, 0.66], scale: [0.92, 1.08, 0.95] }}
              transition={{
                duration: 1 + index * 0.14,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "mirror",
              }}
            />
          ))}
        </motion.div>
      </div>

      <div
        className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
        aria-hidden="true"
      >
        <AnimatePresence>
          {floatingParticles.map((particle) => (
            <motion.span
              key={particle.id}
              className="absolute select-none"
              initial={{ opacity: 0, y: 28, x: 0, scale: 0.85 }}
              animate={{
                opacity: [0, particle.opacity, particle.opacity * 0.4, 0],
                y: -window.innerHeight - 100,
                x: particle.drift,
                scale: [0.8, 1.05, 1],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: "easeOut",
              }}
              onAnimationComplete={() => {
                setFloatingParticles((prev) =>
                  prev.filter((p) => p.id !== particle.id),
                );
              }}
              style={{
                left: `${particle.x}%`,
                bottom: "-10%",
                fontSize: `${particle.size}px`,
                filter: "drop-shadow(0 0 10px rgba(255,255,255,0.55))",
              }}
            >
              {particle.icon}
            </motion.span>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {burstParticles.map((particle) => (
            <motion.span
              key={particle.id}
              className="absolute"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                fontSize: `${particle.size}px`,
              }}
              initial={{ opacity: 0, scale: 0.5, y: 6 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.15, 0.8],
                y: -26,
                x: random(-18, 18),
                rotate: random(-20, 22),
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: particle.duration, ease: "easeOut" }}
            >
              {particle.icon}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes birthdayGradientFloat {
          0% { transform: scale(1) translateY(0px); }
          100% { transform: scale(1.02) translateY(-0.8%); }
        }
      `}</style>

      <main className="relative z-20 h-full">
        <motion.section className="mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-3 py-4 sm:px-6 sm:py-6">
          <motion.div
            className="mx-auto w-full max-w-5xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <p
              className="mx-auto mb-2 w-fit rounded-full border border-amber-100/60 bg-white/25 px-4 py-1.5 text-[10px] tracking-[0.24em] text-amber-50/95 uppercase backdrop-blur-md sm:text-xs"
              style={{ fontFamily: '"Times New Roman", "Georgia", serif' }}
            >
              My Piano Diary • Birthday Reveal
            </p>

            <motion.h1
              className="text-center text-3xl leading-[0.95] font-semibold text-balance text-amber-50 drop-shadow-[0_6px_16px_rgba(70,31,20,0.35)] sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
            >
              Happy Birthday, Thùy <span className="text-amber-500">🎂💛</span>
            </motion.h1>

            <motion.p
              className="mx-auto mt-3 max-w-2xl text-center text-sm text-pretty text-amber-50/90 italic sm:text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
            >
              You make every note beautiful… today is your melody.
            </motion.p>
          </motion.div>

          <motion.div
            className="mx-auto mt-3 grid w-full max-w-5xl grid-cols-1 items-center gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-[1fr_auto_1fr]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.52 }}
          >
            <motion.div
              className="relative overflow-hidden rounded-[2.5rem] border border-amber-100/55 bg-[linear-gradient(180deg,rgba(255,245,219,0.9),rgba(255,225,169,0.78))] px-5 py-4 shadow-[0_20px_48px_rgba(79,37,15,0.18)] backdrop-blur-xl sm:px-6 sm:py-5"
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 3.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <div className="absolute inset-x-4 top-0 h-3 rounded-b-full bg-rose-400/80" />
              <div className="absolute top-0 bottom-0 left-1/2 w-3 -translate-x-1/2 bg-rose-400/65" />
              <span className="absolute -top-2 right-4 text-xl">🎀</span>
              <span className="absolute bottom-2 left-4 text-base">🎈</span>
              <p
                className="relative text-[10px] tracking-[0.2em] text-rose-700/85 uppercase sm:text-xs"
                style={{ fontFamily: '"Times New Roman", "Georgia", serif' }}
              >
                Memory
              </p>
              <p
                className="relative mt-3 text-sm leading-relaxed text-stone-800 italic sm:text-base"
                style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
              >
                Every lesson you teach, every note you play, you bring joy into
                the world 🎂✨
              </p>
              <p
                className="relative mt-2 text-xs text-rose-800/80 italic sm:text-sm"
                style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
              >
                This little world was built for you…
              </p>
            </motion.div>

            <div className="order-first mx-auto lg:order-0">
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.85, delay: 0.6 }}
              >
                <div className="pointer-events-none absolute -inset-9 sm:-inset-11">
                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-x-[20%] -top-8 h-[125%] rounded-[50%] bg-[radial-gradient(circle_at_top,rgba(255,248,196,0.95),rgba(255,248,196,0.2)_38%,rgba(255,248,196,0)_72%)] blur-xl"
                    animate={{
                      opacity: [0.45, 0.92, 0.56],
                      scaleX: [0.9, 1.08, 0.96],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />
                  <motion.div
                    aria-hidden="true"
                    className="absolute -top-10 left-1/2 h-[135%] w-[85%] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,245,179,0.7),rgba(255,245,179,0.15)_40%,rgba(255,245,179,0)_100%)] blur-[3px] [clip-path:polygon(49%_0,51%_0,100%_100%,0_100%)]"
                    animate={{
                      opacity: [0.28, 0.72, 0.36],
                      scaleY: [0.92, 1.08, 0.96],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "mirror",
                    }}
                  />
                  <AnimatePresence>
                    {PHOTO_BUBBLES.filter(
                      (bubble) => !poppedBubbleIds.includes(bubble.id),
                    ).map((bubble) => (
                      <motion.button
                        key={bubble.id}
                        type="button"
                        aria-label="Pop bubble"
                        className="pointer-events-auto absolute rounded-full border border-white/70 bg-linear-to-br from-white/70 via-amber-100/45 to-rose-200/40 shadow-[0_8px_16px_rgba(255,255,255,0.35)]"
                        style={{
                          left: bubble.left,
                          top: bubble.top,
                          width: bubble.size,
                          height: bubble.size,
                        }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{
                          opacity: [0.55, 0.9, 0.65],
                          scale: [1, 1.1, 1],
                          y: [0, -4, 0],
                        }}
                        exit={{ opacity: 0, scale: 1.65 }}
                        transition={{
                          duration: 2.4,
                          delay: bubble.delay,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                        onPointerDown={(event) =>
                          handleBubblePop(event, bubble.id)
                        }
                      >
                        <span className="absolute top-[24%] left-[28%] h-1.5 w-1.5 rounded-full bg-white/75" />
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>

                <motion.div
                  className="absolute inset-0 rounded-[2rem] bg-linear-to-br from-amber-100/65 via-rose-200/45 to-orange-200/40 blur-2xl"
                  animate={{
                    scale: [0.96, 1.08, 0.96],
                    opacity: [0.55, 0.85, 0.55],
                  }}
                  transition={{
                    duration: 4.8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
                <motion.img
                  src="https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=900&q=80"
                  alt="A soft piano-themed portrait placeholder"
                  className="relative h-44 w-56 rounded-[2rem] border-[6px] border-[#f8dfb1] object-cover shadow-[0_18px_55px_rgba(88,44,17,0.28)] sm:h-52 sm:w-72 lg:h-64 lg:w-80"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{
                    duration: 5.4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </div>

            <motion.div
              className="relative overflow-hidden rounded-[2.5rem] border border-rose-100/60 bg-[linear-gradient(180deg,rgba(255,238,211,0.92),rgba(255,214,171,0.82))] px-5 py-4 shadow-[0_20px_50px_rgba(107,52,24,0.16)] backdrop-blur-xl sm:px-6 sm:py-5"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 4.1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.3,
              }}
            >
              <div className="absolute inset-x-4 top-0 h-3 rounded-b-full bg-amber-500/80" />
              <div className="absolute top-0 bottom-0 left-1/2 w-3 -translate-x-1/2 bg-amber-500/65" />
              <span className="absolute -top-2 left-4 text-xl">🎀</span>
              <span className="absolute right-5 bottom-2 text-base">🥳</span>
              <motion.div
                aria-hidden="true"
                className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-200/30 blur-2xl"
                animate={{
                  scale: [0.9, 1.2, 0.95],
                  opacity: [0.3, 0.65, 0.3],
                }}
                transition={{
                  duration: 4.2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
              <p
                className="relative text-[10px] tracking-[0.2em] text-amber-800/85 uppercase sm:text-xs"
                style={{ fontFamily: '"Times New Roman", "Georgia", serif' }}
              >
                Surprise
              </p>
              <p
                className="relative mt-3 text-sm leading-relaxed text-stone-800 italic sm:text-base"
                style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
              >
                You thought this was just a simple app… but today, it&apos;s
                your special stage 🎉
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            className="mx-auto mt-3 w-full max-w-4xl text-center sm:mt-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
          >
            <h2
              className="text-xl leading-tight font-semibold text-balance text-amber-50 drop-shadow-[0_4px_14px_rgba(68,30,18,0.35)] sm:text-3xl lg:text-4xl"
              style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
            >
              You are loved, appreciated,
              <br />
              and truly special.
            </h2>
            <p
              className="mt-3 text-base text-amber-50/92 italic sm:text-xl"
              style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
            >
              Happy Birthday again 🎂🎈
            </p>
            <p
              className="mt-2 text-[10px] tracking-[0.18em] text-amber-100/80 uppercase italic sm:text-xs"
              style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
            >
              Tap anywhere to hear the first birthday note and wake the room ✨
            </p>
          </motion.div>
        </motion.section>
      </main>
    </motion.div>
  );
}
