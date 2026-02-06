"use client";

import { useState } from "react";
import { CirclePlus } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LessonDialog } from "@/components/lessons/lesson-dialog";
import { api } from "@/trpc/react";

export function NavAction() {
  const [open, setOpen] = useState(false);
  const { data: students = [] } = api.student.getAll.useQuery();

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary active:bg-primary/25 active:text-primary border-primary/10 h-10 cursor-pointer justify-start rounded-xl border shadow-none transition-all"
                onClick={() => setOpen(true)}
                tooltip="Add lesson"
              >
                <CirclePlus className="size-4 shrink-0" />
                <span className="font-medium">Add lesson</span>
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
