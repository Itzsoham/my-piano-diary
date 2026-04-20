"use client";

import { Bell, LogOut, Sparkles, User } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUserStore } from "@/store/use-user-store";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

export function NavUser() {
  const { isMobile, setOpenMobile } = useSidebar();
  const { user: storeUser, clearUser } = useUserStore();
  const { data: session, status } = useSession();

  // Prefer store user, fallback to session user
  const user =
    storeUser ??
    (session?.user
      ? {
          id: (session.user as { id: string }).id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }
      : null);

  if (status === "loading") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="bg-muted/40 flex items-center gap-2 rounded-xl px-2 py-2 text-left text-sm">
            <div className="bg-sidebar-accent h-8 w-8 animate-pulse rounded-lg" />
            <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
              <div className="bg-sidebar-accent h-3.5 w-24 animate-pulse rounded" />
              <div className="bg-sidebar-accent h-3 w-32 animate-pulse rounded" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Final check - if we are authenticated but have no user data yet
  const effectiveUser =
    user ??
    (status === "authenticated"
      ? {
          name: session?.user?.name ?? "User",
          email: session?.user?.email ?? "",
          image: session?.user?.image ?? null,
        }
      : null);

  if (!effectiveUser) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
      clearUser();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out. Please try again.");
      console.error("Logout error:", error);
    }
  };

  const userDisplayName = effectiveUser.name ?? "User";
  const userEmail = effectiveUser.email ?? "";
  const userImage = "image" in effectiveUser ? (effectiveUser.image ?? "") : "";
  const initials = userDisplayName.slice(0, 2).toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-auto rounded-xl border border-pink-100/60 bg-pink-50/40 px-2 py-2 transition-all hover:border-pink-200/60 hover:bg-pink-50/60 data-[state=open]:bg-pink-50/80"
            >
              <Avatar className="h-8 w-8 rounded-lg border border-pink-100">
                <AvatarImage src={userImage} alt={userDisplayName} />
                <AvatarFallback className="bg-primary/10 text-primary rounded-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold text-rose-950">
                  {userDisplayName}
                </span>
                <span className="truncate text-[11px] font-normal text-pink-400/80">
                  {userEmail}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-60 overflow-hidden rounded-2xl border border-pink-100/80 bg-white p-1.5 shadow-lg shadow-pink-100/40"
            side={isMobile ? "bottom" : "top"}
            align="start"
            sideOffset={8}
          >
            {/* User header */}
            <div className="mb-1.5 flex items-center gap-3 rounded-xl bg-pink-50/60 px-3 py-2.5">
              <Avatar className="h-9 w-9 rounded-xl border border-pink-100">
                <AvatarImage src={userImage} alt={userDisplayName} />
                <AvatarFallback className="bg-primary/10 text-primary rounded-xl text-sm font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold text-rose-950">
                  {userDisplayName}
                </span>
                <span className="truncate text-[11px] text-pink-400/80">
                  {userEmail}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator className="my-1 bg-pink-100/60" />
            <DropdownMenuGroup className="space-y-0.5">
              <DropdownMenuItem asChild>
                <Link
                  href="/profile"
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-pink-50 focus:bg-pink-50"
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  <User className="size-4 text-pink-500" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-pink-50 focus:bg-pink-50">
                <Bell className="size-4 text-pink-500" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/updates"
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-pink-50 focus:bg-pink-50"
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  <Sparkles className="size-4 text-pink-500" />
                  Updates
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1 bg-pink-100/60" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 focus:bg-red-50"
            >
              <LogOut className="size-4 text-red-500" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
