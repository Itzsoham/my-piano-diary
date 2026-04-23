"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────────

type GamePhase = "love-game" | "transition" | "memory-game" | "complete";

type MemoryCard = {
  id: number;
  pairId: number;
  text: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
};

// ─── Data ──────────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    question: "What do you think makes you special?",
    options: ["Your smile 😊", "Your kindness 💖", "Your voice 🎶"],
    reveal: "All of it ❤️",
  },
  {
    question: "What do you think I love the most about you?",
    options: ["Your personality", "Your energy", "Everything ❤️"],
    reveal: "You are the kind of person people don't forget.",
  },
  {
    question: "What makes you different from everyone else?",
    options: ["Your heart", "Your mind", "Your soul"],
    reveal: "You make everything feel better just by being there.",
  },
  {
    question: "What do you think I feel when I hear your voice?",
    options: ["Calm", "Happy", "In love"],
    reveal: "Your voice is my favorite sound.",
  },
] as const;

const MEMORY_MESSAGES = [
  { text: "You are cute", emoji: "🌸" },
  { text: "You are strong", emoji: "💪" },
  { text: "You are special", emoji: "✨" },
  { text: "You are mine", emoji: "❤️" },
  { text: "You are best", emoji: "🌟" },
  { text: "You are perfect", emoji: "💎" },
  { text: "You are precious", emoji: "💫" },
  { text: "You are pretty", emoji: "🌺" },
  { text: "You are lazy", emoji: "😴" },
  { text: "You are divine", emoji: "🕊️" },
];

const MOTIVATIONAL = [
  "Let's go baby! 💖",
  "Yes! You found one! 🎉",
  "You're so smart! ✨",
  "Amazing memory! 💕",
  "Halfway there! 🌟",
  "You're incredible! 💖",
  "Look at you go! 🌸",
  "You're unstoppable! 💫",
  "Almost done! 🎀",
  "You did it!! 🎊",
];

const ROOM_GLOW = {
  backgroundImage:
    "radial-gradient(920px 520px at 50% -8%, rgba(34,211,238,0.26), transparent 58%), " +
    "radial-gradient(760px 440px at 14% 18%, rgba(244,114,182,0.22), transparent 72%), " +
    "radial-gradient(760px 480px at 86% 16%, rgba(129,140,248,0.24), transparent 72%), " +
    "linear-gradient(180deg, #09090f 0%, #12152d 30%, #19183b 58%, #090b17 100%)",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildMemoryCards(): MemoryCard[] {
  return shuffleArray(
    MEMORY_MESSAGES.flatMap((msg, pairId) => [
      { id: pairId * 2, pairId, ...msg, isFlipped: false, isMatched: false },
      {
        id: pairId * 2 + 1,
        pairId,
        ...msg,
        isFlipped: false,
        isMatched: false,
      },
    ]),
  );
}

// ─── Root Component ────────────────────────────────────────────────────────────

export function BirthdayGamePage() {
  const [phase, setPhase] = useState<GamePhase>("love-game");

  // Love game
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showReveal, setShowReveal] = useState(false);

  // Transition
  const [tranStage, setTranStage] = useState(0);

  // Memory game
  const [cards, setCards] = useState<MemoryCard[]>(buildMemoryCards);
  const [matchedCount, setMatchedCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [motivIdx, setMotivIdx] = useState(-1);
  const isCheckingRef = useRef(false);

  // Transition staged reveal
  useEffect(() => {
    if (phase !== "transition") return;
    setTranStage(0);
    const t1 = setTimeout(() => setTranStage(1), 500);
    const t2 = setTimeout(() => setTranStage(2), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase]);

  // Memory game: detect two flipped cards → check match
  useEffect(() => {
    if (phase !== "memory-game") return;
    if (isCheckingRef.current) return;

    const flipped = cards.filter((c) => c.isFlipped && !c.isMatched);
    if (flipped.length !== 2) return;

    isCheckingRef.current = true;
    setMoves((m) => m + 1);

    const [c1, c2] = flipped as [MemoryCard, MemoryCard];

    if (c1.pairId === c2.pairId) {
      // ✅ Match
      setCards((prev) =>
        prev.map((c) =>
          c.pairId === c1.pairId ? { ...c, isMatched: true } : c,
        ),
      );
      setMatchedCount((mc) => {
        const next = mc + 1;
        setMotivIdx(next - 1);
        if (next === MEMORY_MESSAGES.length) {
          setTimeout(() => {
            void confetti({
              particleCount: 130,
              spread: 130,
              origin: { y: 0.45 },
              colors: ["#f9a8d4", "#fcd34d", "#fb7185", "#c084fc", "#fff"],
            });
            setPhase("complete");
          }, 700);
        }
        return next;
      });
      setTimeout(() => {
        isCheckingRef.current = false;
      }, 400);
    } else {
      // ❌ No match → flip back
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.isFlipped && !c.isMatched ? { ...c, isFlipped: false } : c,
          ),
        );
        isCheckingRef.current = false;
      }, 900);
    }
  }, [cards, phase]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleStart = () => {
    setStep(1);
    setProgress(25);
  };

  const handleOptionClick = () => {
    if (showReveal) return;
    setShowReveal(true);
  };

  const handleContinue = () => {
    if (step < QUESTIONS.length) {
      const next = step + 1;
      setStep(next);
      setProgress(next * 25);
      setShowReveal(false);
    } else {
      setProgress(100);
      setPhase("transition");
    }
  };

  const handleCardFlip = useCallback((cardId: number) => {
    if (isCheckingRef.current) return;
    setCards((prev) => {
      const card = prev.find((c) => c.id === cardId);
      if (!card || card.isFlipped || card.isMatched) return prev;
      return prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c));
    });
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Poppins:wght@400;500;600;700&display=swap');
        .font-great-vibes { font-family: 'Great Vibes', cursive; }
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
        .font-poppins { font-family: 'Poppins', sans-serif; }
      `}</style>

      {/* Gradient background */}
      <div
        className="pointer-events-none fixed inset-0 -z-30"
        style={ROOM_GLOW}
      />

      {/* Glass layers */}
      <div className="pointer-events-none fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[28px_28px] opacity-30" />
        <div className="absolute inset-x-[5%] top-[7%] h-[58%] rounded-[2.8rem] border border-cyan-300/18 bg-slate-950/26 shadow-[0_0_80px_rgba(34,211,238,0.12)] backdrop-blur-md" />
        <div className="absolute inset-x-[10%] top-[12%] h-[46%] rounded-[2.6rem] border border-fuchsia-300/14 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_52%),linear-gradient(180deg,rgba(15,23,42,0.58),rgba(10,10,28,0.18))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_58%,rgba(3,4,12,0.36)_100%)]" />
      </div>

      {/* Ambient floating decorations */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {(["🎮", "✨", "💎", "🪄", "⭐"] as const).map((e, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl opacity-45 drop-shadow-[0_0_20px_rgba(103,232,249,0.34)]"
            style={{ left: `${8 + i * 19}%`, top: `${12 + (i % 3) * 22}%` }}
            animate={{
              y: [0, -14, 0],
              rotate: [-8, 8, -8],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 3.2 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {e}
          </motion.span>
        ))}
      </div>

      {/* Phase content */}
      <AnimatePresence mode="wait">
        {phase === "love-game" && (
          <LoveGameSection
            key="love-game"
            step={step}
            progress={progress}
            showReveal={showReveal}
            onStart={handleStart}
            onOptionClick={handleOptionClick}
            onContinue={handleContinue}
          />
        )}

        {phase === "transition" && (
          <TransitionSection
            key="transition"
            stage={tranStage}
            onStart={() => {
              setCards(buildMemoryCards());
              setPhase("memory-game");
            }}
          />
        )}

        {phase === "memory-game" && (
          <MemoryGameSection
            key="memory-game"
            cards={cards}
            moves={moves}
            matchedCount={matchedCount}
            motivIdx={motivIdx}
            onFlip={handleCardFlip}
          />
        )}

        {phase === "complete" && (
          <CompleteSection key="complete" moves={moves} />
        )}
      </AnimatePresence>
    </main>
  );
}

// ─── Love Game Section ─────────────────────────────────────────────────────────

function LoveGameSection({
  step,
  progress,
  showReveal,
  onStart,
  onOptionClick,
  onContinue,
}: {
  step: number;
  progress: number;
  showReveal: boolean;
  onStart: () => void;
  onOptionClick: () => void;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 py-8 sm:px-6"
    >
      {/* Progress bar */}
      <AnimatePresence>
        {step > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 w-full"
          >
            <div className="mb-3 flex items-center justify-between rounded-full border border-cyan-300/18 bg-slate-950/48 px-4 py-2 shadow-[0_12px_28px_rgba(6,10,28,0.32)] backdrop-blur-md">
              <span className="font-poppins text-[10px] tracking-[0.22em] text-cyan-200/75 uppercase">
                Journey
              </span>
              <span className="font-poppins text-xs font-medium text-fuchsia-100/85">
                {progress}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/8 bg-white/8 shadow-[inset_0_0_16px_rgba(15,23,42,0.56)]">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-cyan-300 via-sky-400 to-fuchsia-400 shadow-[0_0_14px_rgba(56,189,248,0.58)]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* Intro */}
        {step === 0 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.55 }}
            className="flex flex-1 flex-col items-center justify-center text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [-4, 4, -4] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="mb-6 text-7xl"
            >
              🎮
            </motion.div>

            <p className="font-poppins mb-3 rounded-full border border-cyan-300/18 bg-slate-950/44 px-4 py-1.5 text-[10px] tracking-[0.28em] text-cyan-200/75 uppercase backdrop-blur-md">
              Love Quest Mode
            </p>
            <h1 className="font-great-vibes mb-4 text-6xl leading-tight text-white drop-shadow-[0_0_28px_rgba(96,165,250,0.32)] sm:text-7xl">
              Its game time baby ❤️
            </h1>
            <p className="font-cormorant mb-10 max-w-sm text-xl text-cyan-50/78 italic sm:text-2xl">
              A cute little arcade made just for you...
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={onStart}
              className="font-poppins rounded-2xl border border-cyan-300/30 bg-linear-to-r from-cyan-400 via-sky-500 to-fuchsia-500 px-12 py-4 text-sm tracking-[0.2em] text-white uppercase shadow-[0_18px_38px_rgba(59,130,246,0.36)] transition"
            >
              Start ✨
            </motion.button>
          </motion.div>
        )}

        {/* Questions */}
        {step >= 1 && step <= QUESTIONS.length && (
          <motion.div
            key={`q-${step}`}
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 }}
            transition={{ duration: 0.42 }}
            className="flex flex-1 flex-col justify-center"
          >
            <div className="overflow-hidden rounded-[2rem] border border-cyan-300/18 bg-slate-950/54 shadow-[0_22px_52px_rgba(7,10,32,0.44)] backdrop-blur-xl">
              {/* Question header */}
              <div className="border-b border-white/10 bg-white/3 px-6 py-5 sm:px-8">
                <p className="font-poppins text-[10px] tracking-[0.26em] text-cyan-200/70 uppercase">
                  Question {step} of {QUESTIONS.length}
                </p>
                <h2 className="font-great-vibes mt-2 text-4xl leading-snug text-white drop-shadow-[0_0_18px_rgba(96,165,250,0.22)] sm:text-5xl">
                  {QUESTIONS[step - 1]!.question}
                </h2>
              </div>

              {/* Options / Reveal */}
              <div className="p-6 sm:p-8">
                <AnimatePresence mode="wait">
                  {!showReveal ? (
                    <motion.div
                      key="options"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="flex flex-col gap-3"
                    >
                      {QUESTIONS[step - 1]!.options.map((opt) => (
                        <motion.button
                          key={opt}
                          whileHover={{
                            scale: 1.02,
                            x: 4,
                            boxShadow: "0 0 28px rgba(34, 211, 238, 0.2)",
                          }}
                          whileTap={{ scale: 0.97 }}
                          onClick={onOptionClick}
                          className="font-poppins w-full rounded-2xl border border-cyan-300/18 bg-[linear-gradient(135deg,rgba(15,23,42,0.88),rgba(30,41,59,0.72))] px-5 py-4 text-left text-sm text-cyan-50 shadow-[0_14px_28px_rgba(7,10,32,0.24)] transition hover:border-fuchsia-300/30 hover:text-white"
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span>{opt}</span>
                            <span className="text-cyan-300/80">✦</span>
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="reveal"
                      initial={{ opacity: 0, scale: 0.92, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className="rounded-[1.8rem] border border-fuchsia-300/20 bg-linear-to-br from-slate-900/95 via-indigo-950/92 to-fuchsia-950/72 p-6 text-center shadow-[0_20px_46px_rgba(17,24,39,0.4)]"
                    >
                      <motion.p
                        animate={{ scale: [1, 1.14, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                        className="mb-3 text-3xl"
                      >
                        🎁
                      </motion.p>
                      <p className="font-great-vibes text-4xl leading-snug text-white drop-shadow-[0_0_18px_rgba(168,85,247,0.28)] sm:text-5xl">
                        {QUESTIONS[step - 1]!.reveal}
                      </p>

                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onContinue}
                        className="font-poppins mt-6 rounded-2xl border border-cyan-300/22 bg-linear-to-r from-cyan-400 via-sky-500 to-fuchsia-500 px-8 py-3 text-sm tracking-[0.18em] text-white uppercase shadow-[0_12px_28px_rgba(59,130,246,0.34)] transition"
                      >
                        {step === QUESTIONS.length ? "Finish 💖" : "Continue →"}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Transition Section ────────────────────────────────────────────────────────

function TransitionSection({
  stage,
  onStart,
}: {
  stage: number;
  onStart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <div className="max-w-lg rounded-[2rem] border border-cyan-300/16 bg-slate-950/42 px-6 py-10 shadow-[0_24px_60px_rgba(7,10,32,0.34)] backdrop-blur-xl sm:px-8">
        <AnimatePresence>
          {stage >= 1 && (
            <motion.p
              key="l1"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85 }}
              className="font-great-vibes mb-4 text-5xl text-white drop-shadow-[0_0_22px_rgba(103,232,249,0.22)] sm:text-6xl"
            >
              This wasn&apos;t really a game…
            </motion.p>
          )}

          {stage >= 2 && (
            <motion.p
              key="l2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.15 }}
              className="font-cormorant mb-10 text-2xl text-cyan-50/78 italic sm:text-3xl"
            >
              I just wanted to remind you how special you are ❤️
            </motion.p>
          )}

          {stage >= 2 && (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.1 }}
              className="flex flex-col items-center gap-3"
            >
              <p className="font-poppins text-[10px] tracking-[0.26em] text-cyan-200/60 uppercase">
                ok time to get serious
              </p>
              <p className="font-poppins text-sm tracking-[0.12em] text-fuchsia-100/72 lowercase">
                really game time 🎮
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={onStart}
                className="font-poppins mt-3 rounded-2xl border border-cyan-300/28 bg-linear-to-r from-cyan-400 via-sky-500 to-fuchsia-500 px-12 py-4 text-sm tracking-[0.2em] text-white uppercase shadow-[0_16px_36px_rgba(59,130,246,0.34)] transition"
              >
                Lets Start 🎮
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Memory Game Section ───────────────────────────────────────────────────────

function MemoryGameSection({
  cards,
  moves,
  matchedCount,
  motivIdx,
  onFlip,
}: {
  cards: MemoryCard[];
  moves: number;
  matchedCount: number;
  motivIdx: number;
  onFlip: (id: number) => void;
}) {
  const total = MEMORY_MESSAGES.length;
  const pct = (matchedCount / total) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55 }}
      className="relative z-10 mx-auto w-full max-w-2xl px-3 py-8 sm:px-5"
    >
      {/* Header */}
      <div className="mb-5 text-center">
        <p className="font-poppins text-[10px] tracking-[0.26em] text-cyan-200/65 uppercase">
          Real Game 🎮
        </p>
        <h2 className="font-great-vibes mt-1 text-4xl text-white drop-shadow-[0_0_20px_rgba(96,165,250,0.26)] sm:text-5xl">
          Tap to reveal 💕
        </h2>
      </div>

      {/* Stats bar */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-[1.4rem] border border-cyan-300/16 bg-slate-950/50 px-4 py-3 shadow-[0_16px_36px_rgba(7,10,32,0.34)] backdrop-blur-xl">
        <div className="min-w-13 text-center">
          <p className="font-poppins text-[10px] tracking-widest text-cyan-200/65 uppercase">
            Moves
          </p>
          <p className="font-poppins text-xl font-semibold text-white">
            {moves}
          </p>
        </div>

        <div className="flex-1 px-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={motivIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="font-cormorant text-center text-base leading-snug text-fuchsia-100/88 italic"
            >
              {motivIdx < 0
                ? "Find the matching pairs! 🌸"
                : MOTIVATIONAL[Math.min(motivIdx, MOTIVATIONAL.length - 1)]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="min-w-13 text-center">
          <p className="font-poppins text-[10px] tracking-widest text-cyan-200/65 uppercase">
            Pairs
          </p>
          <p className="font-poppins text-xl font-semibold text-white">
            {matchedCount}/{total}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="h-2 w-full overflow-hidden rounded-full border border-white/8 bg-white/8 shadow-[inset_0_0_16px_rgba(15,23,42,0.5)]">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-cyan-300 via-sky-400 to-fuchsia-400 shadow-[0_0_14px_rgba(56,189,248,0.5)]"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* 4×5 grid (mobile: 4 cols, sm+: 5 cols) */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-2.5">
        {cards.map((card) => (
          <MemoryCardTile key={card.id} card={card} onFlip={onFlip} />
        ))}
      </div>

      <p className="font-cormorant mt-6 text-center text-base text-cyan-50/58 italic">
        Find all matching pairs to reveal your surprise 💝
      </p>
    </motion.div>
  );
}

// ─── Memory Card Tile ──────────────────────────────────────────────────────────

function MemoryCardTile({
  card,
  onFlip,
}: {
  card: MemoryCard;
  onFlip: (id: number) => void;
}) {
  const visible = card.isFlipped || card.isMatched;

  return (
    <motion.button
      type="button"
      onClick={() => onFlip(card.id)}
      whileTap={!visible ? { scale: 0.9 } : {}}
      className="relative aspect-square w-full cursor-pointer"
      style={{ perspective: "600px" }}
    >
      <motion.div
        className="relative h-full w-full"
        animate={{ rotateY: visible ? 180 : 0 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Face-down */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl border border-cyan-300/26 bg-linear-to-br from-cyan-500 via-sky-500 to-fuchsia-500 shadow-[0_16px_28px_rgba(14,165,233,0.26)]"
          style={{ backfaceVisibility: "hidden" }}
        >
          <motion.span
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2 + (card.id % 5) * 0.3, repeat: Infinity }}
            className="text-lg text-white/85 sm:text-xl"
          >
            💖
          </motion.span>
        </div>

        {/* Face-up */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-xl border p-1 text-center shadow-md ${
            card.isMatched
              ? "border-fuchsia-300/30 bg-linear-to-br from-slate-900/96 to-indigo-950/88 shadow-[0_0_16px_rgba(168,85,247,0.34)]"
              : "border-cyan-300/16 bg-slate-950/84"
          }`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <span className="text-base leading-none sm:text-xl">
            {card.emoji}
          </span>
          <p className="font-poppins mt-0.5 text-[7px] leading-tight text-cyan-50 sm:text-[9px]">
            {card.text}
          </p>
        </div>
      </motion.div>
    </motion.button>
  );
}

// ─── Complete Section ──────────────────────────────────────────────────────────

function CompleteSection({ moves }: { moves: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center"
    >
      {/* Floating emojis */}
      {(["🎊", "✨", "💖", "🌸", "🎉", "💫"] as const).map((e, i) => (
        <motion.span
          key={i}
          className="pointer-events-none fixed text-3xl sm:text-4xl"
          style={{ left: `${6 + i * 16}%`, top: `${10 + (i % 3) * 20}%` }}
          animate={{
            y: [0, -18, 0],
            rotate: [-10, 10, -10],
            opacity: [0.55, 1, 0.55],
          }}
          transition={{
            duration: 3 + i * 0.35,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {e}
        </motion.span>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
        className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-cyan-300/18 bg-slate-950/58 shadow-[0_24px_64px_rgba(7,10,32,0.44)] backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute -top-14 right-4 h-40 w-40 rounded-full bg-cyan-400/24 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-fuchsia-400/24 blur-2xl" />

        <div className="relative p-7 sm:p-9">
          <motion.p
            animate={{ scale: [1, 1.12, 1], rotate: [-4, 4, -4] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="text-5xl"
          >
            🎊
          </motion.p>

          <h1 className="font-great-vibes mt-3 text-5xl leading-tight text-white drop-shadow-[0_0_24px_rgba(56,189,248,0.24)] sm:text-6xl">
            You did it baby!
          </h1>

          <p className="font-cormorant mt-4 text-xl text-cyan-50/86 italic sm:text-2xl">
            All {MEMORY_MESSAGES.length} pairs found in {moves} moves.
          </p>
          <p className="font-cormorant mt-1 text-lg text-fuchsia-100/76 italic sm:text-xl">
            Just like you always find your way into my heart 💖
          </p>

          {/* Stats */}
          <div className="mt-6 flex justify-center gap-4">
            <div className="rounded-2xl border border-cyan-300/16 bg-linear-to-br from-slate-900/96 to-indigo-950/90 px-5 py-3 text-center">
              <p className="font-poppins text-[10px] tracking-widest text-cyan-200/65 uppercase">
                Total Moves
              </p>
              <p className="font-poppins mt-1 text-2xl font-semibold text-white">
                {moves}
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-300/16 bg-linear-to-br from-slate-900/96 to-indigo-950/90 px-5 py-3 text-center">
              <p className="font-poppins text-[10px] tracking-widest text-cyan-200/65 uppercase">
                Pairs Found
              </p>
              <p className="font-poppins mt-1 text-2xl font-semibold text-white">
                {MEMORY_MESSAGES.length}/{MEMORY_MESSAGES.length}
              </p>
            </div>
          </div>

          {/* CTA */}
          <Link href="/birthday-room">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="font-poppins mt-7 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-cyan-300/24 bg-linear-to-r from-cyan-400 via-sky-500 to-fuchsia-500 px-6 py-4 text-sm tracking-[0.2em] text-white uppercase shadow-[0_16px_40px_rgba(59,130,246,0.38)] transition"
            >
              <span>Claim Your Rewards</span>
              <span className="text-base">🎁</span>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
