// A real cat meow — public/sounds/meow.mp3 ("Cartoon little cat meow",
// Mixkit Sound Effects Free License — free for commercial/personal use, no
// attribution required). Synthesizing one from oscillators kept coming out
// sounding like a siren, not a cat.
//
// Preloaded once and cloned per play so rapid repeat clicks (petting Mochi
// over and over) overlap instead of cutting each other off.

const SRC = "/sounds/meow.mp3";

let template: HTMLAudioElement | null = null;

function getTemplate(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  template ??= new Audio(SRC);
  return template;
}

export function playMeow() {
  const base = getTemplate();
  if (!base) return;

  const instance = base.cloneNode(true) as HTMLAudioElement;
  instance.volume = 0.7;
  void instance.play().catch(() => {
    // Autoplay can be blocked before the user has interacted with the page
    // at all; a click on Mochi counts as interaction, so this only matters
    // for the very first paint. Fail silently either way.
  });
}
