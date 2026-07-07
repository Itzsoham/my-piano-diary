import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface RefreshOverlayProps {
  /** Show the indicator while a background refetch is in flight. */
  active: boolean;
  className?: string;
  label?: string;
}

/**
 * Subtle "updating" pill for lists that keep previous data on screen while a
 * filter change refetches (React Query `placeholderData: keepPreviousData`).
 * Pin it to a `relative` container; it fades in/out without shifting layout.
 */
export function RefreshOverlay({
  active,
  className,
  label = "Updating",
}: RefreshOverlayProps) {
  return (
    <div
      aria-hidden={!active}
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-full border border-pink-100 bg-white/90 px-3 py-1 text-xs font-medium text-pink-600 shadow-sm backdrop-blur-sm transition-opacity duration-200",
        active ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      {label}
    </div>
  );
}
