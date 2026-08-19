"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll } from "framer-motion";
import { Github, Menu, X } from "lucide-react";

import { LogoMark } from "@/components/blossom/logo-mark";
import { LINKS, NAV_ITEMS } from "@/components/landing/landing-data";
import { MotionPauseToggle } from "@/components/landing/motion-pause";
import { SoundToggle } from "@/components/landing/sound";
import { cn } from "@/lib/utils";

/**
 * The landing page's top bar. It starts invisible so the hero band reads as
 * one uninterrupted sheet of colour, then fades in a frosted white surface once
 * you have scrolled past the fold — transitioned rather than switched, because
 * a bar that snaps opaque at 24px looks like a rendering bug.
 *
 * The hairline under it is the read-progress bar: on a page this long, it is
 * the only honest answer to "how much more of this is there?".
 */

const EASE = [0.22, 1, 0.36, 1] as const;

const PRIMARY_BUTTON =
  "focus-visible:ring-ring/50 inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-(--sh-pink) transition-transform outline-none hover:-translate-y-0.5 focus-visible:ring-3";

const GHOST_BUTTON =
  "text-ink-soft focus-visible:ring-ring/50 inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors outline-none hover:bg-white/70 hover:text-pink-700 focus-visible:ring-3";

export function LandingNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the sheet and hands focus back to the button that opened it —
  // the panel unmounts, so without this focus falls to <body> and the visitor
  // has to tab from the top of the document again. Nothing else is trapped: the
  // panel is a plain list in the flow, not a modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      toggleRef.current?.focus();
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      <div
        className={cn(
          "relative transition-[background-color,box-shadow,border-color] duration-300 ease-out",
          scrolled || open
            ? "border-b border-(--line) bg-white/80 shadow-(--sh-sm) backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:h-18 lg:px-8"
        >
          <Link
            href="/"
            className="focus-visible:ring-ring/50 flex shrink-0 items-center gap-2.5 rounded-2xl outline-none focus-visible:ring-3"
          >
            <LogoMark variant="sakura-keys" size={38} className="shrink-0" />
            <span className="leading-tight">
              <span className="text-ink block font-serif text-base font-bold sm:text-lg">
                My Piano Diary
              </span>
              <span className="block text-[11px] font-medium text-teal-700">
                studio diary
              </span>
            </span>
          </Link>

          <ul className="mx-auto hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-ink-soft after:bg-bubblegum focus-visible:ring-ring/50 relative inline-flex h-11 items-center rounded-full px-3 text-sm font-semibold transition-colors outline-none after:absolute after:inset-x-3 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:transition-transform after:duration-300 after:content-[''] hover:text-pink-700 hover:after:scale-x-100 focus-visible:ring-3 focus-visible:after:scale-x-100"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <SoundToggle />
            <MotionPauseToggle />

            <a
              href={LINKS.github}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="View the source on GitHub"
              title="View the source on GitHub"
              className="focus-visible:ring-ring/50 hidden h-11 w-11 items-center justify-center rounded-full border border-(--line) bg-white/70 text-teal-700 shadow-(--sh-xs) backdrop-blur transition-colors outline-none hover:bg-white focus-visible:ring-3 sm:inline-flex"
            >
              <Github className="size-5" aria-hidden="true" />
            </a>

            {isLoggedIn ? (
              <Link
                href={LINKS.dashboard}
                className={cn(PRIMARY_BUTTON, "hidden lg:inline-flex")}
                style={{ background: "var(--grad-pink)" }}
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href={LINKS.demo}
                  className={cn(GHOST_BUTTON, "hidden lg:inline-flex")}
                >
                  Log in
                </Link>
                <Link
                  href={LINKS.demo}
                  className={cn(PRIMARY_BUTTON, "hidden lg:inline-flex")}
                  style={{ background: "var(--grad-pink)" }}
                >
                  Try the demo
                </Link>
              </>
            )}

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="landing-menu"
              aria-label={open ? "Close the menu" : "Open the menu"}
              className="focus-visible:ring-ring/50 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-(--line) bg-white/70 text-teal-700 shadow-(--sh-xs) backdrop-blur transition-colors outline-none hover:bg-white focus-visible:ring-3 lg:hidden"
            >
              {open ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>

        {/* How far down the page you are. Decorative — the scrollbar already
            says this to assistive tech. */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left"
          style={{ scaleX: scrollYProgress, background: "var(--grad-brand)" }}
        />
      </div>

      {/* The wrapper is always in the DOM so the toggle's `aria-controls` never
          dangles: while the sheet is shut this is an empty, zero-height div and
          `aria-expanded=false` is the whole story. Only the panel inside it
          comes and goes. */}
      <div id="landing-menu" className="lg:hidden">
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="landing-menu-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.26, ease: EASE }}
              className="overflow-hidden border-b border-(--line) bg-white/95 shadow-(--sh) backdrop-blur-xl"
            >
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 pt-2 pb-5 sm:px-6">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="text-ink focus-visible:ring-ring/50 flex h-12 items-center rounded-2xl px-3 text-base font-semibold transition-colors outline-none hover:bg-pink-50 hover:text-pink-700 focus-visible:ring-3"
                  >
                    {item.label}
                  </a>
                ))}

                <a
                  href={LINKS.github}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => setOpen(false)}
                  className="text-ink focus-visible:ring-ring/50 flex h-12 items-center gap-2 rounded-2xl px-3 text-base font-semibold transition-colors outline-none hover:bg-pink-50 hover:text-pink-700 focus-visible:ring-3"
                >
                  <Github className="size-4.5" aria-hidden="true" />
                  Source on GitHub
                </a>

                <div className="mt-2 grid gap-2">
                  {isLoggedIn ? (
                    <Link
                      href={LINKS.dashboard}
                      onClick={() => setOpen(false)}
                      className={cn(PRIMARY_BUTTON, "w-full")}
                      style={{ background: "var(--grad-pink)" }}
                    >
                      Go to Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={LINKS.demo}
                        onClick={() => setOpen(false)}
                        className={cn(PRIMARY_BUTTON, "w-full")}
                        style={{ background: "var(--grad-pink)" }}
                      >
                        Try the demo
                      </Link>
                      <Link
                        href={LINKS.demo}
                        onClick={() => setOpen(false)}
                        className={cn(
                          GHOST_BUTTON,
                          "w-full border border-(--line) bg-white/70",
                        )}
                      >
                        Log in
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
