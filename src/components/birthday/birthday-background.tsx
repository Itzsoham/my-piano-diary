"use client";

import { useBirthday } from "./birthday-provider";

export function BirthdayBackground() {
  const { isBirthdayMode } = useBirthday();
  if (!isBirthdayMode) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Pink orb — top-left */}
      <div
        className="absolute rounded-full opacity-[0.045]"
        style={{
          width: "clamp(200px, 40vw, 500px)",
          height: "clamp(200px, 40vw, 500px)",
          top: "-10%",
          left: "-8%",
          background: "#fbcfe8",
          filter: "blur(120px)",
        }}
      />
      {/* Purple orb — bottom-right */}
      <div
        className="absolute rounded-full opacity-[0.04]"
        style={{
          width: "clamp(180px, 35vw, 420px)",
          height: "clamp(180px, 35vw, 420px)",
          bottom: "-8%",
          right: "-6%",
          background: "#e9d5ff",
          filter: "blur(130px)",
        }}
      />
      {/* Gold orb — center-right */}
      <div
        className="absolute rounded-full opacity-[0.03]"
        style={{
          width: "clamp(120px, 25vw, 320px)",
          height: "clamp(120px, 25vw, 320px)",
          top: "40%",
          right: "15%",
          background: "#fde68a",
          filter: "blur(100px)",
        }}
      />
    </div>
  );
}
