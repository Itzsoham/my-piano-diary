"use client";

import { useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  type EventClickArg,
  type EventDropArg,
  type DayCellContentArg,
} from "@fullcalendar/core";
import { type EventResizeDoneArg } from "@fullcalendar/interaction";
import { format, isSameDay } from "date-fns";
import { api } from "@/trpc/react";
import { toast } from "sonner";

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
    onAddLesson(arg.date);
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const lesson = info.event.extendedProps.lesson as Lesson;
    const newDate = info.event.start;

    if (!newDate) return;

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
    } catch (error) {
      toast.error("Failed to update duration");
      console.error(error);
      revert();
    }
  };

  // Custom render for day cell content (Month View)
  const renderDayCellContent = (arg: DayCellContentArg) => {
    const count = lessons.filter((l) =>
      isSameDay(new Date(l.date), arg.date),
    ).length;

    return (
      <div className="flex h-full w-full flex-col justify-between p-1">
        <span className="text-foreground/80 text-sm font-medium">
          {arg.dayNumberText}
        </span>
        {count > 0 && (
          <div className="bg-primary/10 text-primary hover:bg-primary/20 mt-auto self-center rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm transition-all">
            {count} {count === 1 ? "Lesson" : "Lessons"}
          </div>
        )}
      </div>
    );
  };

  const events = lessons.map((lesson) => {
    const endDate = new Date(
      new Date(lesson.date).getTime() + lesson.duration * 60000,
    );

    let backgroundColor = "";
    let borderColor = "";

    switch (lesson.status) {
      case "COMPLETE":
        backgroundColor = "#10b981"; // Emerald-500
        borderColor = "#059669";
        break;
      case "CANCELLED":
        backgroundColor = "var(--destructive)";
        borderColor = "var(--destructive)";
        break;
      default:
        backgroundColor = "var(--primary)";
        borderColor = "var(--primary)";
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
        "shadow-sm",
        "font-medium",
      ],
    };
  });

  return (
    <div className="bg-card text-card-foreground h-[calc(100vh-200px)] min-h-150 w-full overflow-hidden rounded-xl border shadow-sm">
      <style jsx global>{`
        .fc {
          --fc-border-color: var(--border);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: var(--accent);
          --fc-list-event-hover-bg-color: var(--accent);
          --fc-today-bg-color: color-mix(
            in srgb,
            var(--primary),
            transparent 95%
          );
          font-family: var(--font-sans), system-ui, sans-serif;
        }

        /* Toolbar Styling */
        .fc-header-toolbar {
          margin-bottom: 1.5rem !important;
          padding: 1.5rem 1.5rem 0.5rem 1.5rem;
        }

        .fc-toolbar-title {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          color: var(--foreground);
          letter-spacing: -0.025em;
        }

        /* Buttons */
        .fc-button {
          background-color: transparent !important;
          border: 1px solid var(--border) !important;
          color: var(--foreground) !important;
          font-weight: 500 !important;
          text-transform: capitalize !important;
          border-radius: var(--radius-md) !important;
          padding: 0.5rem 1rem !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }

        .fc-button:hover {
          background-color: var(--accent) !important;
          border-color: var(--accent) !important;
        }

        .fc-button-active {
          background-color: var(--primary) !important;
          border-color: var(--primary) !important;
          color: var(--primary-foreground) !important;
        }

        .fc-button-primary:not(:disabled).fc-button-active:focus,
        .fc-button-primary:not(:disabled):active:focus {
          box-shadow: 0 0 0 2px var(--ring) !important;
        }

        /* Grid & Cells */
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: color-mix(
            in srgb,
            var(--border),
            transparent 40%
          ) !important;
        }

        .fc-col-header-cell-cushion {
          color: var(--muted-foreground);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding: 1rem 0 !important;
          letter-spacing: 0.05em;
        }

        .fc-daygrid-day-frame {
          padding: 4px;
          transition: background-color 0.2s;
        }
        .fc-daygrid-day:hover .fc-daygrid-day-frame {
          background-color: color-mix(in srgb, var(--accent), transparent 70%);
        }

        /* Hide events in month view */
        .fc-dayGridMonth-view .fc-daygrid-day-events {
          display: none !important;
        }
        .fc-dayGridMonth-view .fc-daygrid-event-harness {
          display: none !important;
        }

        /* Remove extra scrollbars if not needed */
        .fc-scroller {
          scrollbar-width: thin;
        }

        /* Day View & Week View Events */
        .fc-timegrid-event {
          border-radius: 6px !important;
          box-shadow:
            0 2px 4px -1px rgb(0 0 0 / 0.1),
            0 1px 2px -1px rgb(0 0 0 / 0.06);
          border: none !important;
          padding: 1px;
        }

        .fc-event-main {
          padding: 4px 6px;
          font-weight: 600;
          font-size: 0.75rem;
        }

        /* Time slots */
        .fc-timegrid-slot-label-cushion {
          color: var(--muted-foreground);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .fc-timegrid-now-indicator-line {
          border-color: var(--destructive);
          border-width: 2px;
        }

        .fc-timegrid-now-indicator-arrow {
          border-color: var(--destructive);
          border-width: 6px;
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
        dayCellContent={renderDayCellContent}
        navLinks={true}
        height="100%"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        scrollTime="08:00:00"
        allDaySlot={false}
        nowIndicator={true}
        slotLabelFormat={{
          hour: "numeric",
          minute: "2-digit",
          omitZeroMinute: false,
          meridiem: "short",
        }}
        views={{
          dayGridMonth: {
            dayMaxEvents: false,
            eventDisplay: "none",
            fixedWeekCount: false,
          },
        }}
      />
    </div>
  );
}
