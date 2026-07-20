"use client";

import * as React from "react";

import { Blossom } from "@/components/blossom/blossom";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value?: number | null;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  showLabel?: boolean;
  align?: "left" | "center";
  className?: string;
};

const sizePx: Record<NonNullable<StarRatingProps["size"]>, number> = {
  sm: 18,
  md: 21,
  lg: 27,
};

export const difficultyScale: Record<
  number,
  { title: string; label: string; description: string }
> = {
  1: {
    title: "Very Easy",
    label: "🍼 Beginner Melody",
    description: "Perfect for first steps on the piano.",
  },
  2: {
    title: "Easy",
    label: "🌸 Gentle Practice",
    description: "Simple coordination and smooth rhythm.",
  },
  3: {
    title: "Intermediate",
    label: "🎶 Confident Player",
    description: "Requires steady tempo and control.",
  },
  4: {
    title: "Advanced",
    label: "🔥 Performance Ready",
    description: "Strong technique and expression needed.",
  },
  5: {
    title: "Expert",
    label: "👑 Virtuoso Level",
    description: "Only for serious performers.",
  },
};

export function StarRating({
  value,
  onChange,
  max = 5,
  size = "md",
  readOnly = false,
  showLabel = false,
  align = "left",
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const activeValue = hovered ?? value ?? 0;
  const scaleEntry = difficultyScale[value ?? 1];
  const label = scaleEntry?.label;

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        align === "center" ? "items-center" : "items-start",
        className,
      )}
      role="radiogroup"
      aria-label="Star rating"
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: max }).map((_, index) => {
          const starValue = index + 1;
          const isActive = starValue <= activeValue;
          const isMax = value === max && isActive;

          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={starValue === (value ?? 0)}
              aria-label={`${starValue} blossom${starValue === 1 ? "" : "s"}`}
              className={cn(
                "grid place-items-center rounded-full transition-transform duration-200",
                readOnly ? "cursor-default" : "cursor-pointer hover:scale-110",
                isActive
                  ? isMax
                    ? "text-pink-700 drop-shadow-[0_0_6px_rgba(201,79,124,0.35)]"
                    : "text-pink-600"
                  : "text-pink-400",
              )}
              onClick={() => !readOnly && onChange?.(starValue)}
              onMouseEnter={() => !readOnly && setHovered(starValue)}
              onMouseLeave={() => !readOnly && setHovered(null)}
              disabled={readOnly}
            >
              <Blossom size={sizePx[size]} />
            </button>
          );
        })}
      </div>
      {showLabel && label && (
        <div className="text-muted-foreground mt-2 text-xs font-medium">
          {label}
        </div>
      )}
    </div>
  );
}
