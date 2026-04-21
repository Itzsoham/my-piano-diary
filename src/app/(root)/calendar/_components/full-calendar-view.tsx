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
import { useBirthday } from "@/components/birthday/birthday-provider";
import { useQueryClient } from "@tanstack/react-query";

const BIRTHDAY_DATE = new Date("2026-04-24T00:00:00");

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
}

export function FullCalendarView({
  lessons,
  onDateRangeChange,
  onAddLesson,
  onLessonClick,
}: FullCalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const utils = api.useUtils();
  const queryClient = useQueryClient();
  const updateLesson = api.lesson.update.useMutation({
    mutationKey: ["lesson-write"],
    onSettled: async () => {
      const inFlight = queryClient.isMutating({
        mutationKey: ["lesson-write"],
      });

      if (inFlight !== 1) {
        return;
      }

      await utils.lesson.invalidate();
    },
  });
  const { isBirthdayMode } = useBirthday();

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
    } catch (error) {
      toast.error("Failed to update duration");
      console.error(error);
      revert();
    }
  };

  // Custom render for day cell content (Month View) — upgraded badge
  const renderDayCellContent = (arg: DayCellContentArg) => {
    const count = lessons.filter((l) =>
      isSameDay(new Date(l.date), arg.date),
    ).length;

    const isBirthday = isBirthdayMode && isSameDay(arg.date, BIRTHDAY_DATE);

    return (
      <div className="flex h-full w-full flex-col justify-between p-1">
        <span
          className={
            isBirthday
              ? "inline-flex items-center gap-0.5 text-sm font-bold text-amber-600"
              : "text-foreground/80 text-sm font-medium"
          }
          style={
            isBirthday
              ? {
                  outline: "2px solid #fde68a",
                  outlineOffset: "2px",
                  borderRadius: "4px",
                  padding: "0 2px",
                  background:
                    "linear-gradient(135deg, rgba(253,230,138,0.3), rgba(251,207,232,0.3))",
                }
              : undefined
          }
          title={isBirthday ? "Special Day! 🎂" : undefined}
        >
          {arg.dayNumberText}
          {isBirthday && <span className="ml-0.5 text-xs">🎂</span>}
        </span>
        {count > 0 && (
          <div className="mt-auto self-start">
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-600 shadow-sm backdrop-blur-sm transition-all hover:bg-pink-200">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-pink-400" />
              {count} {count === 1 ? "lesson" : "lessons"}
            </span>
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
    <div className="bg-card text-card-foreground w-full overflow-hidden rounded-xl border border-pink-100/60 shadow-sm">
      <style jsx global>{`
        .fc {
          --fc-border-color: var(--border);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: var(--accent);
          --fc-list-event-hover-bg-color: var(--accent);
          --fc-today-bg-color: color-mix(
            in srgb,
            var(--primary),
            transparent 93%
          );
          font-family: var(--font-sans), system-ui, sans-serif;
        }

        /* Toolbar Styling */
        .fc-header-toolbar {
          margin-bottom: 0.75rem !important;
          padding: 1rem 1rem 0.5rem 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }

        @media (min-width: 640px) {
          .fc-header-toolbar {
            margin-bottom: 1.25rem !important;
            padding: 1.5rem 1.5rem 0.5rem 1.5rem;
          }
        }

        /* Mobile: stack toolbar rows */
        @media (max-width: 639px) {
          .fc-header-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.625rem !important;
          }
          .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
          }
          .fc-toolbar-chunk:last-child {
            display: flex;
            justify-content: center;
            gap: 0.25rem;
          }
        }

        .fc-toolbar-chunk {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* 🎵 Month Title — Gradient + Music Icon effect via pseudo */
        .fc-toolbar-title {
          font-size: 1.125rem !important;
          font-weight: 700 !important;
          letter-spacing: -0.025em;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @media (min-width: 640px) {
          .fc-toolbar-title {
            font-size: 1.4rem !important;
          }
        }

        /* Add a music emoji before the title using CSS */
        .fc-toolbar-title::before {
          content: "🎵 ";
          -webkit-text-fill-color: initial;
          font-size: 0.9em;
        }

        /* Buttons */
        .fc-button {
          background-color: transparent !important;
          border: 1px solid var(--border) !important;
          color: var(--foreground) !important;
          font-weight: 500 !important;
          text-transform: capitalize !important;
          border-radius: var(--radius-md) !important;
          padding: 0.375rem 0.75rem !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.04);
          font-size: 0.875rem !important;
        }

        @media (max-width: 639px) {
          .fc-button {
            padding: 0.5rem 0.875rem !important;
            font-size: 0.875rem !important;
            min-height: 2.5rem !important;
          }
        }

        @media (min-width: 640px) {
          .fc-button {
            padding: 0.5rem 1rem !important;
          }
        }

        .fc-button:hover {
          background-color: #fdf2f8 !important;
          border-color: #fce7f3 !important;
          color: #ec4899 !important;
        }

        .fc-button:focus,
        .fc-button:focus-visible {
          outline: none !important;
          border-color: #ec4899 !important;
          box-shadow: 0 0 0 2px rgb(236 72 153 / 0.3) !important;
        }

        .fc-button:active {
          border-color: #db2777 !important;
          box-shadow: 0 0 0 2px rgb(236 72 153 / 0.2) !important;
        }

        .fc-button-active,
        .fc-button-primary:not(:disabled).fc-button-active {
          background: linear-gradient(135deg, #ec4899, #a855f7) !important;
          border-color: transparent !important;
          color: white !important;
          box-shadow: 0 2px 8px 0 rgb(236 72 153 / 0.3) !important;
        }

        .fc-button-primary:not(:disabled).fc-button-active:focus,
        .fc-button-primary:not(:disabled):active:focus {
          box-shadow: 0 0 0 2px rgb(236 72 153 / 0.3) !important;
        }

        /* Grid & Cells */
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: color-mix(
            in srgb,
            var(--border),
            transparent 50%
          ) !important;
        }

        .fc-col-header-cell-cushion {
          color: var(--muted-foreground);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding: 0.75rem 0 !important;
          letter-spacing: 0.05em;
        }

        /* 💎 Calendar Cell Hover — life & warmth */
        .fc-daygrid-day-frame {
          padding: 4px;
          transition:
            background-color 0.18s ease,
            transform 0.18s ease,
            box-shadow 0.18s ease;
          border-radius: 6px;
        }

        .fc-daygrid-day:hover .fc-daygrid-day-frame {
          background-color: #fdf2f8 !important;
          box-shadow: 0 1px 8px 0 rgb(236 72 153 / 0.08);
          transform: scale(1.01);
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
          border-color: #ec4899;
          border-width: 2px;
        }

        .fc-timegrid-now-indicator-arrow {
          border-color: #ec4899;
          border-width: 6px;
        }

        /* Mobile: horizontal scroll for all views (month, week, day) */
        @media (max-width: 639px) {
          .fc-daygrid-body {
            min-width: 560px;
          }
          .fc-scrollgrid-sync-table {
            min-width: 560px;
          }
          .fc-col-header {
            min-width: 560px;
          }
          /* Week & Day timegrid views */
          .fc-timegrid-body {
            min-width: 560px;
          }
          .fc-timegrid-slot {
            min-width: 560px;
          }
          .fc-scrollgrid {
            min-width: 560px;
          }
        }
      `}</style>

      {/* Outer: fixed height container */}
      <div
        style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}
        className="relative"
      >
        {/* Inner: horizontal scroll on mobile */}
        <div
          className="h-full overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          <div className="h-full min-w-150 sm:min-w-0">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              customButtons={{
                prevMonth: {
                  text: "❮",
                  hint: "Previous month",
                  click: () => {
                    calendarRef.current?.getApi().prev();
                  },
                },
                nextMonth: {
                  text: "❯",
                  hint: "Next month",
                  click: () => {
                    calendarRef.current?.getApi().next();
                  },
                },
              }}
              headerToolbar={{
                left: "prevMonth,nextMonth today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              buttonText={{
                today: "Today",
                month: "Month",
                week: "Week",
                day: "Day",
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
        </div>
      </div>
    </div>
  );
}
