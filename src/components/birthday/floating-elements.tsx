"use client";

import { useEffect, useRef } from "react";
import { useBirthday } from "./birthday-provider";

type ActiveElem = {
  physics: HTMLDivElement;
  wrapper: HTMLDivElement;
  inner: HTMLSpanElement;
  rx: number;
  ry: number;
  removed: boolean;
  timeoutId: ReturnType<typeof setTimeout> | null;
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

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function FloatingElements() {
  const { isBirthdayMode } = useBirthday();
  const containerRef = useRef<HTMLDivElement>(null);
  const countRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const activeElemsRef = useRef<ActiveElem[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isBirthdayMode) return;
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const maxActive = isMobile ? 4 : 8;

    // Track mouse position
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    // RAF repulsion loop
    const REPULSION_RADIUS = 120;
    const MAX_FORCE = 90;
    const LERP = 0.14;
    const TAP_RADIUS = isMobile ? 34 : 26;

    const removeItem = (item: ActiveElem, burst: boolean) => {
      if (item.removed) return;
      item.removed = true;

      if (item.timeoutId) {
        clearTimeout(item.timeoutId);
        item.timeoutId = null;
      }

      activeElemsRef.current = activeElemsRef.current.filter((e) => e !== item);
      countRef.current = Math.max(0, countRef.current - 1);

      if (!burst) {
        item.physics.remove();
        return;
      }

      item.physics.style.pointerEvents = "none";
      item.wrapper.style.animation = "none";
      item.inner.style.animation = "none";

      item.inner.animate(
        [
          {
            transform: "scale(1) rotate(0deg)",
            opacity: 1,
            filter: "brightness(1)",
          },
          {
            transform: "scale(1.65) rotate(16deg)",
            opacity: 0,
            filter: "brightness(1.35)",
          },
        ],
        {
          duration: 250,
          easing: "cubic-bezier(0.2, 0.85, 0.2, 1)",
          fill: "forwards",
        },
      );

      item.wrapper.animate(
        [
          { transform: "scale(1)", opacity: 1 },
          { transform: "scale(1.28)", opacity: 0 },
        ],
        {
          duration: 250,
          easing: "ease-out",
          fill: "forwards",
        },
      );

      setTimeout(() => {
        item.physics.remove();
      }, 260);
    };

    const popAtPoint = (x: number, y: number) => {
      let best: ActiveElem | null = null;
      let bestDist = Number.POSITIVE_INFINITY;

      for (const item of activeElemsRef.current) {
        if (item.removed) continue;
        const rect = item.physics.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cx - x;
        const dy = cy - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= TAP_RADIUS && dist < bestDist) {
          best = item;
          bestDist = dist;
        }
      }

      if (best) {
        removeItem(best, true);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      popAtPoint(e.clientX, e.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      popAtPoint(touch.clientX, touch.clientY);
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });

    const tick = () => {
      const { x: mx, y: my } = mouseRef.current;

      // Prune removed elements
      activeElemsRef.current = activeElemsRef.current.filter((item) =>
        document.contains(item.physics),
      );

      for (const item of activeElemsRef.current) {
        const rect = item.physics.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cx - mx;
        const dy = cy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetRx = 0;
        let targetRy = 0;

        if (dist < REPULSION_RADIUS && dist > 1) {
          const force =
            ((REPULSION_RADIUS - dist) / REPULSION_RADIUS) * MAX_FORCE;
          targetRx = (dx / dist) * force;
          targetRy = (dy / dist) * force;
        }

        // Smooth lerp toward target repulsion offset
        item.rx += (targetRx - item.rx) * LERP;
        item.ry += (targetRy - item.ry) * LERP;

        if (Math.abs(item.rx) > 0.3 || Math.abs(item.ry) > 0.3) {
          item.physics.style.transform = `translate(${item.rx.toFixed(1)}px, ${item.ry.toFixed(1)}px)`;
        } else {
          item.physics.style.transform = "";
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const spawn = () => {
      if (countRef.current >= maxActive) return;
      countRef.current++;

      const entry = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;
      const [emoji, glow, bg] = entry;

      const size = randomBetween(15, 24);
      const pad = size * 0.55;
      const left = randomBetween(2, 94);
      const duration = randomBetween(5.5, 9);
      const driftX = randomBetween(-30, 30);
      // slight random rotation wobble
      const rot1 = randomBetween(-18, 18);
      const rot2 = randomBetween(-12, 12);

      // Outer physics anchor — JS applies mouse-repulsion transform here
      const physics = document.createElement("div");
      physics.style.cssText = `
        position: absolute;
        bottom: -40px;
        left: ${left}%;
        pointer-events: none;
        user-select: none;
        will-change: transform;
      `;

      // Inner wrapper: glowing circle badge with CSS float animation
      const wrapper = document.createElement("div");
      wrapper.style.cssText = `
        position: relative;
        width: ${size + pad * 2}px;
        height: ${size + pad * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle at 40% 35%, ${bg} 0%, transparent 72%);
        display: flex;
        align-items: center;
        justify-content: center;
        will-change: transform, opacity;
        --bday-drift-x: ${driftX}px;
        animation: bday-drift ${duration}s ease-in-out forwards;
        filter: drop-shadow(0 0 ${Math.round(size * 0.45)}px ${glow})
                drop-shadow(0 0 ${Math.round(size * 0.9)}px ${glow.replace(/[\d.]+\)$/, "0.35)")});
      `;

      // Inner emoji span with subtle rotation wobble via keyframe override
      const inner = document.createElement("span");
      inner.textContent = emoji;
      inner.style.cssText = `
        font-size: ${size}px;
        line-height: 1;
        display: block;
        animation: bday-fe-wobble ${(duration * 0.6).toFixed(1)}s ease-in-out infinite alternate;
        --r1: ${rot1}deg;
        --r2: ${rot2}deg;
      `;
      wrapper.appendChild(inner);
      physics.appendChild(wrapper);
      container.appendChild(physics);

      const item: ActiveElem = {
        physics,
        wrapper,
        inner,
        rx: 0,
        ry: 0,
        removed: false,
        timeoutId: null,
      };
      activeElemsRef.current.push(item);

      item.timeoutId = setTimeout(() => {
        removeItem(item, false);
      }, duration * 1000);
    };

    // Inject wobble keyframe once
    const styleId = "bday-fe-style";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = `
        @keyframes bday-fe-wobble {
          0%   { transform: rotate(var(--r1, -12deg)) scale(1);    }
          100% { transform: rotate(var(--r2,  12deg)) scale(1.08); }
        }
      `;
      document.head.appendChild(s);
    }

    intervalRef.current = setInterval(spawn, 2200);
    spawn(); // spawn one immediately

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("touchstart", onTouchStart);
      activeElemsRef.current = [];
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
