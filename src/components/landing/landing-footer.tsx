"use client";

import Link from "next/link";
import { Github, Globe, Mail } from "lucide-react";

import { Squiggle } from "@/components/blossom/blossom";
import { LogoMark } from "@/components/blossom/logo-mark";
import { LINKS, NAV_ITEMS } from "@/components/landing/landing-data";
import { APP_CONFIG } from "@/config/app-config";

/**
 * lucide dropped its brand glyphs, so X gets drawn here rather than faked with
 * a letter. Decorative — the accessible name lives on the link around it.
 */
function XMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        fill="currentColor"
        d="M18.9 2.6h3.3l-7.2 8.2 8.5 11.2h-6.7l-5.2-6.9-6 6.9H2.3l7.7-8.8L1.9 2.6h6.8l4.7 6.3 5.5-6.3Zm-1.2 17.5h1.8L7.4 4.4H5.4l12.3 15.7Z"
      />
    </svg>
  );
}

/* size-11 on a phone, size-9 from sm: this is the row of icon-only targets at
   the very bottom of a long page, which is exactly where thumbs land. */
const SOCIAL_CLASS =
  "focus-visible:ring-ring/50 text-ink-soft grid size-11 place-items-center rounded-full border border-(--line) transition-colors outline-none hover:bg-pink-50 hover:text-pink-700 focus-visible:ring-3 sm:size-9";

/** Column 3 — the two places a visitor can actually start. */
const GET_STARTED = [
  { label: "Try the demo", href: LINKS.demo },
  { label: "Create an account", href: LINKS.register },
  { label: "Dashboard", href: LINKS.dashboard },
] as const;

/**
 * Column 4 — the repo and its docs. Every entry here leaves the app, the two
 * mockup pages included: they are static files served out of /public. The
 * render below hard-codes target/rel on that basis, so an in-app route does not
 * belong in this column — put it in GET_STARTED, which routes with next/link.
 */
const PROJECT_LINKS = [
  { label: "Source on GitHub", href: LINKS.github },
  { label: "Project state doc", href: LINKS.docsProjectState },
  { label: "Roadmap", href: LINKS.docsFutureFeatures },
  { label: "Known issues", href: LINKS.docsIssues },
  { label: "Design mockups", href: LINKS.mockups },
  { label: "Styleguide", href: LINKS.styleguide },
] as const;

const LINK_CLASS =
  "focus-visible:ring-ring/50 text-ink-soft inline-flex min-h-11 items-center rounded-md text-sm transition-colors outline-none hover:text-pink-700 focus-visible:ring-3 sm:min-h-9";

const HEADING_CLASS =
  "text-ink text-xs font-semibold tracking-[0.16em] uppercase";

/**
 * The page's last word. Four columns on large screens, stacked on a phone, with
 * every link the rest of the page offers gathered in one place — someone who
 * scrolled past the CTA still needs a way into the demo, the repo and the docs.
 */
export function LandingFooter() {
  return (
    <footer className="relative isolate overflow-hidden border-t border-(--line) bg-white">
      {/* Oversized squiggle along the very bottom — texture only. */}
      <Squiggle className="pointer-events-none absolute inset-x-0 -bottom-2 -z-10 h-20 w-full text-pink-100" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-4 lg:gap-8">
          <div className="lg:pr-6">
            <div className="flex items-center gap-3">
              <LogoMark variant="diary-keys" size={44} />
              <span className="text-ink font-serif text-lg font-bold">
                My Piano Diary
              </span>
            </div>
            <p className="text-ink-soft mt-3 max-w-xs text-sm leading-relaxed">
              A studio diary for one piano teacher — lessons, attendance,
              blossom scores and the money, all in your own timezone.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <a
                href={LINKS.github}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="My Piano Diary on GitHub"
                className={SOCIAL_CLASS}
              >
                <Github className="size-4" aria-hidden="true" />
              </a>
              <a
                href={LINKS.x}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Soham on X"
                className={SOCIAL_CLASS}
              >
                <XMark className="size-4" />
              </a>
              <a
                href={LINKS.portfolio}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Soham's portfolio"
                className={SOCIAL_CLASS}
              >
                <Globe className="size-4" aria-hidden="true" />
              </a>
              <a
                href={LINKS.email}
                aria-label="Email Soham"
                className={SOCIAL_CLASS}
              >
                <Mail className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <nav aria-labelledby="footer-product">
            <h2 id="footer-product" className={HEADING_CLASS}>
              Product
            </h2>
            <ul className="mt-3 flex flex-col">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={LINK_CLASS}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-start">
            <h2 id="footer-start" className={HEADING_CLASS}>
              Get started
            </h2>
            <ul className="mt-3 flex flex-col">
              {GET_STARTED.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={LINK_CLASS}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-project">
            <h2 id="footer-project" className={HEADING_CLASS}>
              Project
            </h2>
            <ul className="mt-3 flex flex-col">
              {PROJECT_LINKS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={LINK_CLASS}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-(--line) pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-ink-soft text-sm">{APP_CONFIG.copyright}</p>
            <p className="text-ink-soft text-sm">
              Made with <span aria-hidden="true">🌸</span> by{" "}
              <a
                href={LINKS.portfolio}
                target="_blank"
                rel="noreferrer noopener"
                className="focus-visible:ring-ring/50 rounded-md font-semibold text-pink-700 underline decoration-pink-200 underline-offset-4 outline-none hover:decoration-pink-400 focus-visible:ring-3"
              >
                Soham
              </a>
            </p>
          </div>
          <p className="text-ink-soft mt-2 text-xs">
            Built with Next.js 16 · tRPC · Prisma
          </p>
        </div>
      </div>
    </footer>
  );
}
