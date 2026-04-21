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
        <SidebarGroupLabel className="text-primary/85 font-semibold tracking-widest">
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
                    "relative h-10 text-pink-500 transition-all duration-300 ease-in-out",
                    "hover:text-primary hover:bg-pink-100",
                    "data-[active=true]:bg-primary/12 data-[active=true]:font-semibold",
                    "data-[active=true]:text-primary",
                    "data-[active=true]:shadow-[inset_0_0_0_1px_hsl(var(--ring)/0.18),0_4px_12px_-2px_hsl(var(--ring)/0.18)]",
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
                          "scale-110 drop-shadow-[0_0_8px_hsl(var(--ring)/0.4)]",
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
