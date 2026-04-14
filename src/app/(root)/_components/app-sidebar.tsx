"use client";

import * as React from "react";
import {
  LayoutDashboard,
  ListOrdered,
  Users,
  Music,
  CalendarDays,
  FileText,
  WalletCards,
} from "lucide-react";

import { NavMain } from "@/app/(root)/_components/nav-main";
import { NavUser } from "@/app/(root)/_components/nav-user";
import { NavAction } from "@/app/(root)/_components/nav-action";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { APP_CONFIG } from "@/config/app-config";
import Link from "next/link";
import { useRouter } from "next/navigation";

const data = {
  main: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: ListOrdered,
    },
  ],
  manage: [
    {
      title: "Lessons",
      url: "/lessons",
      icon: CalendarDays,
    },
    {
      title: "Students",
      url: "/students",
      icon: Users,
    },
    {
      title: "Pieces",
      url: "/pieces",
      icon: Music,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: FileText,
    },
    {
      title: "Payments",
      url: "/payments",
      icon: WalletCards,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile, setOpenMobile } = useSidebar();
  const router = useRouter();
  const logoClickRef = React.useRef(0);
  const logoTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    logoClickRef.current += 1;

    if (logoTimerRef.current) clearTimeout(logoTimerRef.current);

    if (logoClickRef.current >= 5) {
      e.preventDefault();
      logoClickRef.current = 0;
      if (isMobile) setOpenMobile(false);
      router.push("/forever");
      return;
    }

    // Reset count if no new click within 3 seconds
    logoTimerRef.current = setTimeout(() => {
      logoClickRef.current = 0;
    }, 3000);
  };

  return (
    <Sidebar
      className="border-r border-pink-100 bg-white backdrop-blur print:hidden"
      collapsible="offcanvas"
      {...props}
    >
      <SidebarHeader className="border-sidebar-border border-b pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="transition-none hover:bg-transparent md:h-14"
            >
              <Link
                href="/dashboard"
                onClick={(e) => {
                  handleLogoClick(e);
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <div className="bg-primary/10 text-primary flex aspect-square size-10 items-center justify-center rounded-lg">
                  <Image
                    src="/logo.png"
                    alt="App Logo"
                    width={40}
                    height={40}
                    className="size-8 object-contain"
                    priority
                    unoptimized
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="text-primary truncate text-base font-semibold">
                    {APP_CONFIG.name}
                  </span>
                  <span className="text-muted-foreground truncate text-xs font-medium">
                    personal teaching space
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="pt-2">
        <NavAction />
        <NavMain label="MAIN" items={data.main} />
        <NavMain label="MANAGE" items={data.manage} />
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border border-t">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
