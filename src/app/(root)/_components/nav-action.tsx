"use client";

import { useState } from "react";
import { CirclePlus } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { LessonDialog } from "@/components/lessons/lesson-dialog";
import { api } from "@/trpc/react";

export function NavAction() {
  const [open, setOpen] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar();
  const { data: students = [] } = api.student.getAll.useQuery();

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-10 cursor-pointer rounded-xl bg-linear-to-r from-pink-500 to-purple-500 font-semibold text-white shadow-sm transition-all hover:from-pink-600 hover:to-purple-600 hover:shadow-md hover:shadow-pink-300/40 active:scale-[0.98]"
                onClick={() => {
                  setOpen(true);
                  if (isMobile) setOpenMobile(false);
                }}
                tooltip="Add lesson"
              >
                <CirclePlus className="size-4 shrink-0" />
                <span className="font-semibold">Add lesson</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <LessonDialog
        open={open}
        onOpenChange={setOpen}
        students={students.map((s) => ({ id: s.id, name: s.name }))}
        initialDate={new Date()}
      />
    </>
  );
}
