"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import confetti from "canvas-confetti";
import { BIRTHDAY_CONFIG, isBirthdayToday } from "@/config/app-config";

interface BirthdayContextValue {
  /** Today is the actual birthday date */
  isBirthdayDay: boolean;
  /** Birthday day AND user has done the 2-click unlock */
  isBirthdayMode: boolean;
  /** The unlock animation is currently playing */
  isActivating: boolean;
  /** Call this on the 2nd card click to trigger the reveal */
  activateBirthdayMode: () => void;
}

const BirthdayContext = createContext<BirthdayContextValue>({
  isBirthdayDay: false,
  isBirthdayMode: false,
  isActivating: false,
  activateBirthdayMode: () => void 0,
});

export function useBirthday() {
  return useContext(BirthdayContext);
}

// ─── Dramatic full-screen activation overlay ─────────────────────────────────
function BirthdayActivationOverlay() {
  return (
    <>
      <style>{`
        @keyframes bday-overlay-fade {
          0%   { opacity: 0; }
          18%  { opacity: 1; }
          72%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes bday-ripple-ring {
          0%   { transform: scale(0); opacity: 0.9; }
          100% { transform: scale(7); opacity: 0; }
        }
        @keyframes bday-cake-pop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          55%  { transform: scale(1.25) rotate(6deg);  opacity: 1; }
          75%  { transform: scale(0.93) rotate(-2deg); }
          100% { transform: scale(1)    rotate(0deg);  opacity: 1; }
        }
        @keyframes bday-act-title {
          0%   { opacity: 0; transform: translateY(28px) scale(0.88); }
          100% { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes bday-orb-spin {
          0%   { transform: rotate(0deg)   scale(0); opacity: 0; }
          45%  { opacity: 1; }
          100% { transform: rotate(360deg) scale(1.3); opacity: 0; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(8,0,18,0.97) 0%, rgba(48,0,38,0.97) 50%, rgba(8,0,18,0.97) 100%)",
          animation: "bday-overlay-fade 2.8s ease-in-out forwards",
          pointerEvents: "none",
        }}
      >
        {/* Ripple rings */}
        {[0, 0.22, 0.44].map((delay, i) => (
          <div
            key={i}
            className="absolute rounded-full border-2 border-pink-400/50"
            style={{
              width: 180,
              height: 180,
              animation: `bday-ripple-ring 2s ease-out forwards`,
              animationDelay: `${delay + 0.35}s`,
            }}
          />
        ))}

        {/* Big cake */}
        <div
          className="mb-5 text-7xl sm:text-8xl"
          style={{
            animation:
              "bday-cake-pop 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.25s both",
          }}
        >
          🎂
        </div>

        {/* Title */}
        <h2
          className="mb-2 text-center text-3xl font-extrabold sm:text-4xl"
          style={{
            background:
              "linear-gradient(135deg, #fbcfe8 0%, #fde68a 50%, #e9d5ff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "bday-act-title 0.55s ease-out 0.8s both",
          }}
        >
          Happy Birthday Baby!
        </h2>

        <p
          className="text-sm text-pink-300/70 italic"
          style={{ animation: "bday-act-title 0.55s ease-out 1.05s both" }}
        >
          Your special day has begun ✨
        </p>

        {/* Orbiting glowing emoji badges */}
        {(
          [
            ["✨", "rgba(253,224,71,0.9)", "rgba(253,230,138,0.3)"],
            ["🌸", "rgba(244,114,182,0.9)", "rgba(251,207,232,0.3)"],
            ["💖", "rgba(244,114,182,0.9)", "rgba(251,207,232,0.3)"],
            ["🌟", "rgba(253,224,71,0.85)", "rgba(253,230,138,0.28)"],
            ["💛", "rgba(253,224,71,0.85)", "rgba(253,230,138,0.28)"],
            ["🎵", "rgba(192,132,252,0.9)", "rgba(233,213,255,0.3)"],
            ["🎹", "rgba(192,132,252,0.85)", "rgba(233,213,255,0.28)"],
            ["🎶", "rgba(192,132,252,0.9)", "rgba(233,213,255,0.3)"],
          ] as [string, string, string][]
        ).map(([emoji, glow, bg], i) => (
          <span
            key={i}
            className="absolute flex items-center justify-center rounded-full text-2xl"
            style={{
              top: `${42 + Math.sin((i / 8) * Math.PI * 2) * 22}%`,
              left: `${50 + Math.cos((i / 8) * Math.PI * 2) * 28}%`,
              width: 44,
              height: 44,
              background: `radial-gradient(circle at 40% 35%, ${bg} 0%, transparent 70%)`,
              filter: `drop-shadow(0 0 8px ${glow}) drop-shadow(0 0 18px ${glow.replace(/[\d.]+\)$/, "0.4)")})`,
              animation: `bday-orb-spin 1.4s ease-out ${0.45 + i * 0.08}s both`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>
    </>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function BirthdayProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [activated, setActivated] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const isDay = BIRTHDAY_CONFIG.enabled && isBirthdayToday();
  const isMode = isDay && activated;

  // Restore persisted activation + hydration guard
  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem("bday-activated") === "1") {
      setActivated(true);
    }
  }, []);

  // Toggle birthday-mode class on <html>
  useEffect(() => {
    if (isMode) {
      document.documentElement.classList.add("birthday-mode");
    } else {
      document.documentElement.classList.remove("birthday-mode");
    }
  }, [isMode]);

  const activateBirthdayMode = useCallback(() => {
    if (activated || isActivating) return;
    setIsActivating(true);

    const colors = [
      "#fbcfe8",
      "#fde68a",
      "#e9d5ff",
      "#f9a8d4",
      "#c084fc",
      "#fcd34d",
    ];

    // Confetti waves timed with the overlay animation
    setTimeout(() => {
      void confetti({
        particleCount: 130,
        spread: 100,
        origin: { x: 0.5, y: 0.4 },
        colors,
      });
    }, 600);
    setTimeout(() => {
      void confetti({
        particleCount: 90,
        angle: 60,
        spread: 75,
        origin: { x: 0, y: 0.5 },
        colors,
      });
      void confetti({
        particleCount: 90,
        angle: 120,
        spread: 75,
        origin: { x: 1, y: 0.5 },
        colors,
      });
    }, 950);
    setTimeout(() => {
      void confetti({
        particleCount: 70,
        spread: 90,
        origin: { x: 0.5, y: 0.65 },
        colors,
      });
    }, 1300);

    // Activate after overlay finishes
    setTimeout(() => {
      setActivated(true);
      sessionStorage.setItem("bday-activated", "1");
      setIsActivating(false);
    }, 2800);
  }, [activated, isActivating]);

  return (
    <BirthdayContext.Provider
      value={{
        isBirthdayDay: mounted ? isDay : false,
        isBirthdayMode: mounted ? isMode : false,
        isActivating: mounted ? isActivating : false,
        activateBirthdayMode,
      }}
    >
      {children}
      {mounted && isActivating && <BirthdayActivationOverlay />}
    </BirthdayContext.Provider>
  );
}
