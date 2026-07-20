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
  type EventMountArg,
} from "@fullcalendar/core";
import { type EventResizeDoneArg } from "@fullcalendar/interaction";
import { format, isSameDay, isToday as isTodayDate } from "date-fns";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { fromUTC, getBrowserTimezone, toUTC } from "@/lib/timezone";
import { useBirthday } from "@/components/birthday/birthday-provider";
import { useQueryClient } from "@tanstack/react-query";

const BIRTHDAY_DATE = new Date("2026-04-24T00:00:00");

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

interface FullCalendarViewProps {
  lessons: Lesson[];
  /** The day currently shown in the companion day panel — used to ring the
   * matching cell in month view. */
  selectedDate: Date;
  onDateRangeChange: (start: Date, end: Date, view: string) => void;
  onAddLesson: (date: Date) => void;
  onLessonClick: (lesson: Lesson) => void;
  /** Month view has no event chips (eventDisplay:"none", see below) — clicking
   * a day cell selects it for the day panel instead of jumping straight into
   * "add a lesson". Week/day view keep the old direct-add behaviour, since a
   * click there already carries a specific time slot. */
  onDaySelect: (date: Date) => void;
}

export function FullCalendarView({
  lessons,
  selectedDate,
  onDateRangeChange,
  onAddLesson,
  onLessonClick,
  onDaySelect,
}: FullCalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const { data: session } = useSession();
  const timezone = session?.user?.timezone ?? getBrowserTimezone();
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
    onDateRangeChange(arg.start, arg.end, arg.view.type);
  };

  const handleEventClick = (info: EventClickArg) => {
    const lesson = info.event.extendedProps.lesson as Lesson;
    if (info.event.start) {
      onDaySelect(info.event.start);
    }
    onLessonClick(lesson);
  };

  const handleDateClick = (arg: { date: Date; view: { type: string } }) => {
    // Month view carries no event chips, so a day cell click selects the day
    // for the panel below/beside the grid instead of assuming "add lesson".
    if (arg.view.type === "dayGridMonth") {
      onDaySelect(arg.date);
      return;
    }
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
        // Events render in the configured timezone's wall time, so newDate
        // carries that zone's local components; convert back to a UTC instant.
        date: toUTC(newDate, timezone),
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

  // Accessibility: give each event an accessible name and make it operable by
  // keyboard (FullCalendar events aren't focusable / labelled by default).
  const handleEventDidMount = (info: EventMountArg) => {
    const lesson = info.event.extendedProps.lesson as Lesson;
    const time = info.event.start ? format(info.event.start, "h:mm a") : "";
    info.el.setAttribute(
      "aria-label",
      `${lesson.student.name}, ${time}, ${lesson.status.toLowerCase()}`,
    );
    info.el.setAttribute("role", "button");
    info.el.tabIndex = 0;
    info.el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        // Read live event data — FullCalendar can reuse the element across
        // re-renders without re-running eventDidMount, so the mount-time
        // `lesson` may be stale. Mirror the mouse path (eventClick).
        onLessonClick(info.event.extendedProps.lesson as Lesson);
      }
    });
  };

  // Custom render for day cell content (Month View) — sober by design: the
  // only marks are the count pill (a blossom bullet, never encoding the
  // number itself) and, on today, a low-opacity blossom watermark.
  const renderDayCellContent = (arg: DayCellContentArg) => {
    const count = lessons.filter((l) =>
      isSameDay(fromUTC(new Date(l.date), timezone), arg.date),
    ).length;

    const isBirthday = isBirthdayMode && isSameDay(arg.date, BIRTHDAY_DATE);
    const isTodayCell = isTodayDate(arg.date);

    return (
      <div className="relative flex h-full w-full flex-col justify-between overflow-hidden p-1">
        {isTodayCell && (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="text-bubblegum pointer-events-none absolute -top-2 -left-2 z-0 size-11 opacity-20"
          >
            <g fill="currentColor">
              <ellipse cx="12" cy="6" rx="3.2" ry="4.5" />
              <ellipse
                cx="12"
                cy="6"
                rx="3.2"
                ry="4.5"
                transform="rotate(72 12 12)"
              />
              <ellipse
                cx="12"
                cy="6"
                rx="3.2"
                ry="4.5"
                transform="rotate(144 12 12)"
              />
              <ellipse
                cx="12"
                cy="6"
                rx="3.2"
                ry="4.5"
                transform="rotate(216 12 12)"
              />
              <ellipse
                cx="12"
                cy="6"
                rx="3.2"
                ry="4.5"
                transform="rotate(288 12 12)"
              />
            </g>
          </svg>
        )}
        <span
          className={
            isBirthday
              ? "relative z-1 inline-flex items-center gap-0.5 rounded px-1 text-sm font-bold text-amber-600"
              : isTodayCell
                ? "relative z-1 grid size-6 place-items-center rounded-full [background-image:var(--grad-pink)] text-[13px] font-bold text-white shadow-(--sh-pink)"
                : "text-ink/80 relative z-1 text-sm font-medium"
          }
          style={
            isBirthday
              ? {
                  outline: "2px solid #fde68a",
                  outlineOffset: "2px",
                  background:
                    "linear-gradient(135deg, rgba(253,230,138,0.3), rgba(251,207,232,0.3))",
                }
              : undefined
          }
          title={isBirthday ? "Special Day! 🎂" : undefined}
        >
          {arg.dayNumberText.replace(".", "")}
          {isBirthday && <span className="ml-0.5 text-xs">🎂</span>}
        </span>
        {count > 0 && (
          <div className="relative z-1 mt-auto self-start">
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 py-0.5 pr-2 pl-1.5 text-[11px] font-bold text-pink-700 tabular-nums shadow-(--sh-xs)">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-2 shrink-0 text-pink-500"
              >
                <g fill="currentColor">
                  <ellipse cx="12" cy="6" rx="3.2" ry="4.5" />
                  <ellipse
                    cx="12"
                    cy="6"
                    rx="3.2"
                    ry="4.5"
                    transform="rotate(72 12 12)"
                  />
                  <ellipse
                    cx="12"
                    cy="6"
                    rx="3.2"
                    ry="4.5"
                    transform="rotate(144 12 12)"
                  />
                  <ellipse
                    cx="12"
                    cy="6"
                    rx="3.2"
                    ry="4.5"
                    transform="rotate(216 12 12)"
                  />
                  <ellipse
                    cx="12"
                    cy="6"
                    rx="3.2"
                    ry="4.5"
                    transform="rotate(288 12 12)"
                  />
                </g>
              </svg>
              {count}
              <span className="sr-only">
                {count === 1 ? "lesson" : "lessons"}
              </span>
            </span>
          </div>
        )}
      </div>
    );
  };

  const dayCellClassNames = (arg: { date: Date }) =>
    isSameDay(arg.date, selectedDate) ? ["fc-day-selected"] : [];

  const events = lessons.map((lesson) => {
    // FullCalendar runs in the browser's local zone. Shift each lesson's UTC
    // instant to the configured timezone's wall time so events land on the
    // correct day/time regardless of the browser TZ. Drag/drop is converted
    // back to UTC via toUTC on save (see handleEventDrop).
    const startDate = fromUTC(new Date(lesson.date), timezone);
    const endDate = fromUTC(
      new Date(new Date(lesson.date).getTime() + lesson.duration * 60000),
      timezone,
    );

    // Sober status colours (week/day views only — month view hides event
    // chips entirely). Pastel fill + deep text, same convention as every
    // status chip elsewhere in the app — never a solid saturated block.
    let backgroundColor = "";
    let borderColor = "";
    let textColor = "";

    switch (lesson.status) {
      case "COMPLETE":
        backgroundColor = "var(--ok-bg)";
        borderColor = "var(--teal-600)";
        textColor = "var(--ok-fg)";
        break;
      case "CANCELLED":
        backgroundColor = "var(--no-bg)";
        borderColor = "var(--pink-600)";
        textColor = "var(--no-fg)";
        break;
      default:
        backgroundColor = "var(--wait-bg)";
        borderColor = "var(--sand-700)";
        textColor = "var(--wait-fg)";
    }

    return {
      id: lesson.id,
      title: lesson.student.name,
      start: startDate,
      end: endDate,
      backgroundColor,
      borderColor,
      textColor,
      extendedProps: {
        lesson,
      },
      classNames: [
        "cursor-pointer",
        "hover:brightness-95",
        "transition-[filter]",
        "rounded-md",
        "border",
        "px-1",
        "font-semibold",
      ],
    };
  });

  return (
    <div className="border-border bg-card text-card-foreground w-full overflow-hidden rounded-[calc(var(--radius)+8px)] border shadow-(--sh)">
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

        /* Month title — serif, ink, no emoji hack. */
        .fc-toolbar-title {
          font-family: var(--font-serif);
          font-size: 1.15rem !important;
          font-weight: 400 !important;
          letter-spacing: -0.01em;
          color: var(--ink);
        }

        @media (min-width: 640px) {
          .fc-toolbar-title {
            font-size: 1.4rem !important;
          }
        }

        /* Buttons */
        .fc-button {
          background-color: transparent !important;
          border: 1px solid var(--border) !important;
          color: var(--ink) !important;
          font-weight: 600 !important;
          text-transform: capitalize !important;
          border-radius: var(--radius-md) !important;
          padding: 0.375rem 0.75rem !important;
          transition: all 0.2s ease !important;
          box-shadow: var(--sh-xs);
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
          background-color: var(--pink-50) !important;
          border-color: var(--line-pink) !important;
          color: var(--pink-700) !important;
        }

        .fc-button:focus,
        .fc-button:focus-visible {
          outline: none !important;
          border-color: var(--pink-600) !important;
          box-shadow: 0 0 0 2px
            color-mix(in srgb, var(--pink-600) 30%, transparent) !important;
        }

        .fc-button:active {
          border-color: var(--pink-700) !important;
          box-shadow: 0 0 0 2px
            color-mix(in srgb, var(--pink-600) 20%, transparent) !important;
        }

        .fc-button-active,
        .fc-button-primary:not(:disabled).fc-button-active {
          background-image: var(--grad-pink) !important;
          border-color: transparent !important;
          color: #fff !important;
          box-shadow: var(--sh-pink) !important;
        }

        .fc-button-primary:not(:disabled).fc-button-active:focus,
        .fc-button-primary:not(:disabled):active:focus {
          box-shadow: 0 0 0 2px
            color-mix(in srgb, var(--pink-600) 30%, transparent) !important;
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
          color: var(--ink-soft);
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.7rem;
          padding: 0.75rem 0 !important;
          letter-spacing: 0.08em;
        }

        /* Weekend columns — a barely-there wash, matching the mockup's
           sober weekend treatment (never a status colour). */
        .fc-day-sat .fc-col-header-cell-cushion,
        .fc-day-sun .fc-col-header-cell-cushion {
          color: var(--teal-700);
        }
        .fc-daygrid-day.fc-day-sat,
        .fc-daygrid-day.fc-day-sun {
          background: color-mix(in srgb, var(--floss) 55%, transparent);
        }

        /* Day cell hover — pink wash, no scale jump (keeps the grid calm). */
        .fc-daygrid-day-frame {
          padding: 4px;
          transition:
            background-color 0.18s ease,
            box-shadow 0.18s ease;
          border-radius: 10px;
        }

        .fc-daygrid-day:hover .fc-daygrid-day-frame {
          background-color: var(--pink-50) !important;
          box-shadow: var(--sh-sm);
        }

        /* Selected day (drives the day panel) — a teal ring, never fights
           "today"'s filled pink circle. */
        .fc-day-selected .fc-daygrid-day-frame {
          box-shadow: inset 0 0 0 2px var(--teal-600);
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

        /* Day View & Week View Events — sober pastel blocks. */
        .fc-timegrid-event {
          border-radius: 8px !important;
          box-shadow: var(--sh-xs);
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
          color: var(--ink-soft);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .fc-timegrid-now-indicator-line {
          border-color: var(--pink-600);
          border-width: 2px;
        }

        .fc-timegrid-now-indicator-arrow {
          border-color: var(--pink-600);
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
              eventDidMount={handleEventDidMount}
              dayCellContent={renderDayCellContent}
              dayCellClassNames={dayCellClassNames}
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
