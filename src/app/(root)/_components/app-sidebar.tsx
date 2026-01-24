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
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <Image
                  src="/public/logo.png"
                  alt="App Logo"
                  width={30}
                  height={30}
                  className="inline-block"
                />
                <span className="text-base tracking-tight text-gray-800">
                  {APP_CONFIG.name}
                </span>
              </a>
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
