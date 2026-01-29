"use client";

import * as React from "react";
import { LayoutDashboard, ListOrdered, Users, Music } from "lucide-react";

import { NavMain } from "@/app/(root)/_components/nav-main";
import { NavUser } from "@/app/(root)/_components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { APP_CONFIG } from "@/config/app-config";
import Link from "next/link";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
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
      title: "Calendar",
      url: "/calendar",
      icon: ListOrdered,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="md:h-12">
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    src="/logo.png"
                    alt="App Logo"
                    width={40}
                    height={40}
                    className="size-full object-contain"
                    priority
                    unoptimized
                  />
                </div>
                <div className="grid flex-1 text-left text-base leading-tight">
                  <span className="text-sidebar-foreground truncate">
                    {APP_CONFIG.name}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
