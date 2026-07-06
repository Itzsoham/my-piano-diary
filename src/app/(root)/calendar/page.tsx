"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData } from "@tanstack/react-query";
import { Plus, CalendarX, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FullCalendarView } from "./_components/full-calendar-view";
import { LessonDialog } from "@/components/lessons/lesson-dialog";
import { AttendanceDialog } from "./_components/attendance-dialog";
import { api } from "@/trpc/react";
import { useBirthday } from "@/components/birthday/birthday-provider";
import { BirthdayBanner } from "@/components/birthday/birthday-banner";

interface Lesson {
  id: string;
  date: Date;
  duration: number;
  status: "PENDING" | "COMPLETE" | "CANCELLED";
  isOnline: boolean;
  rate: number;
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
  const { isBirthdayMode } = useBirthday();

  const utils = api.useUtils();
  const {
    data: lessons = [],
    isPending,
    isError,
    refetch,
  } = api.lesson.getInRange.useQuery(
    { start: dateRange.start, end: dateRange.end },
    // Keep the current month on screen while the next one loads, so navigating
    // months never flashes an empty grid (which could invite a double-booking).
    { placeholderData: keepPreviousData },
  );

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
    // Silently re-sync all lesson caches in the background
    void utils.lesson.invalidate();
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <BirthdayBanner
        text="Every lesson is a little celebration 🎹"
        icon="🎉"
        storageKey="calendar"
        leftEmojis={["🎵", "✨", "🎹"]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="bday-animate-title text-3xl font-bold tracking-tight">
            Calendar
          </h1>
          <p className="text-muted-foreground">
            {isBirthdayMode
              ? "Every lesson is a gift. Yours especially 🎹✨"
              : "Manage lessons and track attendance"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/lessons">
              <List className="mr-2 h-4 w-4" />
              List view
            </Link>
          </Button>
          <Button
            onClick={() => handleAddLesson(new Date())}
            className={`bday-animate-button rounded-xl bg-linear-to-r from-pink-500 to-purple-500 font-semibold text-white shadow-sm transition-all active:scale-[0.98] ${
              isBirthdayMode
                ? "duration-300 hover:scale-105 hover:shadow-[0_4px_20px_-4px_rgba(251,207,232,0.7)]"
                : "hover:from-pink-600 hover:to-purple-600 hover:shadow-md hover:shadow-pink-300/40"
            }`}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Lesson
          </Button>
        </div>
      </div>

      {isError ? (
        <ErrorState
          icon={CalendarX}
          title="Couldn't load your calendar"
          description="Something went wrong fetching lessons for this range. Check your connection and try again."
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : isPending ? (
        <CalendarSkeleton />
      ) : (
        // keepPreviousData keeps the current month on screen while the next
        // one loads, so there's no empty-grid flash and nothing to disable.
        <FullCalendarView
          lessons={lessons as Lesson[]}
          onDateRangeChange={(start: Date, end: Date) =>
            setDateRange({ start, end })
          }
          onAddLesson={handleAddLesson}
          onLessonClick={handleLessonClick}
        />
      )}

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
            isOnline: selectedLesson.isOnline,
            rate: selectedLesson.rate,
            actualMin: selectedLesson.actualMin,
            cancelReason: selectedLesson.cancelReason,
            note: selectedLesson.note,
            date: selectedLesson.date,
          }}
          dateRange={dateRange}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div
      className="bg-card w-full overflow-hidden rounded-xl border border-pink-100/60 p-4 shadow-sm"
      aria-busy="true"
      aria-label="Loading calendar"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: 42 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-md sm:h-20" />
        ))}
      </div>
    </div>
  );
}
