"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FullCalendarView } from "./_components/full-calendar-view";
import { CalendarHero } from "./_components/calendar-hero";
import { CalendarDayPanel } from "./_components/calendar-day-panel";
import { CalendarMonthSticker } from "./_components/calendar-month-sticker";
import { LessonDialog } from "@/components/lessons/lesson-dialog";
import { AttendanceDialog } from "./_components/attendance-dialog";
import { api } from "@/trpc/react";
import { useBirthday } from "@/components/birthday/birthday-provider";
import { BirthdayBanner } from "@/components/birthday/birthday-banner";
import { getBrowserTimezone } from "@/lib/timezone";

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

type CalendarView = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

export default function CalendarPage() {
  const { data: session } = useSession();
  const timezone = session?.user?.timezone ?? getBrowserTimezone();

  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  });
  const [currentView, setCurrentView] = useState<CalendarView>("dayGridMonth");
  // The day the panel below/beside the grid is showing. Also doubles as the
  // default date for a brand-new lesson opened from the hero/panel buttons.
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [newLessonDate, setNewLessonDate] = useState<Date | null>(null);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
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

  const handleDateRangeChange = (start: Date, end: Date, view: string) => {
    setDateRange({ start, end });
    setCurrentView(view as CalendarView);
    // Keep the current selection if it's still inside the newly loaded range
    // (e.g. flipping Month/Week/Day on a range that still contains it);
    // otherwise jump to the new range's first day so the panel never shows a
    // day with no data behind it.
    setSelectedDate((prev) => (prev >= start && prev < end ? prev : start));
  };

  const handleAddLesson = (date: Date) => {
    // Check if the click is on a specific time slot or just a day
    // FullCalendar passes date with time if clicked on timeGrid
    setNewLessonDate(date);
    setSelectedLesson(null);
    setSelectedDate(date);
    setLessonDialogOpen(true);
  };

  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setAttendanceDialogOpen(true);
  };

  const handleSuccess = () => {
    // Silently re-sync all lesson caches in the background
    void utils.lesson.invalidate();
  };

  const rangeLabel =
    currentView === "dayGridMonth"
      ? "month"
      : currentView === "timeGridWeek"
        ? "week"
        : "day";

  const stickerLabel =
    currentView === "dayGridMonth"
      ? format(dateRange.start, "MMMM")
      : currentView === "timeGridWeek"
        ? "This week"
        : "Today";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-5 pb-6 md:gap-6 md:pb-10">
        <CalendarHero
          lessonCount={lessons.length}
          rangeLabel={rangeLabel}
          onAddLesson={() => handleAddLesson(selectedDate)}
        />

        <div className="flex flex-col gap-4 px-4 lg:px-6">
          <BirthdayBanner
            text="Every lesson is a little celebration 🎹"
            icon="🎉"
            storageKey="calendar"
            leftEmojis={["🎵", "✨", "🎹"]}
          />

          {/* Legend — the real app has none elsewhere; the swatches are the
              literal marks used in the day panel (a 4px rail), on the deep
              -fg ramp so they stay legible as swatches. */}
          <div className="border-border bg-card/70 text-ink-soft flex flex-wrap items-center gap-x-3.5 gap-y-2 rounded-full border px-4 py-2.5 text-xs font-semibold shadow-(--sh-xs) backdrop-blur-sm">
            <span className="text-ok-fg inline-flex items-center gap-1.5">
              <i
                aria-hidden="true"
                className="h-3.5 w-1 rounded-full bg-teal-600"
              />
              Complete
            </span>
            <span className="text-no-fg inline-flex items-center gap-1.5">
              <i
                aria-hidden="true"
                className="h-3.5 w-1 rounded-full bg-pink-600"
              />
              Cancelled
            </span>
            <span className="text-wait-fg inline-flex items-center gap-1.5">
              <i
                aria-hidden="true"
                className="bg-sand-700 h-3.5 w-1 rounded-full"
              />
              Pending
            </span>
            <span aria-hidden="true" className="bg-border h-3.5 w-px" />
            <span className="inline-flex items-center gap-1.5 text-teal-700">
              <i
                aria-hidden="true"
                className="h-3.5 w-1 rounded-full bg-teal-400"
              />
              Online
            </span>
            <span className="text-ink-soft ml-auto hidden font-medium sm:inline">
              Key to the <b className="text-ink">day panel</b>
            </span>
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
            <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0">
                <FullCalendarView
                  lessons={lessons as Lesson[]}
                  selectedDate={selectedDate}
                  onDateRangeChange={handleDateRangeChange}
                  onAddLesson={handleAddLesson}
                  onLessonClick={handleLessonClick}
                  onDaySelect={handleDaySelect}
                />
                <CalendarMonthSticker
                  label={stickerLabel}
                  lessons={lessons as Lesson[]}
                />
              </div>

              <CalendarDayPanel
                className="lg:sticky lg:top-20"
                selectedDate={selectedDate}
                lessons={lessons as Lesson[]}
                timezone={timezone}
                onAddLesson={handleAddLesson}
                onLessonClick={handleLessonClick}
              />
            </div>
          )}
        </div>
      </div>

      <LessonDialog
        open={lessonDialogOpen}
        onOpenChange={setLessonDialogOpen}
        students={students.map((s) => ({ id: s.id, name: s.name }))}
        initialDate={newLessonDate}
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
      className="border-border bg-card w-full overflow-hidden rounded-[calc(var(--radius)+8px)] border p-4 shadow-(--sh)"
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
