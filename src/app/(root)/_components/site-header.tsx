"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/use-user-store";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDynamicMood(count: number) {
  if (count === 0) return "A calm day ahead 🌷";
  if (count <= 3) return "Busy but beautiful 🎵";
  return "Concert day energy 🎹✨";
}

export function SiteHeader() {
  const { data: session } = useSession();
  const { user: storeUser } = useUserStore();

  const user = storeUser ?? session?.user ?? null;
  const userName = user?.name ?? "Teacher";
  const firstName = userName.split(" ")[0] ?? userName;

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
  const mood = getDynamicMood(todayCount);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-pink-100/80 bg-white/70 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) print:hidden">
      <div className="flex w-full items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1 text-pink-400 transition-colors hover:text-pink-600" />
          <Separator
            orientation="vertical"
            className="mx-1 bg-pink-100 data-[orientation=vertical]:h-4 sm:mx-2"
          />
          <div className="flex flex-col leading-tight">
            <span className="bg-linear-to-r from-pink-500 to-purple-500 bg-clip-text text-sm font-semibold text-transparent">
              {greeting}, {firstName} 🌸
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-muted-foreground text-xl text-[11px] italic">
            {mood}
          </span>
        </div>
      </div>
    </header>
  );
}
