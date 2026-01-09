"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarView } from "./_components/calendar-view";
import { LessonDialog } from "./_components/lesson-dialog";
import { AttendanceDialog } from "./_components/attendance-dialog";
import { api } from "@/trpc/react";
import type { AttendanceStatus } from "@prisma/client";

interface Lesson {
  id: string;
  date: Date;
  duration: number;
  student: {
    id: string;
    name: string;
    avatar: string | null;
  };
  attendance: {
    id: string;
    status: AttendanceStatus;
    actualMin: number;
    reason: string | null;
    note: string | null;
  } | null;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  const { data: lessons = [], refetch } = api.lesson.getForMonth.useQuery({
    year,
    month,
  });

  const { data: students = [] } = api.student.getAll.useQuery();

  const handleAddLesson = (date: Date) => {
    setSelectedDate(date);
    setSelectedLesson(null);
    setLessonDialogOpen(true);
  };

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setAttendanceDialogOpen(true);
  };

  const handleSuccess = () => {
    void refetch();
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Manage lessons and track attendance
          </p>
        </div>
        <Button onClick={() => handleAddLesson(new Date())}>
          <Plus className="mr-2 h-4 w-4" />
          Add Lesson
        </Button>
      </div>

      <CalendarView
        lessons={lessons as Lesson[]}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        onAddLesson={handleAddLesson}
        onLessonClick={handleLessonClick}
        onRefresh={handleSuccess}
      />

      <LessonDialog
        open={lessonDialogOpen}
        onOpenChange={setLessonDialogOpen}
        students={students.map((s) => ({ id: s.id, name: s.name }))}
        initialDate={selectedDate}
        onSuccess={handleSuccess}
      />

      {selectedLesson && (
        <AttendanceDialog
          open={attendanceDialogOpen}
          onOpenChange={setAttendanceDialogOpen}
          lesson={{
            id: selectedLesson.id,
            studentName: selectedLesson.student.name,
            duration: selectedLesson.duration,
            attendance: selectedLesson.attendance,
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
