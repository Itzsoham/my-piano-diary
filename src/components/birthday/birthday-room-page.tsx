"use client";

import { useMemo, useState, type MouseEvent } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

type GiftCard = {
  id: number;
  title: string;
  description: string;
  tag: string;
  icon: string;
  boxTone: string;
  variant: "voucher" | "quest";
};

const CEILING_LIGHTS = [16, 30, 44, 57, 70, 83];

const GIFT_CARDS: GiftCard[] = [
  {
    id: 1,
    title: "No Sleep Day",
    description: "We talk spend whole night togather till morning.",
    tag: "Midnight Lovers Pass",
    icon: "🌙",
    boxTone: "from-rose-300/95 via-pink-200/95 to-rose-100/95",
    variant: "voucher",
  },
  {
    id: 2,
    title: "Yes Day For The 1 Week",
    description: "I will say yes to all things u say for 1 day.",
    tag: "Sweet Promise Ticket",
    icon: "💖",
    boxTone: "from-fuchsia-200/95 via-rose-200/95 to-orange-100/95",
    variant: "voucher",
  },
  {
    id: 3,
    title: "Mystery Love Game",
    description:
      "Umm for this u have to play one game and win, lets see what u win.",
    tag: "Secret Quest",
    icon: "🎮",
    boxTone: "from-sky-200/95 via-violet-200/95 to-fuchsia-200/95",
    variant: "quest",
  },
];

export function BirthdayRoomPage() {
  const [openedCardIds, setOpenedCardIds] = useState<number[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  const expectedPasscode = "THUYYEUSOHAM";

  const hasOpenedAny = openedCardIds.length > 0;

  const roomGlow = useMemo(
    () => ({
      backgroundImage:
        "radial-gradient(1000px 520px at 50% -8%, rgba(255,213,230,0.86), transparent 58%), radial-gradient(700px 420px at 16% 22%, rgba(251,182,206,0.4), transparent 72%), radial-gradient(760px 460px at 84% 18%, rgba(255,226,189,0.44), transparent 72%), linear-gradient(180deg, #ffc5d8 0%, #ffd7e4 30%, #ffe8ef 58%, #f8d7e0 100%)",
    }),
    [],
  );

  const revealCard = (event: MouseEvent<HTMLButtonElement>, cardId: number) => {
    if (openedCardIds.includes(cardId)) return;

    setOpenedCardIds((prev) => [...prev, cardId]);

    void confetti({
      particleCount: 30,
      spread: 70,
      startVelocity: 18,
      scalar: 0.8,
      origin: {
        x: event.clientX / Math.max(window.innerWidth, 1),
        y: event.clientY / Math.max(window.innerHeight, 1),
      },
      colors: ["#f9a8d4", "#fcd34d", "#fb7185", "#ffffff"],
    });
  };

  const submitPasscode = () => {
    if (passcodeInput.trim().toUpperCase() === expectedPasscode) {
      setIsUnlocked(true);
      setPasscodeError("");
      void confetti({
        particleCount: 60,
        spread: 86,
        startVelocity: 24,
        scalar: 0.9,
        origin: { x: 0.5, y: 0.45 },
        colors: ["#f9a8d4", "#fcd34d", "#fb7185", "#ffffff"],
      });
      return;
    }

    setPasscodeError("Aww nooo... wrong passcode. Try again, baby 💗");
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Poppins:wght@400;500;600;700&display=swap');
        .font-great-vibes { font-family: 'Great Vibes', cursive; }
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
        .font-poppins { font-family: 'Poppins', sans-serif; }

        @keyframes box-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
      <div
        className="pointer-events-none fixed inset-0 -z-30"
        style={roomGlow}
      />

      <div className="pointer-events-none fixed inset-0 -z-20">
        <div className="absolute inset-x-[6%] top-[8%] h-[54%] rounded-[2.8rem] border border-white/55 bg-white/22 backdrop-blur-[2px]" />
        <div className="absolute inset-x-[12%] top-[12%] h-[46%] rounded-[2.6rem] border border-white/45 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.75),transparent_56%),linear-gradient(180deg,rgba(255,255,255,0.36),rgba(255,255,255,0.12))]" />
        <div className="absolute bottom-0 left-[-6%] h-[32%] w-[112%] bg-[linear-gradient(180deg,rgba(250,190,206,0)_0%,rgba(246,159,186,0.3)_16%,rgba(235,127,166,0.54)_44%,rgba(216,106,146,0.72)_100%)] [clip-path:polygon(0_0,100%_0,92%_100%,8%_100%)]" />
      </div>

      <div className="pointer-events-none fixed top-0 right-0 left-0 z-0 h-[44vh] overflow-hidden">
        {CEILING_LIGHTS.map((left, index) => (
          <motion.div
            key={left}
            className="absolute -top-10 h-[58vh] origin-top"
            style={{
              left: `${left}%`,
              width: index % 2 === 0 ? "20vw" : "15vw",
              transform: "translateX(-50%)",
              background:
                index % 2 === 0
                  ? "linear-gradient(to bottom, rgba(255,240,250,0.72), rgba(255,240,250,0.14) 42%, rgba(255,240,250,0.0) 100%)"
                  : "linear-gradient(to bottom, rgba(255,224,235,0.68), rgba(255,224,235,0.14) 44%, rgba(255,224,235,0.0) 100%)",
              filter: "blur(6px)",
              clipPath: "polygon(47% 0%, 53% 0%, 100% 100%, 0% 100%)",
            }}
            animate={{
              rotate: [index % 2 === 0 ? -14 : 12, index % 2 === 0 ? 13 : -10],
              opacity: [0.16, 0.88, 0.22, 0.78, 0.18],
              scaleY: [0.84, 1.16, 0.92, 1.1, 0.88],
            }}
            transition={{
              duration: 1.9 + index * 0.18,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              repeatType: "mirror",
            }}
          />
        ))}

        <div className="absolute top-0 left-1/2 h-18 w-[84%] -translate-x-1/2 rounded-b-[2.6rem] border-x border-b border-white/50 bg-[linear-gradient(180deg,rgba(244,153,186,0.94),rgba(235,124,166,0.9))] shadow-[0_18px_40px_rgba(176,68,114,0.32)]">
          {CEILING_LIGHTS.map((left, index) => (
            <motion.span
              key={`lamp-${left}`}
              className="absolute top-4 h-3.5 w-10 -translate-x-1/2 rounded-full bg-rose-50 shadow-[0_0_24px_rgba(255,239,248,0.9)]"
              style={{ left: `${left}%` }}
              animate={{ opacity: [0.56, 1, 0.66], scale: [0.92, 1.08, 0.95] }}
              transition={{
                duration: 1 + index * 0.14,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "mirror",
              }}
            />
          ))}
        </div>
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 pt-16 pb-10 sm:px-8 sm:pt-20 lg:px-12">
        {!isUnlocked ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,220,235,0.55),rgba(255,188,214,0.75)_56%,rgba(242,132,172,0.72))] backdrop-blur-sm" />
            <motion.div
              className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/55 bg-[linear-gradient(155deg,rgba(255,255,255,0.94),rgba(255,241,247,0.95)_45%,rgba(255,228,238,0.94))] p-6 shadow-[0_22px_60px_rgba(176,68,114,0.32)] sm:p-8"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.36, ease: "easeOut" }}
            >
              <div className="pointer-events-none absolute -top-12 -right-10 h-36 w-36 rounded-full bg-rose-200/60 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-pink-200/60 blur-2xl" />

              <p className="font-poppins text-center text-[10px] tracking-[0.26em] text-rose-600/75 uppercase sm:text-xs">
                Birthday Room Lock
              </p>
              <h2 className="font-great-vibes mt-3 text-center text-5xl leading-[0.95] text-rose-700 sm:text-6xl">
                Enter the Passcode to Enter
              </h2>
              <p className="font-cormorant mx-auto mt-3 max-w-md text-center text-lg text-rose-800/80 italic sm:text-xl">
                A tiny love door is here. Put the sweet code and come inside ✨
              </p>

              <div className="mt-6">
                <label
                  htmlFor="birthday-passcode"
                  className="font-poppins block text-left text-[10px] tracking-[0.22em] text-rose-600/80 uppercase"
                >
                  Passcode
                </label>
                <input
                  id="birthday-passcode"
                  type="text"
                  value={passcodeInput}
                  onChange={(event) => {
                    setPasscodeInput(event.target.value);
                    if (passcodeError) setPasscodeError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitPasscode();
                    }
                  }}
                  className="font-poppins mt-2 w-full rounded-2xl border border-rose-300/75 bg-white/85 px-4 py-3 text-center text-sm tracking-[0.18em] text-rose-700 uppercase transition outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
                  placeholder="Type passcode"
                  autoComplete="off"
                  autoFocus
                />

                {passcodeError ? (
                  <p className="font-cormorant mt-3 text-center text-lg text-rose-600 italic">
                    {passcodeError}
                  </p>
                ) : (
                  <p className="font-cormorant mt-3 text-center text-base text-rose-700/70 italic">
                    Hint: It starts with THUYY...
                  </p>
                )}

                <button
                  type="button"
                  onClick={submitPasscode}
                  className="font-poppins mt-5 w-full rounded-2xl border border-rose-300/70 bg-[linear-gradient(180deg,#ff7faa,#ff5b8f)] px-4 py-3 text-sm tracking-[0.16em] text-white uppercase shadow-[0_12px_28px_rgba(180,58,107,0.36)] transition hover:scale-[1.01] active:scale-[0.98]"
                >
                  Unlock Birthday Room
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute top-14 left-3 text-4xl sm:left-8 sm:text-5xl"
            animate={{ y: [0, -10, 0], rotate: [-4, 4, -4] }}
            transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY }}
          >
            🎈
          </motion.div>
          <motion.div
            className="absolute top-18 right-4 text-3xl sm:right-10 sm:text-4xl"
            animate={{ y: [0, -8, 0], rotate: [3, -3, 3] }}
            transition={{ duration: 3.8, repeat: Number.POSITIVE_INFINITY }}
          >
            🎈
          </motion.div>
          <motion.div
            className="absolute top-40 left-[14%] text-3xl sm:text-4xl"
            animate={{ y: [0, -12, 0], x: [0, 3, 0] }}
            transition={{ duration: 4.6, repeat: Number.POSITIVE_INFINITY }}
          >
            🎁
          </motion.div>
          <motion.div
            className="absolute top-44 right-[12%] text-3xl sm:text-4xl"
            animate={{ y: [0, -9, 0], x: [0, -3, 0] }}
            transition={{ duration: 4.1, repeat: Number.POSITIVE_INFINITY }}
          >
            🧸
          </motion.div>
          <motion.div
            className="absolute bottom-24 left-8 text-3xl sm:text-4xl"
            animate={{ y: [0, -8, 0], rotate: [-6, 6, -6] }}
            transition={{ duration: 3.9, repeat: Number.POSITIVE_INFINITY }}
          >
            🎀
          </motion.div>
          <motion.div
            className="absolute right-8 bottom-20 text-3xl sm:text-4xl"
            animate={{ y: [0, -10, 0], rotate: [5, -5, 5] }}
            transition={{ duration: 4.4, repeat: Number.POSITIVE_INFINITY }}
          >
            🎁
          </motion.div>
        </div>

        <motion.div
          className="mx-auto mt-8 max-w-3xl text-center sm:mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="font-great-vibes mb-3 text-5xl leading-[0.92] text-rose-600 sm:text-6xl">
            Happy Birthday Baby
          </p>
          <p className="font-poppins mx-auto mb-3 w-fit rounded-full border border-rose-200/70 bg-white/50 px-4 py-1.5 text-[10px] tracking-[0.22em] text-rose-700/80 uppercase backdrop-blur-md sm:text-xs">
            Lover Voucher Room
          </p>
          <h1 className="font-great-vibes text-5xl leading-[0.92] text-rose-700 drop-shadow-[0_8px_20px_rgba(183,74,118,0.25)] sm:text-7xl lg:text-8xl">
            Pick Your Love Box <span className="text-pink-500">🎀</span>
          </h1>
          <p className="font-cormorant mx-auto mt-4 max-w-2xl text-base text-rose-700/80 italic sm:text-xl">
            Tap a floating box first. Your romantic voucher will appear below.
          </p>
        </motion.div>

        <div className="mx-auto mt-10 w-full max-w-5xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {GIFT_CARDS.map((card, index) => {
              const isOpen = openedCardIds.includes(card.id);

              return (
                <motion.button
                  key={card.id}
                  type="button"
                  onClick={(event) => revealCard(event, card.id)}
                  className="group relative mx-auto h-54 w-full max-w-62 bg-transparent"
                  style={{
                    animation: `box-bob ${2.5 + index * 0.35}s ease-in-out infinite`,
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div
                    className={`absolute inset-x-8 bottom-1 h-5 rounded-full bg-rose-950/18 blur-[2px] ${
                      isOpen ? "opacity-45" : "opacity-85"
                    }`}
                    animate={{ scaleX: [0.84, 1.04, 0.88] }}
                    transition={{
                      duration: 1.8 + index * 0.2,
                      repeat: Infinity,
                    }}
                  />

                  <div className="relative mx-auto h-44 w-44 transition-all duration-500 group-hover:-translate-y-2 group-hover:drop-shadow-[0_18px_24px_rgba(170,59,106,0.32)]">
                    <div className="absolute right-10 bottom-1 left-10 h-4 rounded-full bg-black/22 blur-[1px]" />

                    <div
                      className={`absolute top-4 right-1 left-1 h-11 rounded-sm bg-linear-to-r ${card.boxTone} shadow-[0_4px_0_rgba(157,45,92,0.38)]`}
                    />
                    <div className="absolute top-14 right-0 left-0 h-24 rounded-sm bg-[#ff5b8f] shadow-[0_12px_20px_rgba(157,32,84,0.34)]" />

                    <div className="absolute top-4 left-1/2 h-34 w-4 -translate-x-1/2 bg-[#ff86ad]" />
                    <div className="absolute top-13 right-0 left-0 h-1.5 bg-white/34" />

                    <div className="absolute top-0 left-1/2 h-7 w-7 -translate-x-[92%] rotate-45 bg-[#ff86ad]" />
                    <div className="absolute top-0 left-1/2 h-7 w-7 -translate-x-[8%] -rotate-45 bg-[#ff86ad]" />

                    <div className="absolute top-8 left-5 text-xs text-white/90">
                      🤍
                    </div>
                    <div className="absolute top-8 right-5 text-xs text-white/90">
                      🤍
                    </div>
                    <div className="absolute top-18 left-8 text-xs text-white/90">
                      🤍
                    </div>
                    <div className="absolute top-18 right-8 text-xs text-white/90">
                      🤍
                    </div>
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/90">
                      {card.icon}
                    </div>
                  </div>

                  <p className="font-poppins mt-2 text-xs tracking-[0.18em] text-rose-700/70 uppercase">
                    {isOpen ? "Opened" : "Tap To Open"}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {hasOpenedAny ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="mx-auto mt-10 w-full max-w-5xl"
            >
              <div className="grid gap-6">
                {GIFT_CARDS.filter((card) =>
                  openedCardIds.includes(card.id),
                ).map((card, index) => (
                  <motion.article
                    key={card.id}
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                  >
                    {card.variant === "voucher" ? (
                      <div className="relative overflow-hidden rounded-[2rem] border border-rose-300/70 bg-[linear-gradient(120deg,rgba(255,255,255,0.94),rgba(255,244,248,0.95)_42%,rgba(255,236,242,0.94))] shadow-[0_18px_44px_rgba(174,78,118,0.22)]">
                        <div className="absolute inset-y-0 left-26 hidden w-px border-r border-dashed border-rose-300/70 md:block" />
                        <div className="absolute top-1/2 -left-3 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-[#ffdce8] md:block" />
                        <div className="absolute top-1/2 -right-3 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-[#ffdce8] md:block" />

                        <div className="grid gap-2 p-5 md:grid-cols-[110px_1fr] md:gap-0 md:p-6">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-4xl">{card.icon}</span>
                            <p className="font-poppins mt-2 text-[10px] tracking-[0.2em] text-rose-600/75 uppercase">
                              Love Pass
                            </p>
                          </div>

                          <div className="md:pl-8">
                            <p className="font-poppins text-[10px] tracking-[0.22em] text-rose-600/72 uppercase">
                              {card.tag}
                            </p>
                            <h2 className="font-great-vibes mt-2 text-5xl leading-[0.92] text-rose-700 sm:text-6xl">
                              {card.title}
                            </h2>
                            <p className="font-cormorant mt-3 text-lg leading-relaxed text-rose-900/80 italic sm:text-xl">
                              {card.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative overflow-hidden rounded-[2rem] border border-violet-300/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(238,232,255,0.92)_46%,rgba(232,247,255,0.94))] shadow-[0_20px_50px_rgba(106,92,191,0.24)]">
                        <div className="absolute -top-14 right-8 h-40 w-40 rounded-full bg-violet-300/35 blur-2xl" />
                        <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-sky-200/40 blur-2xl" />

                        <div className="relative p-6 sm:p-7">
                          <div className="flex items-center justify-between">
                            <p className="font-poppins text-[10px] tracking-[0.22em] text-violet-700/75 uppercase">
                              {card.tag}
                            </p>
                            <span className="rounded-full border border-violet-300/70 bg-white/70 px-3 py-1 text-xs text-violet-700">
                              Level 01
                            </span>
                          </div>

                          <h2 className="font-great-vibes mt-3 text-5xl leading-[0.92] text-violet-700 sm:text-6xl">
                            {card.title}
                          </h2>
                          <p className="font-cormorant mt-3 max-w-3xl text-lg leading-relaxed text-violet-950/80 italic sm:text-xl">
                            {card.description}
                          </p>

                          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap gap-3">
                              <span className="font-poppins rounded-full border border-violet-300/70 bg-violet-100/75 px-4 py-1 text-xs text-violet-700">
                                🎯 Play To Unlock
                              </span>
                              <span className="font-poppins rounded-full border border-sky-300/70 bg-sky-100/70 px-4 py-1 text-xs text-sky-700">
                                ✨ Unknown Reward
                              </span>
                            </div>

                            <Link
                              href="/birthday-game"
                              className="font-poppins group/play inline-flex items-center gap-2 rounded-2xl border border-violet-400/70 bg-[linear-gradient(135deg,#8b5cf6,#ec4899_58%,#fb7185)] px-6 py-3 text-sm tracking-[0.14em] text-white uppercase shadow-[0_14px_28px_rgba(113,73,201,0.34)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(113,73,201,0.44)] active:translate-y-0 active:scale-[0.98]"
                            >
                              <span className="text-base leading-none">🎮</span>
                              <span>Play Now</span>
                              <span className="transition-transform duration-300 group-hover/play:translate-x-1">
                                ➜
                              </span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.article>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.div
          className="mx-auto mt-8 max-w-3xl text-center"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.28 }}
        >
          <p className="font-cormorant text-lg text-rose-800/75 italic sm:text-2xl">
            {hasOpenedAny
              ? "Your love vouchers are revealed. Keep opening all 3 to see every surprise."
              : "Only three floating gift boxes are here first. Tap any one to reveal your ticket."}
          </p>
        </motion.div>

        <motion.div
          className="mx-auto mt-12 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/"
            className="font-poppins inline-flex items-center gap-2 rounded-xl border border-rose-300/50 bg-white/40 px-6 py-3 text-xs tracking-widest text-rose-700 uppercase backdrop-blur-sm transition-all hover:bg-white/60 hover:shadow-lg active:scale-95"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
