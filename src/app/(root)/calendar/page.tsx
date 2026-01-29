"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FullCalendarView } from "./_components/full-calendar-view";
import { LessonDialog } from "@/components/lessons/lesson-dialog";
import { AttendanceDialog } from "./_components/attendance-dialog";
import { api } from "@/trpc/react";

interface Lesson {
  id: string;
  date: Date;
  duration: number;
  status: "PENDING" | "COMPLETE" | "CANCELLED";
  student: {
    id: string;
    name: string;
    avatar: string | null;
  };
  actualMin: number | null;
  cancelReason: string | null;
  note: string | null;
}

export default function CalendarPage() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  });
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const { data: lessons = [], refetch } = api.lesson.getInRange.useQuery({
    start: dateRange.start,
    end: dateRange.end,
  });

  const { data: students = [] } = api.student.getAll.useQuery();

  const handleAddLesson = (date: Date) => {
    // Check if the click is on a specific time slot or just a day
    // FullCalendar passes date with time if clicked on timeGrid
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

      <FullCalendarView
        lessons={lessons as Lesson[]}
        onDateRangeChange={(start: Date, end: Date) =>
          setDateRange({ start, end })
        }
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
            status: selectedLesson.status,
            actualMin: selectedLesson.actualMin,
            cancelReason: selectedLesson.cancelReason,
            note: selectedLesson.note,
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
