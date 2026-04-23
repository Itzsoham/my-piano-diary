"use client";

import { useEffect, useRef } from "react";
import { useBirthday } from "./birthday-provider";

type Particle = {
  el: HTMLDivElement;
  inner: HTMLSpanElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  baseVx: number;
  half: number;
  removed: boolean;
};

// Each entry: [emoji, glowColor, bgColor]
const EMOJI_POOL: [string, string, string][] = [
  // Musical
  ["🎵", "rgba(192,132,252,0.75)", "rgba(233,213,255,0.25)"],
  ["🎶", "rgba(192,132,252,0.75)", "rgba(233,213,255,0.25)"],
  ["🎹", "rgba(192,132,252,0.65)", "rgba(233,213,255,0.2)"],
  // Pink / love
  ["💖", "rgba(244,114,182,0.85)", "rgba(251,207,232,0.3)"],
  ["💝", "rgba(244,114,182,0.8)", "rgba(251,207,232,0.25)"],
  ["🌸", "rgba(244,114,182,0.7)", "rgba(251,207,232,0.2)"],
  ["🌷", "rgba(244,114,182,0.7)", "rgba(251,207,232,0.2)"],
  ["🪷", "rgba(244,114,182,0.75)", "rgba(251,207,232,0.25)"],
  ["🌹", "rgba(244,114,182,0.8)", "rgba(251,207,232,0.25)"],
  ["🎀", "rgba(244,114,182,0.75)", "rgba(251,207,232,0.2)"],
  // Gold / sparkle
  ["✨", "rgba(253,224,71,0.85)", "rgba(253,230,138,0.3)"],
  ["💫", "rgba(253,224,71,0.8)", "rgba(253,230,138,0.25)"],
  ["🌟", "rgba(253,224,71,0.8)", "rgba(253,230,138,0.25)"],
  ["🪄", "rgba(253,224,71,0.7)", "rgba(253,230,138,0.2)"],
  ["💛", "rgba(253,224,71,0.75)", "rgba(253,230,138,0.25)"],
  // Birthday
  ["🎂", "rgba(251,207,232,0.85)", "rgba(251,207,232,0.3)"],
  ["🎁", "rgba(244,114,182,0.75)", "rgba(251,207,232,0.2)"],
  ["🎊", "rgba(192,132,252,0.8)", "rgba(233,213,255,0.25)"],
  ["🎉", "rgba(192,132,252,0.75)", "rgba(233,213,255,0.2)"],
  ["🎈", "rgba(244,114,182,0.7)", "rgba(251,207,232,0.2)"],
  ["🍰", "rgba(253,224,71,0.75)", "rgba(253,230,138,0.2)"],
  // Nature / soft
  ["🌺", "rgba(244,114,182,0.7)", "rgba(251,207,232,0.2)"],
  ["🦋", "rgba(192,132,252,0.7)", "rgba(233,213,255,0.2)"],
];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function FloatingElements() {
  const { isBirthdayMode } = useBirthday();
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(0);

  useEffect(() => {
    if (!isBirthdayMode) return;
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const MAX_ACTIVE = isMobile ? 5 : 9;
    const SPAWN_INTERVAL = 1800;
    // Mouse deflects the PATH — not the speed
    const INFLUENCE_RADIUS = isMobile ? 90 : 140;
    const STEER = 0.3;
    const RETURN_DAMP = 0.022;
    const MAX_SPEED_MULT = 1.5;
    const TAP_RADIUS = isMobile ? 44 : 32;

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── burst + remove ──────────────────────────────────────────────────────
    const removeParticle = (p: Particle, burst: boolean) => {
      if (p.removed) return;
      p.removed = true;
      particlesRef.current = particlesRef.current.filter((item) => item !== p);
      countRef.current = Math.max(0, countRef.current - 1);

      if (!burst) {
        p.el.remove();
        return;
      }

      const tx = (p.x - p.half).toFixed(1);
      const ty = (p.y - p.half).toFixed(1);

      p.el.animate(
        [
          { transform: `translate(${tx}px,${ty}px) scale(1)`, opacity: "1" },
          { transform: `translate(${tx}px,${ty}px) scale(2)`, opacity: "0" },
        ],
        { duration: 320, easing: "ease-out", fill: "forwards" },
      );
      p.inner.animate(
        [
          { transform: "scale(1) rotate(0deg)", filter: "brightness(1)" },
          { transform: "scale(1.5) rotate(22deg)", filter: "brightness(1.7)" },
        ],
        { duration: 280, easing: "ease-out", fill: "forwards" },
      );

      const love = document.createElement("span");
      love.textContent = "i love you";
      love.style.cssText = `
        position: absolute;
        left: ${p.x.toFixed(1)}px;
        top: ${p.y.toFixed(1)}px;
        transform: translate(-50%, -50%);
        font-size: ${rand(9.5, 11.5).toFixed(1)}px;
        font-style: italic;
        font-family: "Cormorant Garamond", "Georgia", "Times New Roman", serif;
        letter-spacing: 0.01em;
        color: rgba(244, 63, 94, 0.98);
        text-shadow: 0 0 10px rgba(251, 113, 133, 0.8), 0 0 16px rgba(190, 24, 93, 0.45);
        opacity: 1;
        pointer-events: none;
        user-select: none;
        white-space: nowrap;
        z-index: 9999;
      `;
      container.appendChild(love);
      love.animate(
        [
          { transform: "translate(-50%, -50%) scale(0.92)", opacity: 1 },
          { transform: "translate(-50%, -72%) scale(1.02)", opacity: 0.95 },
          { transform: "translate(-50%, -102%) scale(0.98)", opacity: 0 },
        ],
        { duration: 700, easing: "ease-out", fill: "forwards" },
      );
      setTimeout(() => love.remove(), 760);

      setTimeout(() => p.el.remove(), 340);
    };

    // ── global tap / touch hit-test ──────────────────────────────────────────
    const popAtPoint = (cx: number, cy: number) => {
      let best: Particle | null = null;
      let bestDist = Infinity;
      for (const p of particlesRef.current) {
        if (p.removed) continue;
        const dx = p.x - cx;
        const dy = p.y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= TAP_RADIUS && d < bestDist) {
          best = p;
          bestDist = d;
        }
      }
      if (best) removeParticle(best, true);
    };

    const onPointerDown = (e: PointerEvent) => popAtPoint(e.clientX, e.clientY);
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (t) popAtPoint(t.clientX, t.clientY);
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });

    // ── physics tick ─────────────────────────────────────────────────────────
    const tick = () => {
      const { x: mx, y: my } = mouseRef.current;

      for (const p of [...particlesRef.current]) {
        if (p.removed) continue;

        // Gradually return to natural upward drift
        p.vx += (p.baseVx - p.vx) * RETURN_DAMP;
        p.vy += (-p.speed - p.vy) * RETURN_DAMP;

        // Steer away from cursor — changes direction, not raw speed
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < INFLUENCE_RADIUS && dist > 0.5) {
          const str = (1 - dist / INFLUENCE_RADIUS) * STEER;
          p.vx += (dx / dist) * str;
          p.vy += (dy / dist) * str;

          // Cap speed to avoid runaway
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          const cap = p.speed * MAX_SPEED_MULT;
          if (spd > cap) {
            p.vx = (p.vx / spd) * cap;
            p.vy = (p.vy / spd) * cap;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        p.el.style.transform = `translate(${(p.x - p.half).toFixed(1)}px,${(p.y - p.half).toFixed(1)}px)`;

        if (p.y < -p.half * 2) removeParticle(p, false);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // ── spawn ─────────────────────────────────────────────────────────────────
    const spawn = () => {
      if (countRef.current >= MAX_ACTIVE) return;
      countRef.current++;

      const entry = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;
      const [emoji, glow, bg] = entry;

      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const size = rand(20, 32);
      const pad = size * 0.55;
      const total = size + pad * 2;
      const half = total / 2;
      const speed = rand(1.7, 2.3); // px/frame
      const baseVx = rand(-0.2, 0.2);

      const x = rand(total, vw - total);
      const y = vh + total; // start just below screen

      const el = document.createElement("div");
      el.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: ${total}px;
        height: ${total}px;
        border-radius: 50%;
        background: radial-gradient(circle at 40% 35%, ${bg} 0%, transparent 72%);
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        user-select: none;
        will-change: transform;
        filter: drop-shadow(0 0 ${Math.round(size * 0.45)}px ${glow})
                drop-shadow(0 0 ${Math.round(size * 0.9)}px ${glow.replace(/[\d.]+\)$/, "0.35)")});
        transform: translate(${(x - half).toFixed(1)}px,${(y - half).toFixed(1)}px);
        opacity: 0;
      `;

      const inner = document.createElement("span");
      inner.textContent = emoji;
      inner.style.cssText = `
        font-size: ${size}px;
        line-height: 1;
        display: block;
        animation: bday-fe-wobble ${rand(2.5, 4).toFixed(1)}s ease-in-out infinite alternate;
        --r1: ${rand(-15, 15).toFixed(0)}deg;
        --r2: ${rand(-10, 10).toFixed(0)}deg;
      `;
      el.appendChild(inner);
      container.appendChild(el);

      const p: Particle = {
        el,
        inner,
        x,
        y,
        vx: baseVx,
        vy: -speed,
        speed,
        baseVx,
        half,
        removed: false,
      };
      particlesRef.current.push(p);

      // Fade in after first paint
      requestAnimationFrame(() => {
        if (!p.removed) {
          el.style.transition = "opacity 0.45s ease";
          el.style.opacity = "1";
        }
      });
    };

    // Wobble keyframe (injected once)
    if (!document.getElementById("bday-fe-style")) {
      const s = document.createElement("style");
      s.id = "bday-fe-style";
      s.textContent = `
        @keyframes bday-fe-wobble {
          0%   { transform: rotate(var(--r1,-12deg)) scale(1);    }
          100% { transform: rotate(var(--r2, 12deg)) scale(1.08); }
        }
      `;
      document.head.appendChild(s);
    }

    intervalRef.current = setInterval(spawn, SPAWN_INTERVAL);
    spawn();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("touchstart", onTouchStart);
      for (const p of particlesRef.current) p.el.remove();
      particlesRef.current = [];
      countRef.current = 0;
    };
  }, [isBirthdayMode]);

  if (!isBirthdayMode) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-5 overflow-hidden"
      aria-hidden="true"
    />
  );
}
