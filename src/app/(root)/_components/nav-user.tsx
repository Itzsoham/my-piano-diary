"use client";

import { Bell, LogOut, Sparkles, User } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  const { isMobile } = useSidebar();
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
              className="bg-muted/40 data-[state=open]:bg-muted/50 hover:bg-muted/50 h-auto rounded-xl px-2 py-2 transition-all"
            >
              <Avatar className="h-8 w-8 rounded-lg border-transparent">
                <AvatarImage src={userImage} alt={userDisplayName} />
                <AvatarFallback className="bg-primary/10 text-primary rounded-lg font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium">{userDisplayName}</span>
                <span className="text-muted-foreground truncate text-xs font-normal">
                  {userEmail}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="border-border/50 w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl shadow-sm"
            side={isMobile ? "bottom" : "top"}
            align="start"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={userImage} alt={userDisplayName} />
                  <AvatarFallback className="bg-primary/10 text-primary rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {userDisplayName}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {userEmail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href="/profile"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <User className="size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex cursor-pointer items-center gap-2">
                <Bell className="size-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/updates"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Sparkles className="size-4" />
                  Updates
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-2 text-red-500 hover:text-red-500"
            >
              <LogOut className="size-4 text-red-500" />
              <span className="text-red-500 hover:text-red-600">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
