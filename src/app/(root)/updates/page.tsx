"use client";

import { useState } from "react";
import { useBirthday } from "@/components/birthday/birthday-provider";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function UpdatesPage() {
  const { isBirthdayMode, isBirthdayDay } = useBirthday();
  const [isBirthdayBoxOpen, setIsBirthdayBoxOpen] = useState(false);
  const [isPasscodeCopied, setIsPasscodeCopied] = useState(false);

  const passcode = "THUYYEUSOHAM";

  const copyPasscode = async () => {
    try {
      await navigator.clipboard.writeText(passcode);
      setIsPasscodeCopied(true);

      window.setTimeout(() => {
        setIsPasscodeCopied(false);
      }, 1800);
    } catch {
      setIsPasscodeCopied(false);
    }
  };

  if (isBirthdayDay || isBirthdayMode) {
    return (
      <div className="flex h-full flex-1 items-center justify-center p-4 sm:p-6">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&display=swap');
          .font-great-vibes { font-family: 'Great Vibes', cursive; }
          .font-cormorant { font-family: 'Cormorant Garamond', serif; }

          @keyframes birthday-box-bob {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }

          @keyframes birthday-box-pop {
            0% { transform: scale(0.88); opacity: 0; }
            55% { transform: scale(1.06); opacity: 1; }
            75% { transform: scale(0.98); }
            100% { transform: scale(1); opacity: 1; }
          }

          @keyframes birthday-reveal-rise {
            0% { transform: translateY(14px) scale(0.96); opacity: 0; }
            100% { transform: translateY(0px) scale(1); opacity: 1; }
          }
        `}</style>

        <button
          type="button"
          onClick={() => {
            if (!isBirthdayBoxOpen) {
              setIsBirthdayBoxOpen(true);
            }
          }}
          className={`group relative w-full max-w-4xl overflow-hidden p-8 text-center transition-transform duration-300 sm:p-10 ${
            isBirthdayBoxOpen
              ? "border border-pink-200/75 bg-linear-to-br from-[#fff8fd] via-[#fff4f9] to-[#fff1f6] shadow-[0_28px_85px_rgba(244,114,182,0.24)]"
              : "border border-transparent bg-transparent shadow-none"
          }`}
          aria-expanded={isBirthdayBoxOpen}
          aria-label={
            isBirthdayBoxOpen
              ? "Birthday message revealed"
              : "Reveal birthday message"
          }
          style={{
            animation: isBirthdayBoxOpen
              ? "birthday-box-pop 520ms cubic-bezier(0.34,1.56,0.64,1)"
              : "birthday-box-bob 2.6s ease-in-out infinite",
          }}
        >
          {!isBirthdayBoxOpen ? (
            <div className="relative flex min-h-80 items-center justify-center py-10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,82,97,0.12),transparent_62%)]" />

              <div className="relative h-56 w-80 transition-all duration-500 group-hover:-translate-y-2 group-hover:drop-shadow-[0_18px_24px_rgba(123,10,24,0.34)]">
                <div className="absolute right-10 bottom-1 left-10 h-6 rounded-full bg-black/28 blur-[1px]" />

                <div className="absolute top-5 right-1 left-1 h-14 bg-[#ff2633] shadow-[0_4px_0_rgba(133,16,24,0.38)]" />
                <div className="absolute top-18 right-0 left-0 h-28 bg-[#e50411] shadow-[0_12px_20px_rgba(102,8,18,0.42)]" />

                <div className="absolute top-5 left-1/2 h-41 w-5 -translate-x-1/2 bg-[#ff4c57]" />
                <div className="absolute top-15 right-0 left-0 h-1.5 bg-white/32" />

                <div className="absolute top-0 left-1/2 h-8 w-8 -translate-x-[92%] rotate-45 bg-[#ff4c57]" />
                <div className="absolute top-0 left-1/2 h-8 w-8 -translate-x-[8%] -rotate-45 bg-[#ff4c57]" />

                <div className="absolute top-10 left-8 text-sm text-white/95">
                  🤍
                </div>
                <div className="absolute top-10 right-8 text-sm text-white/95">
                  🤍
                </div>
                <div className="absolute top-24 left-14 text-sm text-white/95">
                  🤍
                </div>
                <div className="absolute top-24 right-14 text-sm text-white/95">
                  🤍
                </div>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-white/95">
                  🤍
                </div>
              </div>
            </div>
          ) : (
            <div
              className="relative min-h-80 py-8"
              style={{ animation: "birthday-reveal-rise 420ms ease-out both" }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,134,183,0.14),transparent_64%)]" />

              <div className="absolute top-5 left-8 text-2xl">🎈</div>
              <div className="absolute right-8 bottom-7 text-2xl">🎂</div>
              <div className="absolute top-6 right-18 text-xl">✨</div>
              <div className="absolute bottom-10 left-16 text-xl">💗</div>
              <div className="absolute right-20 bottom-11 left-24 h-1 bg-linear-to-r from-rose-400/75 via-rose-500/90 to-rose-400/75" />
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-sm text-rose-500/90">
                🎀
              </div>

              <p className="font-cormorant text-xs tracking-[0.26em] text-rose-500/85 uppercase sm:text-[13px]">
                Birthday Update
              </p>
              <h1 className="font-great-vibes mt-4 text-5xl leading-[0.95] text-rose-700 sm:text-7xl">
                Happiest Birthday, Miss Thùy
              </h1>
              <p className="font-cormorant mx-auto mt-5 max-w-2xl text-xl text-rose-700/85 italic sm:text-2xl">
                Your birthday room is waiting for you whenever you want to step
                inside. ✨
              </p>
              <div className="mx-auto mt-3 flex w-fit max-w-2xl flex-wrap items-center justify-center gap-2 rounded-full border border-rose-200/70 bg-white/55 px-3 py-2 backdrop-blur-sm sm:px-4">
                <p className="font-cormorant text-base text-rose-600/90 italic sm:text-lg">
                  PASSCODE : {passcode}
                </p>
                <button
                  type="button"
                  onClick={copyPasscode}
                  className="rounded-full border border-rose-300/70 bg-rose-50/90 px-3 py-1 text-xs tracking-widest text-rose-700 uppercase transition hover:scale-[1.03] active:scale-[0.97]"
                  aria-label="Copy birthday room passcode"
                >
                  {isPasscodeCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center p-4">
      <ComingSoon
        title="New features are arriving soon 🎹"
        description="We're working on exciting updates to improve your teaching experience. Check back here for the latest release notes and improvements."
      />
    </div>
  );
}
