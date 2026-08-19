"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * One switch that stops every looping decoration on the page — the tech
 * marquee, the falling petals and the drifting blobs.
 *
 * WCAG 2.2.2 wants a mechanism the visitor can reach on the page itself for
 * anything that moves for more than five seconds; an OS-level
 * prefers-reduced-motion setting is honoured everywhere here, but it is not
 * that mechanism. The marquee's old `:focus-within` pause could never fire —
 * its container is aria-hidden with nothing focusable inside it — so a touch or
 * keyboard visitor previously had no way to stop anything.
 *
 * The flag is a tiny external store rather than component state: the server and
 * the hydrating client both read "playing", so the markup never disagrees with
 * itself, and the choice is remembered per browser like the sound toggle.
 * landing-page.tsx turns it into `data-motion` on #landing-root, and the CSS
 * there does the actual pausing.
 */

const STORAGE_KEY = "mpd-landing-motion";

const listeners = new Set<() => void>();
let cachedPaused: boolean | null = null;

function readStored(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "paused";
  } catch {
    // Private mode / blocked storage: keep the page as it was designed.
    return false;
  }
}

function isPaused(): boolean {
  cachedPaused ??= readStored();
  return cachedPaused;
}

/** The server render — and the hydrating client render — always see motion. */
function isPausedOnServer(): boolean {
  return false;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setPausedStored(next: boolean) {
  cachedPaused = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "paused" : "playing");
  } catch {
    // Not being able to remember the choice is not a reason to refuse it.
  }
  listeners.forEach((listener) => listener());
}

export function useMotionPaused(): boolean {
  return useSyncExternalStore(subscribe, isPaused, isPausedOnServer);
}

/** The one visible control for every looping animation on the page. */
export function MotionPauseToggle({ className }: { className?: string }) {
  const paused = useMotionPaused();
  const toggle = useCallback(() => setPausedStored(!isPaused()), []);
  const label = paused ? "Start the animations" : "Pause the animations";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={paused}
      aria-label={label}
      title={label}
      className={cn(
        "focus-visible:ring-ring/50 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-(--line) bg-white/70 text-teal-700 shadow-(--sh-xs) backdrop-blur transition-colors outline-none hover:bg-white focus-visible:ring-3",
        className,
      )}
    >
      {paused ? (
        <Play className="size-5" aria-hidden="true" />
      ) : (
        <Pause className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
