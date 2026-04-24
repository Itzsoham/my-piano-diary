"use client";

import { useMemo, useState, type MouseEvent } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

type RewardCard = {
  id: number;
  title: string;
  description: string;
  tag: string;
  icon: string;
  boxTone: string;
};

const CEILING_LIGHTS = [16, 30, 44, 57, 70, 83];

const REWARD_CARDS: RewardCard[] = [
  {
    id: 1,
    title: "My Insta For A Day",
    description:
      "You get my Instagram ID for one full day. Do whatever you want with it 😏",
    tag: "Secret Access Pass",
    icon: "📸",
    boxTone: "from-cyan-300/95 via-sky-200/95 to-indigo-200/95",
  },
  {
    id: 2,
    title: "My Telegram For A Day",
    description:
      "My Telegram is yours for one day. All chats, all access. Don't be too nosy 👀",
    tag: "VIP Backstage Ticket",
    icon: "✈️",
    boxTone: "from-violet-300/95 via-indigo-200/95 to-cyan-200/95",
  },
  {
    id: 3,
    title: "I Will Dance For You",
    description:
      "Pick any one song and I will dance for you on it. No backing out 🕺",
    tag: "Personal Performance",
    icon: "💃",
    boxTone: "from-fuchsia-300/95 via-violet-200/95 to-indigo-200/95",
  },
];

const ROOM_GLOW = {
  backgroundImage:
    "radial-gradient(1000px 520px at 50% -8%, rgba(34,211,238,0.28), transparent 58%), " +
    "radial-gradient(700px 420px at 16% 22%, rgba(99,102,241,0.22), transparent 72%), " +
    "radial-gradient(760px 460px at 84% 18%, rgba(168,85,247,0.22), transparent 72%), " +
    "linear-gradient(180deg, #0d1224 0%, #111827 30%, #0f172a 60%, #080c1a 100%)",
};

export function BirthdayRewardsPage() {
  const [openedCardIds, setOpenedCardIds] = useState<number[]>([]);
  const hasOpenedAny = openedCardIds.length > 0;
  const hasOpenedAll = openedCardIds.length === REWARD_CARDS.length;

  const revealCard = (event: MouseEvent<HTMLButtonElement>, cardId: number) => {
    if (openedCardIds.includes(cardId)) return;

    setOpenedCardIds((prev) => [...prev, cardId]);

    void confetti({
      particleCount: 40,
      spread: 75,
      startVelocity: 20,
      scalar: 0.85,
      origin: {
        x: event.clientX / Math.max(window.innerWidth, 1),
        y: event.clientY / Math.max(window.innerHeight, 1),
      },
      colors: ["#67e8f9", "#a78bfa", "#c084fc", "#ffffff", "#38bdf8"],
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Poppins:wght@400;500;600;700&display=swap');
        .font-great-vibes { font-family: 'Great Vibes', cursive; }
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
        .font-poppins { font-family: 'Poppins', sans-serif; }

        @keyframes reward-box-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* Dark gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-30" style={ROOM_GLOW} />

      {/* Glass layers */}
      <div className="pointer-events-none fixed inset-0 -z-20">
        <div className="absolute inset-x-[6%] top-[8%] h-[54%] rounded-[2.8rem] border border-cyan-300/12 bg-cyan-300/4 backdrop-blur-[2px]" />
        <div className="absolute inset-x-[12%] top-[12%] h-[46%] rounded-[2.6rem] border border-indigo-300/10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.1),transparent_56%),linear-gradient(180deg,rgba(15,23,42,0.5),rgba(8,12,26,0.2))]" />
        <div className="absolute bottom-0 left-[-6%] h-[28%] w-[112%] bg-[linear-gradient(180deg,rgba(34,211,238,0)_0%,rgba(99,102,241,0.18)_30%,rgba(79,70,229,0.32)_70%,rgba(55,48,163,0.5)_100%)] [clip-path:polygon(0_0,100%_0,92%_100%,8%_100%)]" />
      </div>

      {/* Ceiling lights — cyan/indigo tone */}
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
                  ? "linear-gradient(to bottom, rgba(103,232,249,0.22), rgba(103,232,249,0.05) 42%, rgba(103,232,249,0.0) 100%)"
                  : "linear-gradient(to bottom, rgba(167,139,250,0.2), rgba(167,139,250,0.05) 44%, rgba(167,139,250,0.0) 100%)",
              filter: "blur(6px)",
              clipPath: "polygon(47% 0%, 53% 0%, 100% 100%, 0% 100%)",
            }}
            animate={{
              rotate: [index % 2 === 0 ? -14 : 12, index % 2 === 0 ? 13 : -10],
              opacity: [0.16, 0.7, 0.22, 0.65, 0.18],
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

        <div className="absolute top-0 left-1/2 h-16 w-[84%] -translate-x-1/2 rounded-b-[2.6rem] border-x border-b border-cyan-300/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(30,27,75,0.85))] shadow-[0_18px_40px_rgba(34,211,238,0.14)]">
          {CEILING_LIGHTS.map((left, index) => (
            <motion.span
              key={`lamp-${left}`}
              className="absolute top-3.5 h-3 w-9 -translate-x-1/2 rounded-full bg-cyan-200/80 shadow-[0_0_20px_rgba(103,232,249,0.7)]"
              style={{ left: `${left}%` }}
              animate={{ opacity: [0.5, 1, 0.6], scale: [0.9, 1.1, 0.94] }}
              transition={{
                duration: 1 + index * 0.14,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "mirror",
              }}
            />
          ))}
        </div>
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 pt-20 pb-10 sm:px-8 sm:pt-24 lg:px-12">
        {/* Floating ambient emojis */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {(["🎁", "✨", "🎮", "💎", "🌟", "🎀"] as const).map((e, i) => (
            <motion.div
              key={i}
              className={`absolute text-2xl sm:text-3xl ${
                i === 0 ? "top-14 left-3 sm:left-8" :
                i === 1 ? "top-16 right-4 sm:right-10" :
                i === 2 ? "top-40 left-[14%]" :
                i === 3 ? "top-44 right-[12%]" :
                i === 4 ? "bottom-24 left-8" :
                "right-8 bottom-20"
              }`}
              animate={{ y: [0, -10, 0], rotate: [i % 2 === 0 ? -5 : 5, i % 2 === 0 ? 5 : -5, i % 2 === 0 ? -5 : 5] }}
              transition={{ duration: 3.8 + i * 0.3, repeat: Number.POSITIVE_INFINITY }}
            >
              {e}
            </motion.div>
          ))}
        </div>

        {/* Header */}
        <motion.div
          className="mx-auto mt-4 max-w-3xl text-center sm:mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="font-poppins mx-auto mb-3 w-fit rounded-full border border-cyan-300/20 bg-white/5 px-4 py-1.5 text-[10px] tracking-[0.22em] text-cyan-300/80 uppercase backdrop-blur-md sm:text-xs">
            Game Reward Room
          </p>
          <h1 className="font-great-vibes text-5xl leading-[0.92] text-cyan-200 drop-shadow-[0_8px_20px_rgba(34,211,238,0.28)] sm:text-7xl lg:text-8xl">
            Open Your Reward Box <span className="text-fuchsia-400">🎁</span>
          </h1>
          <p className="font-cormorant mx-auto mt-4 max-w-2xl text-base text-cyan-50/70 italic sm:text-xl">
            {hasOpenedAll
              ? "You've unlocked all your rewards. You deserve every single one. ❤️"
              : hasOpenedAny
              ? "Open the remaining boxes to collect all your rewards…"
              : "You earned these by winning. Now tap any one box to reveal your reward 🎀"}
          </p>
        </motion.div>

        {/* Gift Boxes */}
        <div className="mx-auto mt-10 w-full max-w-5xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {REWARD_CARDS.map((card, index) => {
              const isOpen = openedCardIds.includes(card.id);

              return (
                <motion.button
                  key={card.id}
                  type="button"
                  onClick={(event) => revealCard(event, card.id)}
                  className="group relative mx-auto h-56 w-full max-w-64 bg-transparent"
                  style={{
                    animation: `reward-box-bob ${2.5 + index * 0.35}s ease-in-out infinite`,
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Shadow */}
                  <motion.div
                    className={`absolute inset-x-8 bottom-1 h-5 rounded-full bg-indigo-900/40 blur-[3px] ${
                      isOpen ? "opacity-40" : "opacity-80"
                    }`}
                    animate={{ scaleX: [0.84, 1.04, 0.88] }}
                    transition={{ duration: 1.8 + index * 0.2, repeat: Infinity }}
                  />

                  {/* Box body */}
                  <div className="relative mx-auto h-44 w-44 transition-all duration-500 group-hover:-translate-y-2 group-hover:drop-shadow-[0_18px_28px_rgba(34,211,238,0.3)]">
                    <div className="absolute right-10 bottom-1 left-10 h-4 rounded-full bg-black/30 blur-[1px]" />

                    {/* Lid */}
                    <div
                      className={`absolute top-4 right-1 left-1 h-11 rounded-sm bg-linear-to-r ${card.boxTone} shadow-[0_4px_0_rgba(34,211,238,0.32)]`}
                    />
                    {/* Body */}
                    <div className="absolute top-14 right-0 left-0 h-24 rounded-sm bg-[#1e3a5f] shadow-[0_12px_20px_rgba(34,211,238,0.22)]" />

                    {/* Ribbon vertical */}
                    <div className="absolute top-4 left-1/2 h-34 w-4 -translate-x-1/2 bg-cyan-300/50" />
                    {/* Ribbon horizontal */}
                    <div className="absolute top-13 right-0 left-0 h-1.5 bg-cyan-200/30" />

                    {/* Bow */}
                    <div className="absolute top-0 left-1/2 h-7 w-7 -translate-x-[92%] rotate-45 bg-cyan-300/60" />
                    <div className="absolute top-0 left-1/2 h-7 w-7 -translate-x-[8%] -rotate-45 bg-cyan-300/60" />

                    {/* Sparkles */}
                    <div className="absolute top-8 left-5 text-xs text-cyan-200/80">✦</div>
                    <div className="absolute top-8 right-5 text-xs text-cyan-200/80">✦</div>
                    <div className="absolute top-18 left-8 text-xs text-indigo-300/70">✦</div>
                    <div className="absolute top-18 right-8 text-xs text-indigo-300/70">✦</div>
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xl">
                      {card.icon}
                    </div>
                  </div>

                  <p className="font-poppins mt-2 text-[11px] tracking-[0.18em] text-cyan-300/70 uppercase">
                    {isOpen ? "✓ Opened" : "Tap To Open"}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Revealed reward vouchers */}
        <AnimatePresence initial={false}>
          {hasOpenedAny && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="mx-auto mt-10 w-full max-w-5xl"
            >
              <div className="grid gap-5">
                {REWARD_CARDS.filter((card) =>
                  openedCardIds.includes(card.id),
                ).map((card, index) => (
                  <motion.article
                    key={card.id}
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                  >
                    {/* Voucher card */}
                    <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(120deg,rgba(15,23,42,0.95),rgba(17,24,60,0.96)_42%,rgba(13,20,50,0.97))] shadow-[0_18px_44px_rgba(34,211,238,0.14)]">
                      {/* Dashed divider */}
                      <div className="absolute inset-y-0 left-28 hidden w-px border-r border-dashed border-cyan-300/25 md:block" />
                      {/* Punch holes */}
                      <div className="absolute top-1/2 -left-3 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-[#080c1a] md:block" />
                      <div className="absolute top-1/2 -right-3 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-[#080c1a] md:block" />

                      {/* Top rainbow accent */}
                      <div className="h-[3px] w-full bg-linear-to-r from-cyan-400 via-indigo-500 to-fuchsia-500" />

                      <div className="grid gap-3 p-5 md:grid-cols-[110px_1fr] md:gap-0 md:p-6">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-4xl">{card.icon}</span>
                          <p className="font-poppins mt-2 text-[10px] tracking-[0.2em] text-cyan-300/65 uppercase">
                            Reward
                          </p>
                        </div>

                        <div className="md:pl-8">
                          <p className="font-poppins text-[10px] tracking-[0.22em] text-cyan-300/60 uppercase">
                            {card.tag}
                          </p>
                          <h2 className="font-great-vibes mt-2 text-5xl leading-[0.92] text-cyan-200 drop-shadow-[0_0_18px_rgba(34,211,238,0.25)] sm:text-6xl">
                            {card.title}
                          </h2>
                          <p className="font-cormorant mt-3 text-lg leading-relaxed text-cyan-50/78 italic sm:text-xl">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}

                {/* Sneak peek of locked rewards */}
                {!hasOpenedAll && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-2"
                  >
                    <p className="font-poppins mb-3 text-center text-[10px] tracking-[0.24em] text-cyan-300/40 uppercase">
                      Sneak peek — open to unlock
                    </p>
                    <div className="grid gap-4">
                      {REWARD_CARDS.filter(
                        (card) => !openedCardIds.includes(card.id),
                      ).map((card) => (
                        <div
                          key={card.id}
                          className="relative overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-[linear-gradient(120deg,rgba(15,23,42,0.7),rgba(17,24,60,0.7))] p-5 blur-[3px] select-none md:p-6"
                        >
                          <div className="h-[2px] w-full bg-linear-to-r from-cyan-400/30 via-indigo-500/30 to-fuchsia-500/30" />
                          <div className="mt-4 flex items-center gap-4">
                            <span className="text-3xl opacity-60">{card.icon}</span>
                            <div>
                              <p className="font-poppins text-[10px] tracking-widest text-cyan-300/40 uppercase">
                                {card.tag}
                              </p>
                              <p className="font-great-vibes mt-1 text-4xl text-cyan-200/50">
                                {card.title}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer note */}
        <motion.div
          className="mx-auto mt-10 max-w-3xl text-center"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <p className="font-cormorant text-base text-cyan-50/45 italic sm:text-xl">
            {hasOpenedAll
              ? "All rewards unlocked. These are yours forever, no expiry date ❤️"
              : "Three boxes, three surprises. Open them all to collect every reward."}
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
            className="font-poppins inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-white/5 px-6 py-3 text-xs tracking-widest text-cyan-300 uppercase backdrop-blur-sm transition-all hover:bg-white/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] active:scale-95"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
