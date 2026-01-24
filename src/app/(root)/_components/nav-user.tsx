"use client";

import {
  CreditCard,
  EllipsisVertical,
  LogOut,
  Bell,
  UserCircle,
} from "lucide-react";
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
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <div className="bg-sidebar-accent h-8 w-8 animate-pulse rounded-lg" />
            <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
              <div className="bg-sidebar-accent h-4 w-24 animate-pulse rounded" />
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

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={userImage} alt={userDisplayName} />
                <AvatarFallback className="rounded-lg">
                  {userDisplayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userDisplayName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {userEmail}
                </span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={userImage} alt={userDisplayName} />
                  <AvatarFallback className="rounded-lg">
                    {userDisplayName.slice(0, 2).toUpperCase()}
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
                <Link href="/profile">
                  <UserCircle />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
