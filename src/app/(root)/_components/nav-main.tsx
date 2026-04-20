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
                    "relative h-10 text-rose-500/75 transition-all duration-300 ease-in-out",
                    "hover:bg-pink-500/5 hover:text-pink-600",
                    "data-[active=true]:bg-linear-to-r data-[active=true]:from-pink-500/15 data-[active=true]:to-rose-500/5",
                    "data-[active=true]:font-semibold data-[active=true]:text-pink-600",
                    "data-[active=true]:shadow-[inset_0_0_0_1px_rgba(244,114,182,0.1),0_4_12_-2px_rgba(244,114,182,0.15)]",
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
                          "scale-110 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]",
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
