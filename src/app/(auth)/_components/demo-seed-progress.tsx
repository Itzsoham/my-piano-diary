"use client";

import { Check, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { DEMO_STEPS, type DemoStepKey } from "@/server/demo/demo-data";

export type StepState = "pending" | "running" | "done" | "error";

export function DemoSeedProgress({
  states,
  results,
  error,
}: {
  states: Record<DemoStepKey, StepState>;
  results: Partial<Record<DemoStepKey, string>>;
  error?: string | null;
}) {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-live="polite"
      aria-busy={Object.values(states).some((s) => s === "running")}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium">Building your demo studio…</p>
        <p className="text-muted-foreground text-xs">
          Creating a fresh studio with students, lessons and payments. This
          takes a few seconds.
        </p>
      </div>

      <ul className="space-y-2.5">
        {DEMO_STEPS.map((step) => {
          const state = states[step.key];
          return (
            <li key={step.key} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  state === "done" &&
                    "border-emerald-500 bg-emerald-500 text-white",
                  state === "running" && "border-primary text-primary",
                  state === "error" &&
                    "border-destructive bg-destructive text-white",
                  state === "pending" && "border-muted-foreground/25",
                )}
              >
                {state === "done" && <Check className="size-3" />}
                {state === "running" && (
                  <Loader2 className="size-3 animate-spin" />
                )}
                {state === "error" && <X className="size-3" />}
              </span>

              <span
                className={cn(
                  "flex-1 transition-colors",
                  state === "pending" && "text-muted-foreground/60",
                  state === "running" && "font-medium",
                  state === "done" && "text-muted-foreground",
                )}
              >
                {step.label}
              </span>

              {results[step.key] && (
                <span className="text-muted-foreground text-xs tabular-nums">
                  {results[step.key]}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {error && (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
