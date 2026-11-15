"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut, QrCode, Video } from "lucide-react";
import { signOut } from "next-auth/react";

import { Blossom } from "@/components/blossom/blossom";
import { LogoMark } from "@/components/blossom/logo-mark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface PortalHeaderProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const navItems = [
  { label: "Overview", href: "/portal", icon: Home },
  { label: "Tuition & QR", href: "/portal/payments", icon: QrCode },
  { label: "Practice", href: "/portal/videos", icon: Video },
];

export function PortalHeader({ user }: PortalHeaderProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const initials = (user.name ?? "Parent")
    .split(/\s+/)
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-pink-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/portal" className="flex items-center gap-2.5">
          <LogoMark variant="blossom" size={32} />
          <div className="flex flex-col">
            <span className="font-serif text-base font-normal tracking-tight text-ink flex items-center gap-1.5">
              Parent Portal
              <Blossom size={13} className="text-bubblegum" />
            </span>
            <span className="text-[10px] text-pink-400 font-medium">
              My Piano Diary
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/portal"
                ? pathname === "/portal"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-pink-100 text-pink-800"
                    : "text-ink-soft hover:bg-pink-50 hover:text-ink",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full p-1 hover:bg-pink-50 transition-colors focus:outline-hidden"
              >
                <Avatar className="size-8 border border-pink-200">
                  <AvatarImage src={user.image ?? ""} />
                  <AvatarFallback className="bg-pink-100 text-[11px] font-bold text-pink-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-xs font-medium text-ink max-w-[120px] truncate">
                  {user.name ?? "Parent"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl border-pink-200 p-1.5">
              <div className="px-2.5 py-2">
                <p className="text-xs font-semibold text-ink truncate">
                  {user.name ?? "Parent"}
                </p>
                <p className="text-[11px] text-ink-soft truncate font-mono">
                  {user.email ?? ""}
                </p>
              </div>
              <DropdownMenuSeparator className="bg-pink-100" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="rounded-xl text-xs text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer"
              >
                <LogOut className="mr-2 size-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Subnav Strip */}
      <div className="flex sm:hidden border-t border-pink-100/60 bg-white/50 px-2 py-1 justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-full transition-colors",
                isActive
                  ? "bg-pink-100 text-pink-800 font-semibold"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              <Icon className="size-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
