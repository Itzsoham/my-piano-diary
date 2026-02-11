"use client";

import * as React from "react";
import { LayoutDashboard, ListOrdered, Users, Music } from "lucide-react";

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
} from "@/components/ui/sidebar";
import Image from "next/image";
import { APP_CONFIG } from "@/config/app-config";
import Link from "next/link";

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
      title: "Students",
      url: "/students",
      icon: Users,
    },
    {
      title: "Pieces",
      url: "/pieces",
      icon: Music,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="print:hidden" collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-sidebar-border border-b pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="transition-none hover:bg-transparent md:h-14"
            >
              <Link href="/dashboard">
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
                  <span className="text-primary truncate text-base font-bold">
                    {APP_CONFIG.name}
                  </span>
                  <span className="text-muted-foreground truncate text-xs font-normal">
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
