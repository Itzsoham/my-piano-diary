"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/use-user-store";
import { useState, useEffect, useCallback } from "react";

// Mood data structure with categories
const moods = {
  calm: [
    {
      primary: "A calm day ahead 🌷",
      secondary: "Perfect time to plan something beautiful ✨",
    },
    {
      primary: "A quiet studio day 🎼",
      secondary: "Space to reflect and refine 🎹",
    },
    {
      primary: "Peaceful rhythm today 🌸",
      secondary: "Sometimes silence is part of the music.",
    },
    {
      primary: "A soft reset day 🌿",
      secondary: "Prepare for the next masterpiece.",
    },
    {
      primary: "Stillness before the melody 🎵",
      secondary: "Even calm days build greatness.",
    },
  ],
  focused: [
    {
      primary: "A focused teaching day 🎵",
      secondary: "Every student deserves your best 🌷",
    },
    {
      primary: "A steady rhythm today 🎹",
      secondary: "Small progress makes beautiful growth.",
    },
    {
      primary: "A balanced lesson day ✨",
      secondary: "Guide them gently, note by note.",
    },
    {
      primary: "Music in motion today 🎶",
      secondary: "Teaching is art in action.",
    },
    {
      primary: "Intentional and inspired 💗",
      secondary: "Your patience creates harmony.",
    },
  ],
  busy: [
    {
      primary: "Full concert mode 🎹🔥",
      secondary: "Energy high. Focus sharp. Let's go.",
    },
    {
      primary: "A powerful performance day ✨",
      secondary: "You're shaping future musicians.",
    },
    {
      primary: "Studio buzzing with life 🎶🔥",
      secondary: "Today is about momentum.",
    },
    {
      primary: "All keys in motion 🎼⚡",
      secondary: "Busy days build strong results.",
    },
    {
      primary: "High tempo teaching 🎵🔥",
      secondary: "This is where growth accelerates.",
    },
  ],
} as const;

type MoodCategory = keyof typeof moods;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getMoodCategory(count: number): MoodCategory {
  if (count === 0) return "calm";
  if (count <= 3) return "focused";
  return "busy";
}

export function SiteHeader() {
  const { data: session } = useSession();
  const { user: storeUser } = useUserStore();

  const user = storeUser ?? session?.user ?? null;
  const userName = user?.name ?? "Teacher";

  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
  );

  const { data: todayLessons = [] } = api.lesson.getAll.useQuery({
    from: startOfDay,
    to: endOfDay,
  });

  const todayCount = todayLessons.length;
  const greeting = getGreeting();
  const category = getMoodCategory(todayCount);

  const [moodIndex, setMoodIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Set random mood when category changes
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * moods[category].length);
    setMoodIndex(randomIndex);
  }, [category]);

  const changeMood = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);

    // After fade out, change mood and fade in
    setTimeout(() => {
      let newIndex: number;
      do {
        newIndex = Math.floor(Math.random() * moods[category].length);
      } while (newIndex === moodIndex && moods[category].length > 1);

      setMoodIndex(newIndex);

      // Reset animation state after transition
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 150);
  }, [category, moodIndex, isAnimating]);

  const currentMood = moods[category][moodIndex] ?? moods[category][0];

  return (
    <header className="flex h-14 w-full shrink-0 items-center gap-2 border-b border-pink-100/80 bg-white/70 backdrop-blur-md transition-[width,height] ease-linear print:hidden">
      <div className="flex w-full items-center justify-between gap-2 overflow-hidden px-3 sm:px-4 lg:px-6">
        <div className="mr-2 flex min-w-0 flex-1 items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1 shrink-0 text-pink-400 transition-colors hover:text-pink-600" />
          <Separator
            orientation="vertical"
            className="mx-1 shrink-0 bg-pink-100 data-[orientation=vertical]:h-4 sm:mx-2"
          />
          <div className="flex min-w-0 flex-col leading-tight sm:flex-row sm:items-center sm:gap-1">
            <span className="block truncate bg-linear-to-r from-pink-500 to-purple-500 bg-clip-text text-[13px] font-semibold text-transparent sm:text-sm">
              {greeting},
            </span>
            <span className="block truncate bg-linear-to-r from-pink-500 to-purple-500 bg-clip-text text-[13px] font-semibold text-transparent sm:text-sm">
              {userName} ✨
            </span>
          </div>
        </div>

        <div
          onClick={changeMood}
          className="max-w-[55%] min-w-0 shrink-0 cursor-pointer text-right transition-transform select-none hover:scale-[1.02] active:scale-[0.98] sm:max-w-none"
          title="Click to change mood"
        >
          <div
            className={`flex min-w-0 flex-col transition-all duration-300 ease-out ${
              isAnimating
                ? "translate-y-1 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            <span className="block truncate text-[11px] font-medium text-pink-600 sm:text-sm sm:whitespace-normal">
              {currentMood?.primary}
            </span>
            <span className="text-muted-foreground block truncate text-[9px] italic sm:text-[11px]">
              {currentMood?.secondary}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
