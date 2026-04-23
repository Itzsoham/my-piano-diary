"use client";

import { useMemo, useState, type PointerEvent } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";

type GiftCard = {
  id: number;
  label: string;
  title: string;
  message: string;
  accent: string;
  icon: string;
  ribbon: string;
};

const CEILING_LIGHTS = [12, 24, 36, 50, 64, 77, 89];

const GIFT_CARDS: GiftCard[] = [
  {
    id: 1,
    label: "Wish Box",
    title: "A birthday wish for you",
    message:
      "May your days feel soft, bright, and full of little moments that make you smile for no reason at all.",
    accent: "from-rose-200/95 via-pink-100/95 to-amber-100/90",
    icon: "🎂",
    ribbon: "bg-rose-400/80",
  },
  {
    id: 2,
    label: "Memory Box",
    title: "A room made for your moment",
    message:
      "Every glow, every ribbon, and every sparkle here is trying to feel like a tiny celebration built around you.",
    accent: "from-amber-100/95 via-orange-100/95 to-rose-100/90",
    icon: "🎈",
    ribbon: "bg-amber-500/80",
  },
  {
    id: 3,
    label: "Secret Box",
    title: "The surprise inside",
    message:
      "You are loved, admired, and celebrated more deeply than any card or page could ever fully say.",
    accent: "from-yellow-100/95 via-rose-100/95 to-pink-100/95",
    icon: "🎁",
    ribbon: "bg-fuchsia-400/75",
  },
];

export function BirthdayRoomPage() {
  const [openedCardIds, setOpenedCardIds] = useState<number[]>([]);

  const openedCount = openedCardIds.length;
  const allOpened = openedCount === GIFT_CARDS.length;

  const roomGlow = useMemo(
    () => ({
      backgroundImage:
        "radial-gradient(900px 540px at 50% 0%, rgba(255,243,183,0.92), transparent 48%), radial-gradient(650px 420px at 18% 22%, rgba(248,180,204,0.22), transparent 70%), radial-gradient(650px 420px at 82% 20%, rgba(251,191,36,0.18), transparent 68%), linear-gradient(180deg, #8a5349 0%, #bf7b61 24%, #efd5b7 58%, #9b6c4f 58.5%, #7f573f 100%)",
    }),
    [],
  );

  const revealCard = (
    event: PointerEvent<HTMLButtonElement>,
    cardId: number,
  ) => {
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

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-30"
        style={roomGlow}
      />

      <div className="pointer-events-none fixed inset-0 -z-20">
        <div className="absolute inset-x-[6%] top-[7%] h-[57%] rounded-[3rem] border border-white/15 bg-white/6" />
        <div className="absolute inset-x-[10%] top-[11%] h-[44%] rounded-[2.75rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,247,210,0.24),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
        <div className="absolute bottom-0 left-[-8%] h-[34%] w-[116%] bg-[linear-gradient(180deg,rgba(76,43,29,0)_0%,rgba(76,43,29,0.14)_9%,rgba(88,51,35,0.84)_10%,rgba(126,84,58,0.98)_100%)] [clip-path:polygon(0_0,100%_0,92%_100%,8%_100%)]" />
      </div>

      <div className="pointer-events-none fixed top-0 right-0 left-0 z-0 h-[55vh] overflow-hidden">
        {CEILING_LIGHTS.map((left, index) => (
          <motion.div
            key={left}
            className="absolute -top-10 h-[72vh] origin-top"
            style={{
              left: `${left}%`,
              width: index % 2 === 0 ? "20vw" : "15vw",
              transform: "translateX(-50%)",
              background:
                index % 2 === 0
                  ? "linear-gradient(to bottom, rgba(255,243,183,0.82), rgba(255,243,183,0.18) 42%, rgba(255,243,183,0.0) 100%)"
                  : "linear-gradient(to bottom, rgba(255,218,120,0.68), rgba(255,218,120,0.15) 44%, rgba(255,218,120,0.0) 100%)",
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

        <div className="absolute top-0 left-1/2 h-20 w-[84%] -translate-x-1/2 rounded-b-[2.8rem] border-x border-b border-white/20 bg-[linear-gradient(180deg,rgba(104,60,47,0.98),rgba(147,98,74,0.95))] shadow-[0_18px_40px_rgba(65,32,20,0.35)]">
          {CEILING_LIGHTS.map((left, index) => (
            <motion.span
              key={`lamp-${left}`}
              className="absolute top-5 h-3.5 w-10 -translate-x-1/2 rounded-full bg-amber-100 shadow-[0_0_24px_rgba(255,236,179,0.92)]"
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

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-8 lg:px-12">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p
            className="mx-auto mb-3 w-fit rounded-full border border-amber-100/55 bg-white/18 px-4 py-1.5 text-[10px] tracking-[0.24em] text-amber-50/95 uppercase backdrop-blur-md sm:text-xs"
            style={{ fontFamily: '"Times New Roman", "Georgia", serif' }}
          >
            Private Birthday Room
          </p>
          <h1
            className="text-4xl leading-[0.92] font-semibold text-amber-50 drop-shadow-[0_8px_20px_rgba(60,28,15,0.38)] sm:text-6xl lg:text-7xl"
            style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
          >
            Happy Birthday, Thùy <span className="text-amber-300">🎂</span>
          </h1>
          <p
            className="mx-auto mt-4 max-w-2xl text-sm text-amber-50/90 italic sm:text-lg"
            style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
          >
            A quiet little room, a bright stage, and a few gift boxes waiting to
            open just for you.
          </p>
        </motion.div>

        <div className="mx-auto mt-8 grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.95fr] lg:gap-10">
          <motion.div
            className="order-2 lg:order-1"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.12 }}
          >
            <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-1">
              {GIFT_CARDS.map((card, index) => {
                const isOpen = openedCardIds.includes(card.id);

                return (
                  <motion.button
                    key={card.id}
                    type="button"
                    onClick={(event) => revealCard(event, card.id)}
                    className="group relative min-h-50 overflow-hidden rounded-[2.6rem] border border-white/55 bg-transparent text-left shadow-[0_20px_45px_rgba(76,35,17,0.16)]"
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      duration: 2.6 + index * 0.25,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <motion.div
                      className={`absolute inset-0 bg-linear-to-br ${card.accent}`}
                      animate={isOpen ? { scale: 1.02 } : { scale: 1 }}
                      transition={{ duration: 0.45 }}
                    />

                    <AnimatePresence mode="wait" initial={false}>
                      {!isOpen ? (
                        <motion.div
                          key="closed"
                          className="absolute inset-0"
                          initial={{ opacity: 0.92, rotateX: 0 }}
                          animate={{ opacity: 1, rotateX: 0 }}
                          exit={{ opacity: 0, rotateX: -85, y: -18 }}
                          transition={{
                            duration: 0.55,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <div className="absolute inset-x-5 top-0 h-4 rounded-b-full bg-white/45" />
                          <div
                            className={`absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 ${card.ribbon}`}
                          />
                          <div
                            className={`absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 ${card.ribbon}`}
                          />
                          <div className="absolute top-5 left-1/2 -translate-x-1/2 text-3xl">
                            🎀
                          </div>
                          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                            <p
                              className="text-[11px] tracking-[0.22em] text-stone-700/85 uppercase"
                              style={{
                                fontFamily:
                                  '"Times New Roman", "Georgia", serif',
                              }}
                            >
                              {card.label}
                            </p>
                            <p
                              className="mt-3 text-lg text-stone-800 italic sm:text-xl"
                              style={{
                                fontFamily:
                                  '"Georgia", "Times New Roman", serif',
                              }}
                            >
                              Click to unwrap
                            </p>
                            <p className="mt-4 text-4xl">{card.icon}</p>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="open"
                          className="relative flex h-full min-h-50 flex-col justify-center px-6 py-7"
                          initial={{ opacity: 0, y: 26, scale: 0.92 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.45, ease: "easeOut" }}
                        >
                          <div className="absolute -top-6 left-5 text-3xl">
                            {card.icon}
                          </div>
                          <div className="absolute right-5 -bottom-2 text-2xl">
                            🎉
                          </div>
                          <p
                            className="text-[11px] tracking-[0.22em] text-stone-700/85 uppercase"
                            style={{
                              fontFamily: '"Times New Roman", "Georgia", serif',
                            }}
                          >
                            {card.label}
                          </p>
                          <h2
                            className="mt-3 text-2xl leading-tight text-stone-900 sm:text-[1.9rem]"
                            style={{
                              fontFamily: '"Georgia", "Times New Roman", serif',
                            }}
                          >
                            {card.title}
                          </h2>
                          <p
                            className="mt-3 text-sm leading-relaxed text-stone-800/88 italic sm:text-base"
                            style={{
                              fontFamily: '"Georgia", "Times New Roman", serif',
                            }}
                          >
                            {card.message}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            className="order-1 mx-auto w-full max-w-135 lg:order-2"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.18 }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-x-[15%] -top-10 h-[126%] rounded-[50%] bg-[radial-gradient(circle_at_top,rgba(255,248,196,0.95),rgba(255,248,196,0.22)_38%,rgba(255,248,196,0)_72%)] blur-xl"
                animate={{
                  opacity: [0.5, 0.96, 0.58],
                  scaleX: [0.92, 1.08, 0.96],
                }}
                transition={{ duration: 1.9, repeat: Number.POSITIVE_INFINITY }}
              />
              <motion.div
                className="absolute -top-12 left-1/2 h-[140%] w-[88%] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,245,179,0.74),rgba(255,245,179,0.18)_40%,rgba(255,245,179,0)_100%)] blur-[3px] [clip-path:polygon(49%_0,51%_0,100%_100%,0_100%)]"
                animate={{
                  opacity: [0.34, 0.8, 0.4],
                  scaleY: [0.94, 1.1, 0.98],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "mirror",
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-[2.6rem] bg-linear-to-br from-amber-100/65 via-rose-200/50 to-orange-200/45 blur-2xl"
                animate={{
                  scale: [0.97, 1.07, 0.98],
                  opacity: [0.55, 0.86, 0.58],
                }}
                transition={{
                  duration: 4.8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
              <motion.img
                src="https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80"
                alt="Birthday portrait stage"
                className="relative h-100 w-full rounded-[2.6rem] border-8 border-[#f8dfb1] object-cover shadow-[0_22px_60px_rgba(88,44,17,0.32)] sm:h-124 lg:h-152"
                animate={{ scale: [1, 1.03, 1], y: [0, -4, 0] }}
                transition={{
                  duration: 5.6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mx-auto mt-8 max-w-3xl text-center"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.28 }}
        >
          <p
            className="text-base text-amber-50/92 italic sm:text-xl"
            style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
          >
            {allOpened
              ? "Every box is open now, and every one says the same thing: this day should feel beautiful for you."
              : "The boxes are waiting quietly. Open them one by one and let the room answer back."}
          </p>
        </motion.div>
      </section>
    </main>
  );
}
