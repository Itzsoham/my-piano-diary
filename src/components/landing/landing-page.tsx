"use client";

import { CtaSection } from "@/components/landing/cta-section";
import { FaqSection } from "@/components/landing/faq-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNav } from "@/components/landing/landing-nav";
import { MochiSection } from "@/components/landing/mochi-section";
import { useMotionPaused } from "@/components/landing/motion-pause";
import { PetalField } from "@/components/landing/petal-field";
import { ShowcaseScoring } from "@/components/landing/showcase-scoring";
import { ShowcaseStudio } from "@/components/landing/showcase-studio";
import { SoundProvider } from "@/components/landing/sound";
import { StatsStrip } from "@/components/landing/stats-strip";
import { TechMarquee } from "@/components/landing/tech-marquee";

/**
 * The whole marketing page, assembled in one place so the running order is
 * readable at a glance: promise, proof, product, process, objections, credits.
 *
 * It is a client component because SoundProvider has to wrap every section —
 * the hero keys, the scoring blossoms and Mochi all play through one shared
 * AudioContext, and a provider that only covered part of the page would leave
 * half the sound controls silent. `isLoggedIn` is resolved on the server in
 * page.tsx and passed down, so nav, hero and CTA can say "Go to Dashboard"
 * instead of "Try the demo" without any of them fetching a session themselves.
 *
 * `id="landing-root"` is load-bearing: globals.css scopes the page's smooth
 * anchor scrolling to `html:has(#landing-root)` so the app shell is untouched.
 *
 * `isolate` is load-bearing too. This element paints the opaque `.bg-app` wash,
 * and PetalField sits at `-z-10`; without a stacking context here the petals
 * would be painted into the root context *underneath* that wash and never be
 * seen at all. Isolating puts them back where they belong — above the wash,
 * below every section.
 */

/**
 * Two page-wide motion rules that have nowhere else to live.
 *
 * The reveal rule is the no-JS safety net: framer-motion bakes its `initial`
 * into the SSR markup, so every `data-reveal` block ships as `opacity: 0` and
 * only becomes visible once the viewport observer fires. `scripting: none`
 * covers modern engines; the <noscript> twin below covers the rest.
 *
 * The pause rule is the WCAG 2.2.2 mechanism. The attribute selector catches
 * every Tailwind `animate-*` utility, including the arbitrary
 * `animate-[drift_28s...]` ones, and the two named loops are listed by hand.
 * `.rise` is deliberately not covered — it fills to opacity 1 and holds, so
 * pausing it mid-flight would hide the hero's own copy.
 */
const PAGE_MOTION_CSS = `
  @media (scripting: none) {
    [data-reveal] { opacity: 1 !important; transform: none !important; }
  }
  #landing-root[data-motion="paused"] [class*="animate-"],
  #landing-root[data-motion="paused"] .pf-petal,
  #landing-root[data-motion="paused"] .mpd-marquee-track {
    animation-play-state: paused !important;
  }
`;

const NOSCRIPT_CSS =
  "<style>[data-reveal]{opacity:1!important;transform:none!important}</style>";

export function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  const motionPaused = useMotionPaused();

  return (
    <SoundProvider>
      <style>{PAGE_MOTION_CSS}</style>
      <noscript dangerouslySetInnerHTML={{ __html: NOSCRIPT_CSS }} />

      <div
        id="landing-root"
        data-motion={motionPaused ? "paused" : "playing"}
        className="bg-app relative isolate min-h-screen overflow-x-clip"
      >
        {/* First focusable element on the page: a keyboard visitor should not
            have to tab through the whole nav to reach the content. */}
        <a
          href="#main"
          className="focus:ring-ring/50 sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:inline-flex focus:h-11 focus:items-center focus:rounded-full focus:bg-pink-600 focus:px-5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-(--sh-pink) focus:ring-3 focus:outline-none"
        >
          Skip to content
        </a>

        <PetalField />
        <LandingNav isLoggedIn={isLoggedIn} />

        <main id="main">
          <LandingHero isLoggedIn={isLoggedIn} />
          <StatsStrip />
          <FeaturesSection />
          <ShowcaseStudio />
          <ShowcaseScoring />
          <HowItWorks />
          <FaqSection />
          <TechMarquee />
          <MochiSection />
          <CtaSection isLoggedIn={isLoggedIn} />
        </main>

        <LandingFooter />
      </div>
    </SoundProvider>
  );
}
