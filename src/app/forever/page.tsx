"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const START_DATE = new Date("2025-09-15T00:00:00");
const ONE_YEAR_DATE = new Date("2026-09-15T00:00:00");

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getTimeDiff() {
  const now = new Date();
  const diff = Math.max(0, now.getTime() - START_DATE.getTime());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor(diff / (1000 * 60)),
    seconds: Math.floor(diff / 1000),
  };
}

function getProgress() {
  const now = new Date();
  const elapsed = now.getTime() - START_DATE.getTime();
  const total = ONE_YEAR_DATE.getTime() - START_DATE.getTime();
  return Math.min(Math.round((elapsed / total) * 100), 100);
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface HeartParticle {
  id: number;
  left: string;
  duration: string;
  delay: string;
  size: string;
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function ForeverPage() {
  const [time, setTime] = useState(getTimeDiff());
  const [showModal, setShowModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<
    (typeof memories)[number] | null
  >(null);
  const [cuteStep, setCuteStep] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cuteAudioRef = useRef<HTMLAudioElement | null>(null);

  // ── Console Easter Egg ─────────────────────────────────────────────────────
  useEffect(() => {
    console.log(
      "%c You found the secret page ❤️",
      "color: #ff69b4; font-size: 16px; font-weight: bold;",
    );
    console.log(
      "%c I love you",
      "color: #ff1493; font-size: 20px; font-weight: bold;",
    );
    console.log(
      "%c Happy 6 months anniversary 🎹",
      "color: #ffb6c1; font-size: 14px;",
    );
    console.log(
      "%c You found the secret message ❤️",
      "color: #ff69b4; font-size: 13px; font-style: italic;",
    );
    console.log(
      "%c I love you more than anything in this world.",
      "color: #c084fc; font-size: 13px; font-style: italic;",
    );
  }, []);

  // ── Generate floating hearts client-side only (avoids hydration mismatch) ──
  useEffect(() => {
    setHearts(
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: `${(i * 6.25) % 100}%`,
        duration: `${5 + (i % 5)}s`,
        delay: `${(i * 0.6) % 8}s`,
        size: `${0.9 + (i % 3) * 0.35}rem`,
      })),
    );
  }, []);

  // ── Relationship Timer ─────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeDiff()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Confetti + Modal ───────────────────────────────────────────────────────
  const handleSurprise = () => {
    setShowModal(true);
    const colors = ["#ff69b4", "#ff1493", "#ffb6c1", "#ffe4e1", "#c084fc"];
    void confetti({
      particleCount: 200,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });
    setTimeout(() => {
      void confetti({
        particleCount: 120,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      void confetti({
        particleCount: 120,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
    }, 600);
  };

  // ── Cute Session Methods ───────────────────────────────────────────────────
  const startCuteSession = () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (!cuteAudioRef.current) {
      cuteAudioRef.current = new Audio();
      cuteAudioRef.current.loop = true;
    }
    cuteAudioRef.current.src = "/forever/Iloveyouvermuch_Perfy.mpeg";
    void cuteAudioRef.current.play().catch((_err) => {
      /* ignore */
    });
    setCuteStep(1);
  };

  const nextCuteStep = () => {
    if (cuteStep === 1) {
      if (cuteAudioRef.current) {
        cuteAudioRef.current.pause();
        cuteAudioRef.current.src = "/forever/Iloveyoubaby_Perfy.mpeg";
        cuteAudioRef.current.load();
        void cuteAudioRef.current.play().catch((_err) => {
          /* ignore */
        });
      }
      setCuteStep(2);
    } else if (cuteStep === 2) setCuteStep(3);
  };

  const endCuteSession = () => {
    if (cuteAudioRef.current) {
      cuteAudioRef.current.pause();
      cuteAudioRef.current.currentTime = 0;
    }
    setCuteStep(0);
    if (audioRef.current) {
      void audioRef.current.play().catch((_err) => {
        /* ignore */
      });
      setIsPlaying(true);
    }
  };

  // ── Auto-play on mount ────────────────────────────────────────────────────
  useEffect(() => {
    // Initialise once — keep the element alive for the whole page lifetime
    if (!audioRef.current) {
      const audio = new Audio("/music/our-song.mp3");
      audio.loop = true;
      audioRef.current = audio;
    }
    const audio = audioRef.current;

    let resumeListener: (() => void) | null = null;

    const tryPlay = () => {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setMusicStarted(true);
          setAutoplayBlocked(false);
          if (resumeListener) {
            document.removeEventListener("click", resumeListener);
            document.removeEventListener("touchstart", resumeListener);
            resumeListener = null;
          }
        })
        .catch(() => {
          setAutoplayBlocked(true);
          if (!resumeListener) {
            resumeListener = () => {
              void tryPlay();
            };
            document.addEventListener("click", resumeListener, { once: true });
            document.addEventListener("touchstart", resumeListener, {
              once: true,
            });
          }
        });
    };

    tryPlay();

    return () => {
      // Only remove pending listeners on unmount, never destroy the audio src
      if (resumeListener) {
        document.removeEventListener("click", resumeListener);
        document.removeEventListener("touchstart", resumeListener);
      }
    };
  }, []);

  // ── Music Toggle ───────────────────────────────────────────────────────────
  const toggleMusic = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/music/our-song.mp3");
      audioRef.current.loop = true;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setMusicStarted(true);
      setAutoplayBlocked(false);
    } catch (err) {
      console.warn("Unable to play music", err);
      setIsPlaying(false);
      setAutoplayBlocked(true);
    }
  };

  const progress = getProgress();

  // ── Memory cards ─────────────────────────────────────────────────────────
  const memories = [
    {
      title: "Our First Call 📞",
      desc: "The moment when I first saw my girl in call",
      image: "/forever/first_call.jpeg",
    },
    {
      title: "My Favorite Picture ❤️",
      desc: "Your cute face permanently stamped on my heart.",
      image: "/forever/fav_pic.jpeg",
    },
    {
      title: "That Chat Moment 💬",
      desc: "The night you randomly made my heart race",
      image: "/forever/fav_chat.jpeg",
    },
    {
      title: "Us ❤️",
      desc: "Just a screenshot… but my whole world is in it.",
      image: "/forever/couple.jpeg",
    },
  ] as const;

  return (
    <>
      {/* ── Autoplay nudge ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {autoplayBlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-pink-500/40 bg-pink-950/80 px-5 py-2.5 text-xs text-pink-200 shadow-lg shadow-pink-900/40 backdrop-blur-sm"
          >
            🎵 Tap anywhere to play the music♪
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Custom Keyframes ──────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap');
        .font-great-vibes { font-family: 'Great Vibes', cursive; }
        .font-cormorant   { font-family: 'Cormorant Garamond', serif; }
        @keyframes floatUp {
          0%   { transform: translateY(100vh) rotate(0deg);  opacity: 0;   }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(-12vh) rotate(25deg); opacity: 0;   }
        }
        @keyframes heartbeat {
          0% { transform: scale(1); }
          15% { transform: scale(1.2); }
          30% { transform: scale(1); }
          45% { transform: scale(1.15); }
          60% { transform: scale(1); }
          100% { transform: scale(1); }
        }
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 8px #ff69b4, 0 0 18px #ff69b4; }
          50%       { text-shadow: 0 0 18px #ff1493, 0 0 35px #ff1493, 0 0 55px #c084fc; }
        }
        @keyframes lineGrow {
          0%   { width: 0%; opacity: 0; }
          100% { width: 100%; opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        .float-heart {
          position: fixed;
          bottom: -20px;
          animation: floatUp linear infinite;
          pointer-events: none;
          z-index: 0;
          user-select: none;
        }
        .glow-text   { animation: glow      2s   ease-in-out infinite; }
        .beat-heart  { animation: heartbeat 1s ease-in-out infinite; }
        .float-hero  { animation: float     4s   ease-in-out infinite; }
        .hide-scrollbar { overflow-y: auto; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="relative min-h-screen overflow-x-hidden bg-linear-to-b from-[#0d0010] via-[#180520] to-[#0d0010] text-white">
        {/* ── Floating Hearts ──────────────────────────────────────────────── */}
        {hearts.map((h) => (
          <span
            key={h.id}
            className="float-heart"
            style={{
              left: h.left,
              fontSize: h.size,
              animationDuration: h.duration,
              animationDelay: h.delay,
            }}
          >
            ❤️
          </span>
        ))}

        {/* ── Piano key stripe overlay ─────────────────────────────────────── */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(255,0,128,0.03) 0px, transparent 80px)",
          }}
        />

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <div className="relative z-10 mx-auto max-w-md px-4 py-8 text-center sm:px-5 sm:py-12">
          {/* ─ HERO ─────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="float-hero mb-5 text-5xl sm:text-7xl">❤️</div>
            <h1 className="glow-text mb-3 text-3xl font-bold text-pink-300 sm:text-4xl">
              Happy 6 Months
            </h1>
            <p className="text-sm text-pink-200/60 sm:text-base">my love 🎹</p>
          </motion.div>

          {/* ─ INTRO LINE ────────────────────────────────────────────────────── */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="mb-6 text-sm text-pink-300/60 italic"
          >
            Every second with you
            <br />
            has been my favorite moments of my life.
          </motion.p>

          {/* ─ RELATIONSHIP TIMER ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="mb-8 rounded-2xl border border-pink-500/20 bg-white/5 p-4 backdrop-blur-sm sm:p-6"
          >
            <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-pink-400 uppercase">
              We&apos;ve been together for
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { value: time.days.toLocaleString(), label: "Days" },
                { value: time.hours.toLocaleString(), label: "Hours" },
                { value: time.minutes.toLocaleString(), label: "Minutes" },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-xl bg-pink-900/30 px-1 py-3 sm:px-2 sm:py-4"
                >
                  <div
                    className="text-lg font-bold break-all text-pink-400 tabular-nums sm:text-2xl"
                    style={{ textShadow: "0 0 8px rgba(255, 155, 220, 0.35)" }}
                  >
                    {value}
                  </div>
                  <div className="mt-1 text-[10px] text-pink-400/70 sm:text-[11px]">
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <span
                key={time.seconds}
                className="beat-heart text-2xl font-bold text-pink-400 tabular-nums sm:text-3xl"
                style={{ textShadow: "0 0 8px rgba(255, 155, 220, 0.35)" }}
              >
                {time.seconds.toLocaleString()}
              </span>
              <span className="ml-2 text-xs text-pink-400/60 sm:text-sm">
                seconds
              </span>
            </div>
          </motion.div>

          {/* ─ DISTANCE ──────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55 }}
            className="mb-8 rounded-2xl border border-pink-500/20 bg-white/5 p-4 backdrop-blur-sm sm:p-6"
          >
            <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-pink-400 uppercase">
              Distance doesn&apos;t matter
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-15 text-center">
                <div className="text-2xl sm:text-3xl">🇮🇳</div>
                <div className="mt-2 text-[11px] text-pink-200 sm:text-xs">
                  Ahmedabad
                </div>
              </div>

              {/* Animated line */}
              <div className="relative flex flex-1 items-center">
                <div
                  className="h-px w-full bg-linear-to-r from-pink-600 via-rose-400 to-pink-600"
                  style={{ animation: "lineGrow 1.5s ease-out 1s both" }}
                />
                <span
                  key={time.seconds}
                  className="beat-heart absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-base sm:text-lg"
                  style={{ top: "50%" }}
                >
                  ❤️
                </span>
              </div>

              <div className="min-w-15 text-center">
                <div className="text-2xl sm:text-3xl">🇻🇳</div>
                <div className="mt-2 text-[11px] text-pink-200 sm:text-xs">
                  Da Nang
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-pink-300/60">
              3,800+ km apart — but close in every way that&apos;s possible 💫
            </p>
          </motion.div>

          {/* ─ LOVE MESSAGE ──────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.8 }}
            className="mb-8 rounded-2xl border border-pink-500/20 bg-white/5 p-5 text-left backdrop-blur-sm sm:p-7"
          >
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-pink-500 uppercase">
                  6 months ago
                </p>
                <p className="mt-2 text-base leading-relaxed text-pink-100">
                  two strangers started flirting.
                </p>
              </div>

              <div className="h-px w-10 bg-pink-500/30" />

              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-pink-500 uppercase">
                  Today
                </p>
                <p className="mt-2 text-base leading-relaxed text-pink-100">
                  you are the most important person in my life.
                </p>
              </div>

              <div className="pt-2 text-center">
                <p className="glow-text text-xl font-bold text-pink-300">
                  Happy 6 months baby❤️
                </p>
              </div>
            </div>
          </motion.div>

          {/* ─ MEMORY GALLERY ────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.0 }}
            className="mb-8"
          >
            <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-pink-400 uppercase">
              Moments I’ll Never Forget ❤️
            </p>
            <div className="grid grid-cols-2 gap-4">
              {memories.map((mem) => (
                <motion.div
                  key={mem.title}
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => setSelectedMemory(mem)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-pink-500/20 bg-pink-950/20 shadow-lg shadow-black/40 transition-all hover:border-pink-500/40"
                >
                  <div className="relative aspect-square w-full">
                    <Image
                      src={mem.image}
                      alt={mem.title}
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-pink-950/90 via-transparent to-transparent opacity-60" />
                  </div>

                  <div className="p-3 text-left">
                    <p className="text-[13px] font-bold text-pink-100/90">
                      {mem.title}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-tight text-pink-300/60 italic">
                      {mem.desc}
                    </p>
                  </div>

                  {/* Subtle border glow */}
                  <div className="absolute inset-0 rounded-2xl border border-pink-500/0 transition-colors group-hover:border-pink-500/30" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ─ MUSIC PLAYER ──────────────────────────────────────────────────── */}
          {cuteStep === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.3 }}
              className="mb-4"
            >
              <button
                onClick={toggleMusic}
                className="w-full rounded-xl border border-pink-500/30 bg-pink-950/40 px-6 py-3 text-sm font-medium text-pink-300 transition-all hover:bg-pink-900/50 hover:text-pink-100 active:scale-95"
              >
                {isPlaying ? "⏸️  Pause the music" : "🎵  Play the music"}
              </button>
              <AnimatePresence>
                {musicStarted && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-3 text-xs text-pink-300/70 italic"
                  >
                    Every song I hear
                    <br />
                    reminds me of you. 🎵
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ─ CUTE SESSION ──────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.45 }}
            className={`relative mb-8 overflow-hidden rounded-2xl border bg-white/5 p-6 shadow-xl backdrop-blur-sm transition-all duration-700 sm:mb-10 ${cuteStep > 0 ? "scale-[1.02] border-indigo-400/50 bg-indigo-950/40 shadow-indigo-900/20" : "border-pink-500/20 shadow-pink-900/20"}`}
          >
            {cuteStep === 0 && (
              <button
                onClick={startCuteSession}
                className="w-full animate-[pulse_3s_ease-in-out_infinite] rounded-2xl border border-indigo-400/50 bg-linear-to-r from-indigo-500/70 to-violet-400/70 px-6 py-4 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 sm:text-base"
              >
                🎧 what to hear cute version ?
              </button>
            )}

            {cuteStep > 0 && (
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="flex min-h-35 items-center justify-center text-center leading-relaxed font-medium text-indigo-100 italic sm:text-lg">
                  <AnimatePresence mode="wait">
                    {cuteStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{
                          duration: 2,
                          delay: 3.5,
                          ease: "easeInOut",
                        }}
                        className="space-y-2"
                      >
                        <p className="text-lg sm:text-xl">
                          baby do remember this moment? 🥺
                        </p>
                        <p className="text-lg sm:text-xl">
                          You sang this one day…
                        </p>
                        <p className="mt-4 text-xl font-bold text-violet-300 sm:text-2xl">
                          That was adorable 😭❤️
                        </p>
                      </motion.div>
                    )}
                    {cuteStep >= 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{
                          duration: 2,
                          delay: 3.5,
                          ease: "easeInOut",
                        }}
                        className="space-y-4"
                      >
                        <p className="text-lg sm:text-xl">
                          I could listen to this forever.
                        </p>
                        <p className="text-2xl font-bold text-violet-300 sm:text-3xl">
                          I love you my baby ❤️
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="w-full border-t border-indigo-500/20 pt-4">
                  <AnimatePresence mode="wait">
                    {cuteStep === 1 && (
                      <motion.button
                        key="btn1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{
                          duration: 1.5,
                          delay: 4.5,
                          ease: "easeInOut",
                        }}
                        onClick={nextCuteStep}
                        className="inline-block w-full rounded-full bg-linear-to-r from-indigo-600 to-violet-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98] sm:text-base"
                      >
                        ok this is seriously best version ✨
                      </motion.button>
                    )}

                    {cuteStep === 2 && (
                      <motion.button
                        key="btn2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{
                          duration: 1.5,
                          delay: 4.5,
                          ease: "easeInOut",
                        }}
                        onClick={nextCuteStep}
                        className="inline-block w-full rounded-full bg-linear-to-r from-indigo-600 to-violet-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98] sm:text-base"
                      >
                        I want this forever 💖
                      </motion.button>
                    )}

                    {cuteStep === 3 && (
                      <motion.button
                        key="btn3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onClick={endCuteSession}
                        className="inline-block w-full rounded-full border border-indigo-500/40 bg-indigo-900/60 px-6 py-4 text-sm font-bold text-indigo-200 transition-all hover:bg-indigo-800/70 active:scale-[0.98] sm:text-base"
                      >
                        Back to original song 🎵
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>

          {/* ─ PROGRESS TO 1 YEAR ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.45 }}
            className="mb-12 rounded-2xl border border-pink-500/20 bg-white/5 p-6 backdrop-blur-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-pink-400">Next chapter</span>
              <span className="text-xs font-bold text-pink-300">
                {progress}% complete
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-pink-900/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 2, delay: 1.7, ease: "easeOut" }}
                className="h-full rounded-full bg-linear-to-r from-pink-500 to-rose-400"
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm font-semibold text-pink-200">
                1 year together ❤️
              </p>
              <p className="mt-0.5 text-xs text-pink-400/50">
                Halfway to our first year and first meet
              </p>
            </div>
          </motion.div>

          {/* ─ SURPRISE BUTTON ───────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.6 }}
            className="mb-8"
          >
            <button
              onClick={handleSurprise}
              className="w-full rounded-2xl bg-linear-to-r from-pink-600 to-rose-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-pink-900/50 transition-all duration-300 hover:scale-105 hover:from-pink-500 hover:to-rose-400 hover:shadow-xl hover:shadow-pink-500/40 active:scale-[0.97] sm:py-4 sm:text-lg"
            >
              Press me 🎹
            </button>
          </motion.div>

          {/* ─ FOOTER ────────────────────────────────────────────────────────── */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.7 }}
            className="pb-8 text-center"
          >
            <p className="text-xs text-pink-400/40">
              made with love 🎹 just for you
            </p>
            <p className="mt-1 text-xs text-pink-400/25">
              Sep 15, 2025 — forever
            </p>
          </motion.footer>
        </div>

        {/* ── SURPRISE MODAL ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.4, opacity: 0, y: 60 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.4, opacity: 0, y: 60 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="hide-scrollbar relative w-full max-w-sm overflow-x-hidden overflow-y-auto rounded-3xl border border-pink-500/30 bg-linear-to-b from-[#1e0630] to-[#0d0010] px-6 pt-6 pb-8 text-center shadow-2xl shadow-pink-900/50 sm:max-h-[90vh] sm:px-8 sm:pt-8 sm:pb-9"
                style={{ maxHeight: "85dvh" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag handle (mobile) */}
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-pink-500/30 sm:hidden" />

                <div className="beat-heart mb-2 text-4xl sm:mb-5 sm:text-6xl">
                  ❤️
                </div>

                {/* Title */}
                <h2 className="font-great-vibes glow-text mb-1 text-3xl text-pink-200 sm:text-5xl">
                  I love you baby
                </h2>
                <p className="mb-3 text-lg sm:text-2xl">❤️✨</p>

                {/* Body */}
                <div className="font-cormorant mb-4 space-y-3 text-left">
                  <p className="text-sm leading-relaxed text-pink-100/90 italic sm:text-lg">
                    Thank you for walking into my life 🌸
                    <br />
                    and turning ordinary days
                    <br />
                    into something{" "}
                    <span className="font-semibold text-pink-300">
                      truly special
                    </span>
                    . 💫
                  </p>

                  <div className="mx-auto h-px w-12 bg-pink-500/40" />

                  <p className="text-sm leading-relaxed text-pink-100/90 italic sm:text-lg">
                    Even with the distance 🌏,
                    <br />
                    you are always right here
                    <br />
                    in my heart 💗 forever.
                  </p>

                  <div className="mx-auto h-px w-12 bg-pink-500/40" />
                </div>

                {/* Sign-off */}
                <p className="font-great-vibes glow-text mb-4 text-2xl text-pink-300 sm:text-4xl">
                  Happy 6 months anniversary wifey 🎹💕
                </p>

                {/* Letter signature */}
                <div className="font-cormorant mb-4 border-t border-pink-500/20 pt-3 text-right">
                  <p className="text-xs text-pink-200/70 italic sm:text-sm">
                    — From the guy who built this little piano world for you ❤️
                  </p>
                  <p className="font-great-vibes mt-1 text-lg text-pink-300 sm:text-2xl">
                    — forever yours ❤️
                  </p>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-xl bg-pink-700/40 px-6 py-2.5 text-sm text-pink-200 transition-colors hover:bg-pink-600/50"
                >
                  Close ❤️
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── IMAGE MODAL ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedMemory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
              onClick={() => setSelectedMemory(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative w-full max-w-xs overflow-hidden rounded-3xl border border-pink-500/30 bg-pink-950/40 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative aspect-square w-full">
                  <Image
                    src={selectedMemory.image}
                    alt={selectedMemory.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="glow-text text-xl font-bold text-pink-200 sm:text-2xl">
                    {selectedMemory.title}
                  </h3>
                  <p className="mt-2 text-sm text-pink-100/80 italic sm:text-base">
                    {selectedMemory.desc}
                  </p>
                  <button
                    onClick={() => setSelectedMemory(null)}
                    className="mt-6 inline-block rounded-full bg-pink-600/40 px-8 py-2 text-xs font-semibold text-pink-100 transition-colors hover:bg-pink-500/60"
                  >
                    Close Memory ❤️
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
