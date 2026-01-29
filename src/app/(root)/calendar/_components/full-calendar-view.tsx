"use client";

import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  type DateSelectArg,
  type EventClickArg,
  type EventDropArg,
  type ViewMountArg,
} from "@fullcalendar/core";
import { type EventResizeDoneArg } from "@fullcalendar/interaction";
import { format } from "date-fns";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface FullCalendarViewProps {
  lessons: Lesson[];
  onDateRangeChange: (start: Date, end: Date) => void;
  onAddLesson: (date: Date) => void;
  onLessonClick: (lesson: Lesson) => void;
  onRefresh: () => void;
}

export function FullCalendarView({
  lessons,
  onDateRangeChange,
  onAddLesson,
  onLessonClick,
  onRefresh,
}: FullCalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const updateLesson = api.lesson.update.useMutation();

  const handleDatesSet = (arg: {
    start: Date;
    end: Date;
    view: { type: string };
  }) => {
    onDateRangeChange(arg.start, arg.end);
  };

  const handleEventClick = (info: EventClickArg) => {
    const lesson = info.event.extendedProps.lesson as Lesson;
    onLessonClick(lesson);
  };

  const handleDateClick = (arg: { date: Date; view: { type: string } }) => {
    // In Month view, clicking a day might either open day view OR add lesson.
    // Requirement: "Month View click day -> open day view"
    // Requirement: "Week/Day View -> add lesson?" (Usually via date selection)

    // If we use navLinks: true, clicking the number opens the day view.
    // If we click the empty space, we can add a lesson.
    onAddLesson(arg.date);
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const lesson = info.event.extendedProps.lesson as Lesson;
    const newDate = info.event.start;

    if (!newDate) return;

    // Revert visual change if update fails (handled by catch)
    const revert = info.revert;

    try {
      await updateLesson.mutateAsync({
        id: lesson.id,
        date: newDate,
      });

      const dayOfWeek = format(newDate, "EEEE");
      const time = format(newDate, "h:mm a");
      toast.success(`Lesson moved to ${dayOfWeek} ${time}`);
      onRefresh();
    } catch (error) {
      toast.error("Failed to reschedule lesson");
      console.error(error);
      revert();
    }
  };

  const handleEventResize = async (info: EventResizeDoneArg) => {
    const lesson = info.event.extendedProps.lesson as Lesson;
    const start = info.event.start;
    const end = info.event.end;

    if (!start || !end) return;

    // Calculate new duration in minutes
    const durationMinutes = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60),
    );
    const revert = info.revert;

    try {
      await updateLesson.mutateAsync({
        id: lesson.id,
        duration: durationMinutes,
      });

      toast.success(`Lesson duration updated to ${durationMinutes} min`);
      onRefresh();
    } catch (_) {
      toast.error("Failed to update duration");
      revert();
    }
  };

  // Transform lessons to events
  const events = lessons.map((lesson) => {
    const endDate = new Date(
      new Date(lesson.date).getTime() + lesson.duration * 60000,
    );

    let backgroundColor = "";
    let borderColor = "";

    switch (lesson.status) {
      case "COMPLETE":
        backgroundColor = "#10b981"; // emerald-500
        borderColor = "#059669";
        break;
      case "CANCELLED":
        backgroundColor = "#ef4444"; // red-500
        borderColor = "#b91c1c";
        break;
      default:
        backgroundColor = "#3b82f6"; // blue-500
        borderColor = "#2563eb";
    }

    return {
      id: lesson.id,
      title: lesson.student.name,
      start: lesson.date,
      end: endDate,
      backgroundColor,
      borderColor,
      extendedProps: {
        lesson,
      },
      classNames: [
        "cursor-pointer",
        "hover:opacity-90",
        "transition-opacity",
        "rounded-md",
        "border",
        "px-1",
      ],
    };
  });

  return (
    <div className="bg-card h-[calc(100vh-200px)] min-h-[600px] w-full rounded-xl border p-4 shadow-sm">
      <style jsx global>{`
        .fc {
          --fc-border-color: hsl(var(--border));
          --fc-page-bg-color: hsl(var(--background));
          --fc-neutral-bg-color: hsl(var(--accent));
          --fc-list-event-hover-bg-color: hsl(var(--accent));
          --fc-today-bg-color: hsl(var(--accent) / 0.3);
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
        }
        .fc-button {
          background-color: hsl(var(--primary)) !important;
          border-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          font-weight: 500 !important;
          text-transform: capitalize !important;
        }
        .fc-button:hover {
          background-color: hsl(var(--primary) / 0.9) !important;
          border-color: hsl(var(--primary) / 0.9) !important;
        }
        .fc-button-active {
          background-color: hsl(var(--primary)) !important;
          border-color: hsl(var(--primary)) !important;
          filter: brightness(0.9);
        }
        .fc-daygrid-day-number {
          color: hsl(var(--foreground));
          font-weight: 500;
          text-decoration: none !important;
        }
        .fc-col-header-cell-cushion {
          color: hsl(var(--muted-foreground));
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding-top: 1rem !important;
          padding-bottom: 1rem !important;
        }
        .fc-timegrid-slot-label-cushion {
          color: hsl(var(--muted-foreground));
          font-size: 0.75rem;
        }
        .fc-event-main {
          padding: 2px 4px;
          font-weight: 500;
          font-size: 0.75rem;
        }
        .fc-popover {
          background-color: hsl(var(--popover)) !important;
          border-color: hsl(var(--border)) !important;
          box-shadow:
            0 4px 6px -1px rgb(0 0 0 / 0.1),
            0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
        }
        .fc-popover-header {
          background-color: hsl(var(--muted)) !important;
          color: hsl(var(--foreground)) !important;
        }
        .fc-popover-body {
          color: hsl(var(--foreground)) !important;
        }
      `}</style>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        datesSet={handleDatesSet}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        navLinks={true} // click day to open day view
        height="100%"
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        nowIndicator={true}
      />
    </div>
  );
}
