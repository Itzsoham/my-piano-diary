"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ClipboardCheck,
  Flower2,
  Globe2,
  HeartHandshake,
  Music4,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Blossom, Petal } from "@/components/blossom/blossom";
import { FEATURES } from "@/components/landing/landing-data";
import { RevealStagger, useRevealItem } from "@/components/landing/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import { cn } from "@/lib/utils";

/**
 * The nine things the app actually does, one card each.
 *
 * Icons are resolved through an explicit lookup rather than a dynamic import so
 * the bundle only ever carries these nine glyphs and a typo in the data file is
 * a type error at the call site instead of a blank square at runtime.
 *
 * Each card's accent (pink / mint / sand) drives three things at once — the
 * badge fill, the radial glow that fades in on hover, and the oversized
 * ornament bleeding out of the bottom corner — so a scan down the grid reads as
 * a rhythm rather than nine identical boxes.
 */

const ICONS: Record<string, LucideIcon> = {
  CalendarDays,
  ClipboardCheck,
  Flower2,
  Globe2,
  HeartHandshake,
  Music4,
  Trophy,
  Users,
  Wallet,
};

type Accent = (typeof FEATURES)[number]["accent"];

const ACCENTS: Record<
  Accent,
  {
    badge: string;
    badgeStyle?: CSSProperties;
    glow: string;
    ornament: string;
  }
> = {
  pink: {
    badge: "text-white",
    badgeStyle: { background: "var(--grad-pink)" },
    glow: "radial-gradient(120% 90% at 12% 0%, var(--pink-100), transparent 62%)",
    ornament: "text-pink-100",
  },
  mint: {
    badge: "text-mint-ink",
    badgeStyle: { background: "var(--grad-mint)" },
    glow: "radial-gradient(120% 90% at 12% 0%, var(--teal-100), transparent 62%)",
    ornament: "text-teal-100",
  },
  sand: {
    badge: "bg-sand-100 text-sand-700",
    glow: "radial-gradient(120% 90% at 12% 0%, var(--sand-100), transparent 62%)",
    ornament: "text-sand-100",
  },
};

export function FeaturesSection() {
  const revealItem = useRevealItem();

  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="features-title"
          eyebrow="Everything in one place"
          title="The whole studio, not just a calendar"
          lead="Who turned up, what they owe and how the lesson actually went are one record here, written once — not three apps you reconcile on a Sunday night."
        />

        <RevealStagger className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => {
            const Icon = ICONS[feature.icon] ?? Flower2;
            const accent = ACCENTS[feature.accent];
            // Alternate the corner ornament so no two neighbours in a row match.
            const Ornament = i % 2 === 0 ? Blossom : Petal;

            return (
              <motion.article
                key={feature.title}
                // Variant children inherit the parent's "hidden" state, so they
                // ship at opacity 0 too and need the same no-JS escape hatch.
                data-reveal=""
                variants={revealItem}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-(--line) bg-white p-6 shadow-(--sh-sm) transition-all duration-300 hover:-translate-y-1 hover:shadow-(--sh-lg)"
              >
                <div
                  aria-hidden="true"
                  style={{ backgroundImage: accent.glow }}
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <Ornament
                  size={96}
                  className={cn(
                    "pointer-events-none absolute -right-4 -bottom-5",
                    accent.ornament,
                  )}
                />

                <div className="relative flex flex-1 flex-col">
                  <div
                    style={accent.badgeStyle}
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-2xl shadow-(--sh-xs) transition-transform duration-300 group-hover:scale-110",
                      accent.badge,
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </div>

                  <h3 className="text-ink mt-4 text-base font-bold">
                    {feature.title}
                  </h3>
                  <p className="text-ink-soft mt-2 text-sm leading-relaxed">
                    {feature.body}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </RevealStagger>
      </div>
    </section>
  );
}
