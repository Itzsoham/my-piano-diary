"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Volume2, VolumeX } from "lucide-react";

import { playMeow, setMeowMuted } from "@/lib/meow-sound";
import { cn } from "@/lib/utils";

/**
 * Landing-page sound. A marketing page that makes noise you did not ask for is
 * rude, so this is OFF by default, remembered per browser, and every play call
 * is a no-op until the visitor flips the toggle. The notes are synthesized in
 * the browser rather than shipped as audio files — a landing page about a piano
 * diary should not cost 300kB of samples to say "ping".
 *
 * The AudioContext is built lazily on the first gesture; Chrome refuses to
 * start one before the page has been interacted with.
 */

const STORAGE_KEY = "mpd-landing-sound";

type SoundApi = {
  enabled: boolean;
  toggle: () => void;
  playNote: (semitonesFromA4: number) => void;
  playChord: (semitones: number[]) => void;
  meow: () => void;
};

function noop() {
  // Default context value: silent, so a stray <SoundToggle /> outside the
  // provider degrades to a dead button instead of crashing the page.
}

const SoundContext = createContext<SoundApi>({
  enabled: false,
  toggle: noop,
  playNote: noop,
  playChord: noop,
  meow: noop,
});

/**
 * The on/off flag is a tiny external store rather than component state. It buys
 * two things: `useSyncExternalStore` hands the server render a guaranteed "off"
 * snapshot without a setState-in-effect hydration dance, and the play callbacks
 * can read the live value through `isEnabled()` while staying referentially
 * stable for the whole life of the provider.
 */
const listeners = new Set<() => void>();
let cachedEnabled: boolean | null = null;

function readStored(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    // Private mode / blocked storage: stay off.
    return false;
  }
}

function isEnabled(): boolean {
  cachedEnabled ??= readStored();
  return cachedEnabled;
}

/** The server render — and the hydrating client render — always see silence. */
function isEnabledOnServer(): boolean {
  return false;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setEnabledStored(next: boolean) {
  cachedEnabled = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // Not being able to remember the choice is not a reason to refuse it.
  }
  listeners.forEach((listener) => listener());
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * One struck note. A triangle fundamental carries the body, a quiet sine an
 * octave up gives it the hammer sparkle, and a lowpass shaves the buzz off the
 * triangle so it reads as a felt piano rather than a synth lead.
 */
function strike(ctx: AudioContext, semitonesFromA4: number, at: number) {
  const freq = 440 * 2 ** (semitonesFromA4 / 12);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2200, at);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.16, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.1);

  const body = ctx.createOscillator();
  body.type = "triangle";
  body.frequency.setValueAtTime(freq, at);

  const shimmer = ctx.createOscillator();
  shimmer.type = "sine";
  shimmer.frequency.setValueAtTime(freq * 2, at);

  const shimmerGain = ctx.createGain();
  shimmerGain.gain.setValueAtTime(0.25, at);

  body.connect(filter);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  const stopAt = at + 1.2;
  body.start(at);
  shimmer.start(at);
  body.stop(stopAt);
  shimmer.stop(stopAt);

  body.onended = () => {
    // Let the graph be collected instead of leaking a node per keypress.
    body.disconnect();
    shimmer.disconnect();
    shimmerGain.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
}

function play(semitones: number[], stagger: number) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    semitones.forEach((s, i) => strike(ctx, s, now + i * stagger));
  } catch {
    // Locked-down browsers, no output device, an exhausted context — none of
    // it is worth an error boundary on a landing page.
  }
}

export function SoundProvider({ children }: { children: ReactNode }) {
  // Reads "off" on the server and during hydration, then re-renders with the
  // remembered choice — so the markup never disagrees with itself.
  const enabled = useSyncExternalStore(subscribe, isEnabled, isEnabledOnServer);

  // Mochi meows all over the app; on the landing page she answers to this
  // toggle instead. Cleanup un-mutes her so the rest of the app is unaffected.
  useEffect(() => {
    setMeowMuted(!enabled);
    return () => setMeowMuted(false);
  }, [enabled]);

  const toggle = useCallback(() => {
    const next = !isEnabled();
    setEnabledStored(next);
    // Answer the click with a note so "on" is audibly different from "off".
    if (next) play([3], 0);
  }, []);

  const playNote = useCallback((semitonesFromA4: number) => {
    if (!isEnabled()) return;
    play([semitonesFromA4], 0);
  }, []);

  const playChord = useCallback((semitones: number[]) => {
    if (!isEnabled()) return;
    play(semitones, 0.055);
  }, []);

  const meow = useCallback(() => {
    if (!isEnabled()) return;
    playMeow();
  }, []);

  const value = useMemo<SoundApi>(
    () => ({ enabled, toggle, playNote, playChord, meow }),
    [enabled, toggle, playNote, playChord, meow],
  );

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
}

export function useSound(): SoundApi {
  return useContext(SoundContext);
}

/** The one visible control for every sound on the page. */
export function SoundToggle({ className }: { className?: string }) {
  const { enabled, toggle } = useSound();
  const label = enabled ? "Turn sound off" : "Turn sound on";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      className={cn(
        "focus-visible:ring-ring/50 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-(--line) bg-white/70 text-teal-700 shadow-(--sh-xs) backdrop-blur transition-colors outline-none hover:bg-white focus-visible:ring-3",
        className,
      )}
    >
      {enabled ? (
        <Volume2 className="size-5" aria-hidden="true" />
      ) : (
        <VolumeX className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
