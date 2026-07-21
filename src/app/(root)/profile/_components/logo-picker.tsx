"use client";

import { Check } from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/blossom/logo-mark";
import { logoOptions, useLogoVariant } from "@/lib/logo-preference";
import { cn } from "@/lib/utils";

/**
 * Lets the teacher pick which brand mark shows in the sidebar and on the
 * sign-in screen — a per-browser preference (see useLogoVariant), not an
 * account field, so there's no server round-trip.
 */
export function LogoPicker() {
  const { variant, setVariant } = useLogoVariant();

  return (
    <div>
      <h4 className="text-ink text-sm font-semibold">App icon</h4>
      <p className="text-ink-soft mt-0.5 text-xs">
        Pick the mark that shows in your sidebar and on the sign-in screen.
      </p>
      <div className="mt-3 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
        {logoOptions.map((option) => {
          const selected = variant === option.variant;
          return (
            <button
              key={option.variant}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setVariant(option.variant);
                toast.success(`${option.label} set as your app icon 🌸`);
              }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all",
                selected
                  ? "border-pink-600 bg-pink-50 shadow-sm ring-2 ring-pink-600/15"
                  : "border-border bg-card/50 opacity-70 hover:border-(--line-pink) hover:opacity-100",
              )}
            >
              <div className="relative">
                <LogoMark variant={option.variant} size={56} />
                {selected && (
                  <span className="bg-pink-600 absolute -top-1 -right-1 grid size-5 place-items-center rounded-full text-white shadow-sm">
                    <Check className="size-3" />
                  </span>
                )}
              </div>
              <span className="text-ink text-sm font-semibold">
                {option.label}
              </span>
              <span className="text-ink-soft text-[11px] leading-snug">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
