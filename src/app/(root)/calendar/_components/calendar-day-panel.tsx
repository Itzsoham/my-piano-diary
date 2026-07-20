"use client";

import { Plus } from "lucide-react";
import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import { formatInTimezone, isSameDayInTimezone } from "@/lib/timezone";
import { cn } from "@/lib/utils";

type LessonStatus = "PENDING" | "COMPLETE" | "CANCELLED";

interface PanelLesson {
  id: string;
  date: Date;
  duration: number;
  status: LessonStatus;
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

interface CalendarDayPanelProps {
  className?: string;
  selectedDate: Date;
  lessons: PanelLesson[];
  timezone: string;
  onAddLesson: (date: Date) => void;
  onLessonClick: (lesson: PanelLesson) => void;
}

const CHIP_STYLES: Record<LessonStatus, string> = {
  COMPLETE: "bg-ok-bg text-ok-fg",
  CANCELLED: "bg-no-bg text-no-fg",
  PENDING: "bg-wait-bg text-wait-fg",
};

const CHIP_LABELS: Record<LessonStatus, string> = {
  COMPLETE: "Complete",
  CANCELLED: "Cancelled",
  PENDING: "Pending",
};

// Status-coloured Blossom node — same NODE_COLORS convention as
// today-lessons-table.tsx, so the agenda anatomy reads identically everywhere.
const NODE_COLORS: Record<LessonStatus, string> = {
  COMPLETE: "text-ok-dot",
  CANCELLED: "text-no-dot",
  PENDING: "text-wait-dot",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/**
 * The day panel — the Blossom Diary companion to the month grid. The real app
 * hides individual lesson chips in month view (eventDisplay:"none", so the
 * grid stays scannable), which means this panel is the ONLY place a teacher
 * can see or act on a specific day's lessons without switching to week/day
 * view. Same vertical-timeline anatomy as today-lessons-table.tsx: a rail +
 * status-Blossom node + a sober lesson card, grouped under one honest,
 * COMPLETE-only billable summary.
 */
export function CalendarDayPanel({
  className,
  selectedDate,
  lessons,
  timezone,
  onAddLesson,
  onLessonClick,
}: CalendarDayPanelProps) {
  const { currency } = useCurrency();

  const dayLessons = lessons
    .filter((lesson) =>
      isSameDayInTimezone(new Date(lesson.date), selectedDate, timezone),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const summary = dayLessons.reduce(
    (acc, lesson) => {
      if (lesson.status === "COMPLETE") {
        acc.billableTotal += lesson.rate;
        acc.completeCount += 1;
      } else if (lesson.status === "PENDING") {
        acc.pendingCount += 1;
      } else {
        acc.cancelledCount += 1;
      }
      return acc;
    },
    { billableTotal: 0, completeCount: 0, pendingCount: 0, cancelledCount: 0 },
  );

  const formattedDate = formatInTimezone(
    selectedDate,
    timezone,
    "EEEE, MMMM d",
  );
  const formatTime = (date: Date) =>
    formatInTimezone(new Date(date), timezone, "h:mm a");

  return (
    <aside
      className={cn(
        "border-border bg-card relative flex min-w-0 flex-col overflow-hidden rounded-[calc(var(--radius)+8px)] border shadow-(--sh-lg)",
        className,
      )}
      aria-label={`Lessons on ${formattedDate}`}
    >
      <header className="scallop-b relative bg-[linear-gradient(180deg,var(--pink-50),var(--pink-100))] px-4.5 pt-4 pb-4.5">
        <h2 className="text-ink font-serif text-[1.2rem] leading-tight font-normal sm:text-[1.35rem]">
          {formattedDate}
        </h2>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-pink-700 tabular-nums">
          <span className="text-ink font-bold">
            {formatCurrency(summary.billableTotal, currency)}
          </span>
          <span>billable</span>
          {summary.pendingCount > 0 && (
            <>
              <span aria-hidden="true" className="text-pink-700/45">
                ·
              </span>
              <span className="text-ink-soft font-semibold">
                {summary.pendingCount} pending
              </span>
            </>
          )}
          {summary.cancelledCount > 0 && (
            <>
              <span aria-hidden="true" className="text-pink-700/45">
                ·
              </span>
              <span className="text-ink-soft font-semibold">
                {summary.cancelledCount} cancelled
              </span>
            </>
          )}
          {dayLessons.length === 0 && (
            <span className="text-ink-soft font-semibold">no lessons</span>
          )}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pt-4">
        {dayLessons.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-3 pt-2 pb-5 text-center">
            <Mochi mood="sleepy" size={92} />
            <Blossom size={16} className="text-bubblegum mt-1" />
            <p className="text-ink text-[0.95rem] font-semibold">A quiet day</p>
            <p className="text-ink-soft max-w-[28ch] text-sm">
              No lessons yet — your piano week is waiting for music.
            </p>
          </div>
        ) : (
          <ol className="flex flex-col gap-3 pb-2">
            {dayLessons.map((lesson, index) => {
              const isCancelled = lesson.status === "CANCELLED";
              const isLast = index === dayLessons.length - 1;

              return (
                <li
                  key={lesson.id}
                  className="grid grid-cols-[50px_18px_minmax(0,1fr)] items-start gap-x-2"
                >
                  <div className="pt-2.5 text-right">
                    <span className="text-ink block text-[11px] font-bold tracking-tight tabular-nums">
                      {formatTime(lesson.date)}
                    </span>
                    <span className="text-ink-soft mt-0.5 block text-[10px] font-medium">
                      {lesson.duration} min
                    </span>
                  </div>

                  <div className="relative flex justify-center self-stretch">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-0 w-0.5 rounded-full bg-[linear-gradient(180deg,var(--mint),var(--cotton))]",
                        isLast ? "h-6" : "-bottom-3",
                      )}
                    />
                    <div
                      className={cn(
                        "relative z-1 mt-2.5 grid size-4.5 shrink-0 place-items-center",
                        NODE_COLORS[lesson.status],
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute -inset-1 rounded-full bg-current opacity-20"
                      />
                      <span
                        aria-hidden="true"
                        className="bg-card absolute inset-0 rounded-full"
                      />
                      <Blossom size={17} className="relative z-1" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onLessonClick(lesson)}
                    className={cn(
                      "flex min-w-0 items-center gap-2.5 rounded-2xl border p-2.5 text-left shadow-(--sh-sm) transition-colors hover:bg-pink-50",
                      isCancelled
                        ? "border-(--line-pink) bg-[linear-gradient(160deg,var(--pink-50),var(--card)_62%)]"
                        : "border-border bg-card",
                    )}
                  >
                    <Avatar className="border-card size-8 shrink-0 border-2 shadow-(--sh-sm)">
                      <AvatarImage src={lesson.student.avatar ?? undefined} />
                      <AvatarFallback className="text-mint-ink [background-image:var(--grad-brand)] text-[10px] font-bold">
                        {getInitials(lesson.student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "text-ink truncate text-[13px] font-semibold",
                          isCancelled &&
                            "text-ink-soft line-through decoration-[1.5px]",
                        )}
                      >
                        {lesson.student.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",
                            CHIP_STYLES[lesson.status],
                          )}
                        >
                          {CHIP_LABELS[lesson.status]}
                        </span>
                        {lesson.isOnline && (
                          <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-teal-700">
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-ink shrink-0 text-[13px] font-bold tabular-nums",
                        isCancelled &&
                          "text-no-fg line-through decoration-[1.5px]",
                      )}
                    >
                      {formatCurrency(lesson.rate, currency)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="flex items-end gap-2.5 p-3.5">
        <button
          type="button"
          onClick={() => onAddLesson(selectedDate)}
          className="border-bubblegum flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border-2 border-dashed bg-pink-50 px-3.5 text-[13px] font-bold text-pink-700 transition-colors hover:bg-pink-100"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add lesson
        </button>
        <Mochi mood="sleepy" bob size={52} className="-mb-1 shrink-0" />
      </div>
    </aside>
  );
}
