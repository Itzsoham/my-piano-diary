"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListOrdered,
  CalendarDays,
  Users,
  Menu,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

const tabs = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Calendar", url: "/calendar", icon: ListOrdered },
  { title: "Lessons", url: "/lessons", icon: CalendarDays },
  { title: "Students", url: "/students", icon: Users },
];

/**
 * The Blossom Diary bottom tab bar — below lg (1024px), mirrors the
 * sidebar's off-canvas drawer breakpoint. Five tabs: the four most-used
 * destinations plus "More", which opens the same mobile sidebar sheet that
 * carries Pieces / Reports / Payments / the account menu.
 */
export function BottomTabBar() {
  const pathname = usePathname();
  const { setOpenMobile, openMobile } = useSidebar();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 gap-0.5 border-t border-pink-100/80 bg-white/92 px-1.5 pt-1.5 shadow-[0_-8px_24px_-12px_rgba(190,24,93,0.18)] backdrop-blur-md lg:hidden print:hidden"
      style={{
        paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.url || pathname.startsWith(`${tab.url}/`);
        return (
          <Link
            key={tab.url}
            href={tab.url}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-semibold transition-colors",
              isActive
                ? "bg-pink-50 text-pink-700"
                : "text-ink-soft hover:bg-pink-50/60 hover:text-pink-600",
            )}
          >
            <tab.icon className="size-[21px]" aria-hidden="true" />
            <span className="truncate">{tab.title}</span>
          </Link>
        );
      })}
      <button
        type="button"
        aria-label="More navigation — Pieces, Reports, Payments, account"
        aria-expanded={openMobile}
        onClick={() => setOpenMobile(true)}
        className={cn(
          "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-semibold transition-colors",
          openMobile
            ? "bg-pink-50 text-pink-700"
            : "text-ink-soft hover:bg-pink-50/60 hover:text-pink-600",
        )}
      >
        <Menu className="size-[21px]" aria-hidden="true" />
        <span>More</span>
      </button>
    </nav>
  );
}
