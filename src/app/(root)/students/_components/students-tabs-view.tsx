"use client";

import * as React from "react";
import { GraduationCap, HeartHandshake, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentsTable } from "./students-table";
import { FamiliesManager } from "./families-manager";
import { ParentsManager } from "./parents-manager";

type StudentItem = {
  id: string;
  name: string;
  avatar: string | null;
  notes: string | null;
  isActive: boolean;
  lessonRate: number;
  onlineLessonRate: number;
  _count: {
    lessons: number;
  };
};

interface StudentsTabsViewProps {
  students: StudentItem[];
}

export function StudentsTabsView({ students }: StudentsTabsViewProps) {
  const activeStudents = React.useMemo(
    () => students.filter((s) => s.isActive),
    [students],
  );

  const activeStudentOptions = React.useMemo(
    () =>
      activeStudents.map((student) => ({
        id: student.id,
        name: student.name,
        avatar: student.avatar,
      })),
    [activeStudents],
  );

  return (
    <Tabs defaultValue="students" className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="inline-flex h-auto w-full sm:w-auto items-center justify-start gap-1 rounded-full border border-pink-200/80 bg-pink-100/50 p-1.5 shadow-(--sh-xs)">
          <TabsTrigger
            value="students"
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-pink-900 data-[state=active]:shadow-xs data-[state=active]:font-semibold text-ink-muted hover:text-ink cursor-pointer"
          >
            <GraduationCap className="size-4 shrink-0 text-pink-600" />
            <span>Students</span>
            <span className="ml-1 rounded-full bg-pink-100/80 px-2 py-0.5 text-[11px] font-bold text-pink-700">
              {students.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="families"
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-pink-900 data-[state=active]:shadow-xs data-[state=active]:font-semibold text-ink-muted hover:text-ink cursor-pointer"
          >
            <Users className="size-4 shrink-0 text-pink-600" />
            <span>Families</span>
          </TabsTrigger>

          <TabsTrigger
            value="parents"
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-pink-900 data-[state=active]:shadow-xs data-[state=active]:font-semibold text-ink-muted hover:text-ink cursor-pointer"
          >
            <HeartHandshake className="size-4 shrink-0 text-pink-600" />
            <span>Parent Accounts</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="students" className="mt-0 focus-visible:outline-none">
        <StudentsTable data={students} />
      </TabsContent>

      <TabsContent value="families" className="mt-0 focus-visible:outline-none">
        <FamiliesManager students={activeStudentOptions} />
      </TabsContent>

      <TabsContent value="parents" className="mt-0 focus-visible:outline-none">
        <ParentsManager students={activeStudentOptions} />
      </TabsContent>
    </Tabs>
  );
}
