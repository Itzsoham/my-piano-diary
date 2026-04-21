"use client";

import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  label,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
  label?: string;
}) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel className="font-semibold tracking-widest text-pink-700">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="gap-2">
          {items.map((item) => {
            const isActive =
              pathname === item.url || pathname.startsWith(`${item.url}/`);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className={cn(
                    "text-rose-600 relative h-10 transition-all duration-300 ease-in-out",
                    "hover:bg-sidebar-accent hover:text-pink-600",
                    "data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold",
                    "data-[active=true]:text-pink-600",
                    "data-[active=true]:shadow-[inset_0_0_0_1px_hsl(var(--sidebar-border)),0_4px_12px_-2px_hsl(var(--sidebar-ring)/0.22)]",
                    "rounded-xl px-3",
                  )}
                >
                  <Link
                    href={item.url}
                    className="flex w-full items-center gap-3"
                    onClick={handleItemClick}
                  >
                    <div
                      className={cn(
                        "flex size-5 items-center justify-center transition-transform duration-300",
                        isActive &&
                          "scale-110 drop-shadow-[0_0_8px_hsl(var(--sidebar-ring)/0.45)]",
                      )}
                    >
                      {item.icon && <item.icon className="size-full" />}
                    </div>
                    <span className="text-sm">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
