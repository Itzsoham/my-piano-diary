"use client";

import { Fragment, useState, type CSSProperties } from "react";
import { CalendarDays } from "lucide-react";
import { useSession } from "next-auth/react";
import { AttendanceDialog } from "@/app/(root)/calendar/_components/attendance-dialog";
import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import {
  createDateInTimezone,
  formatInTimezone,
  fromUTC,
  getBrowserTimezone,
  isSameDayInTimezone,
} from "@/lib/timezone";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

type LessonStatus = "PENDING" | "COMPLETE" | "CANCELLED";

const toLessonStatus = (status: string): LessonStatus => {
  if (status === "COMPLETE" || status === "CANCELLED" || status === "PENDING") {
    return status;
  }

  return "PENDING";
};

type TodayLessonsTableProps = {
  className?: string;
  contentClassName?: string;
};

type SelectedLesson = {
  id: string;
  studentName: string;
  duration: number;
  status: LessonStatus;
  isOnline: boolean;
  rate: number;
  actualMin: number | null;
  cancelReason: string | null;
  note: string | null;
  date: Date;
};

// Sober status chip — background/foreground bound to the LessonStatus enum.
// No ornament: the timeline node blooms, the data chip stays plain.
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

// The blossom node colour for each status (COMPLETE→ok, CANCELLED→no, PENDING→wait).
const NODE_COLORS: Record<LessonStatus, string> = {
  COMPLETE: "text-ok-dot",
  CANCELLED: "text-no-dot",
  PENDING: "text-wait-dot",
};

const getStatusChip = (status: LessonStatus) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
      CHIP_STYLES[status],
    )}
  >
    {CHIP_LABELS[status]}
  </span>
);

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function TodayLessonsTable({
  className,
  contentClassName,
}: TodayLessonsTableProps = {}) {
  const { data: session } = useSession();
  const timezone = session?.user?.timezone ?? getBrowserTimezone();
  const [date, setDate] = useState<Date>(() => new Date());
  const [open, setOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<SelectedLesson | null>(
    null,
  );
  const { currency } = useCurrency();

  const {
    data: lessons = [],
    isLoading,
    refetch,
  } = api.earnings.getTodayLessons.useQuery({ date });

  // The headline figure is COMPLETE-only ("billable"): PENDING lessons are not
  // earned yet, and CANCELLED ones are never billed (the server zeroes their
  // `earnings`, so the caption reads their `rate` — what would have been billed).
  // The honest caption below the pill spells out the full split so the number is
  // never ambiguous.
  const summary = lessons.reduce(
    (acc, lesson) => {
      const status = toLessonStatus(lesson.status);
      if (status === "COMPLETE") {
        acc.billableTotal += lesson.earnings;
        acc.completeCount += 1;
      } else if (status === "PENDING") {
        acc.pendingTotal += lesson.earnings;
        acc.pendingCount += 1;
      } else {
        acc.cancelledTotal += lesson.rate;
        acc.cancelledCount += 1;
      }
      return acc;
    },
    {
      billableTotal: 0,
      completeCount: 0,
      pendingTotal: 0,
      pendingCount: 0,
      cancelledTotal: 0,
      cancelledCount: 0,
    },
  );

  const captionParts = [
    summary.completeCount > 0
      ? `${summary.completeCount} COMPLETE — billed`
      : null,
    summary.pendingCount > 0
      ? `${summary.pendingCount} PENDING — ${formatCurrency(summary.pendingTotal, currency)} not counted yet`
      : null,
    summary.cancelledCount > 0
      ? `${summary.cancelledCount} CANCELLED — ${formatCurrency(summary.cancelledTotal, currency)} never billed`
      : null,
  ].filter((part): part is string => part !== null);
  // Render the selected day, the "today" check, and lesson times in the
  // teacher's configured timezone (not the browser's) so they always agree
  // with the server, which buckets lessons by the session timezone.
  const formattedDate = formatInTimezone(date, timezone, "EEEE, MMMM do");
  const isToday = isSameDayInTimezone(date, new Date(), timezone);

  const formatTime = (lessonDate: Date) =>
    formatInTimezone(new Date(lessonDate), timezone, "hh:mm a");

  const openAttendanceDialog = (lesson: (typeof lessons)[number]) => {
    setSelectedLesson({
      id: lesson.id,
      studentName: lesson.student.name,
      duration: lesson.duration,
      status: toLessonStatus(lesson.status),
      isOnline: lesson.isOnline,
      rate: lesson.rate,
      actualMin: lesson.actualMin,
      cancelReason: lesson.cancelReason,
      note: lesson.note,
      date: lesson.date,
    });
    setOpen(true);
  };

  // Skeleton rows share the timeline grid so the loading state reads as the
  // real layout, not a foreign placeholder.
  const skeletonRows = Array.from({ length: 4 }, (_, index) => (
    <li
      key={`skeleton-${index}`}
      className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-2 gap-y-1 sm:grid-cols-[78px_30px_minmax(0,1fr)] sm:gap-x-3.5 sm:gap-y-0"
    >
      <div className="col-start-2 row-start-1 sm:col-start-1 sm:pt-4 sm:text-right">
        <Skeleton className="h-3.5 w-16 sm:ml-auto" />
      </div>
      <div className="relative col-start-1 row-span-2 row-start-1 flex justify-center sm:col-start-2 sm:row-span-1">
        <span
          aria-hidden="true"
          className={cn(
            "bg-border absolute top-0 w-0.5 rounded-full",
            index === 3 ? "h-7" : "-bottom-4",
          )}
        />
        <Skeleton className="relative z-[1] mt-2 size-[22px] rounded-full sm:mt-3" />
      </div>
      <div className="border-border bg-card col-start-2 row-start-2 flex flex-col gap-3 rounded-2xl border p-3.5 shadow-[var(--sh-sm)] sm:col-start-3 sm:row-start-1 sm:p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <div className="border-border flex items-center justify-between gap-3 border-t border-dashed pt-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-24 rounded-full" />
        </div>
      </div>
    </li>
  ));

  return (
    <Card
      className={cn(
        "border-border bg-card flex h-full flex-col overflow-hidden rounded-[2rem] border shadow-none backdrop-blur",
        className,
      )}
    >
      <CardHeader className="gap-3 bg-transparent">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2.5">
            <CardTitle className="text-ink flex items-center gap-2 font-serif text-2xl font-normal sm:text-[1.75rem]">
              <Blossom size={18} className="text-bubblegum" />
              <span>
                Today&apos;s Focus <span aria-hidden="true">🎹</span>
              </span>
            </CardTitle>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="border-border bg-card text-ink-soft inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border px-3.5 text-left text-sm font-medium shadow-[var(--sh-sm)] transition-colors hover:border-[var(--line-pink)] hover:text-pink-700"
                >
                  <CalendarDays
                    className="size-4 text-pink-400"
                    aria-hidden="true"
                  />
                  <span>{formattedDate}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromUTC(date, timezone)}
                  onSelect={(day) =>
                    day &&
                    setDate(
                      createDateInTimezone(
                        day.getFullYear(),
                        day.getMonth(),
                        day.getDate(),
                        12,
                        0,
                        timezone,
                      ),
                    )
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col items-start gap-[9px] self-start">
            <p className="border-border flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border [background-image:linear-gradient(100deg,var(--teal-100),var(--pink-100))] px-4 py-2.5 text-[12.5px] font-semibold text-teal-700">
              <span>{isToday ? "Today's Total" : "Day Total"}</span>
              <span aria-hidden="true" className="text-ink-soft">
                ·
              </span>
              <span>
                <b className="text-ink text-[13.5px] font-bold tracking-tight tabular-nums">
                  {formatCurrency(summary.billableTotal, currency)}
                </b>{" "}
                billable
              </span>
              <span aria-hidden="true" className="text-ink-soft">
                ·
              </span>
              <span>
                <b className="text-ink font-bold tabular-nums">
                  {lessons.length} lessons
                </b>{" "}
                on the books
              </span>
            </p>
            {captionParts.length > 0 && (
              <p className="text-ink-soft flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12.5px] leading-normal">
                {captionParts.map((part, index) => (
                  <Fragment key={part}>
                    {index > 0 && (
                      <i
                        aria-hidden="true"
                        className="bg-ink-soft size-[3px] flex-none rounded-full"
                      />
                    )}
                    <span>{part}</span>
                  </Fragment>
                ))}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "min-h-0 flex-1 px-4 pt-1 pb-5 sm:px-6 sm:pb-6",
          contentClassName,
        )}
      >
        {isLoading ? (
          <ol className="flex flex-col gap-4">{skeletonRows}</ol>
        ) : lessons.length > 0 ? (
          <ol className="flex flex-col gap-4">
            {lessons.map((lesson, index) => {
              const status = toLessonStatus(lesson.status);
              const isCancelled = status === "CANCELLED";
              const isPending = status === "PENDING";
              const isLast = index === lessons.length - 1;

              return (
                <li
                  key={lesson.id}
                  className="rise grid grid-cols-[24px_minmax(0,1fr)] gap-x-2 gap-y-1 sm:grid-cols-[78px_30px_minmax(0,1fr)] sm:gap-x-3.5 sm:gap-y-0"
                  style={{ "--i": index } as CSSProperties}
                >
                  {/* Time + duration: a fixed column on the left at ≥sm, stacked
                      above the card on phone. */}
                  <div className="col-start-2 row-start-1 flex items-baseline gap-1.5 sm:col-start-1 sm:flex-col sm:items-end sm:gap-0 sm:pt-4 sm:text-right">
                    <span className="text-ink text-[13px] font-bold tracking-tight tabular-nums">
                      {formatTime(lesson.date)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-ink-soft sm:hidden"
                    >
                      ·
                    </span>
                    <span className="text-ink-soft text-[11px] font-medium">
                      {lesson.duration} min
                    </span>
                  </div>

                  {/* The soft rail + the status-coloured blossom node. */}
                  <div className="relative col-start-1 row-span-2 row-start-1 flex justify-center sm:col-start-2 sm:row-span-1">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-0 w-0.5 rounded-full",
                        isLast ? "h-7" : "-bottom-4",
                      )}
                      style={{
                        backgroundImage:
                          "linear-gradient(180deg, var(--mint), var(--cotton))",
                      }}
                    />
                    <div
                      className={cn(
                        "relative z-[1] mt-2 grid size-[22px] shrink-0 place-items-center sm:mt-3",
                        NODE_COLORS[status],
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
                      <Blossom size={21} className="relative z-[1]" />
                    </div>
                  </div>

                  {/* The lesson card — strictly sober: no ornament inside. */}
                  <article
                    className={cn(
                      "col-start-2 row-start-2 flex flex-col gap-3 rounded-2xl border p-3.5 shadow-[var(--sh-sm)] sm:col-start-3 sm:row-start-1 sm:p-4",
                      isCancelled
                        ? "border-[var(--line-pink)] [background-image:linear-gradient(160deg,var(--pink-50),var(--card)_62%)]"
                        : "border-border bg-card",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="border-card size-10 shrink-0 border-2 shadow-[var(--sh-sm)]">
                        <AvatarImage src={lesson.student.avatar ?? undefined} />
                        <AvatarFallback className="text-mint-ink [background-image:var(--grad-brand)] text-xs font-bold">
                          {getInitials(lesson.student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-ink truncate text-[15px] font-semibold tracking-tight">
                          {lesson.student.name}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {getStatusChip(status)}
                          {lesson.isOnline && (
                            <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-teal-700">
                              Online
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-border flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-dashed pt-3">
                      <span
                        className={cn(
                          "text-[15px] font-bold tracking-tight tabular-nums",
                          isCancelled
                            ? "text-no-fg line-through decoration-[1.5px]"
                            : "text-ink",
                        )}
                      >
                        {formatCurrency(lesson.earnings, currency)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => openAttendanceDialog(lesson)}
                        className={cn(
                          "h-11 w-full rounded-full px-5 text-sm font-semibold sm:ml-auto sm:w-auto",
                          isPending
                            ? "text-mint-ink hover:text-mint-ink [background-image:var(--grad-mint)] shadow-[var(--sh-mint)] hover:brightness-95"
                            : "border-border bg-card text-ink hover:bg-muted hover:text-ink border shadow-[var(--sh-sm)]",
                        )}
                      >
                        {isPending ? "Mark" : "Update"}
                      </Button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center sm:py-16">
            <Mochi mood="sleepy" bob size={116} />
            <p className="text-ink mt-4 text-base font-semibold">
              No lessons today 🎀
            </p>
            <p className="text-ink-soft mt-1 text-sm">
              Maybe it&apos;s a rest day?
            </p>
          </div>
        )}

        {selectedLesson && (
          <AttendanceDialog
            open={open}
            onOpenChange={(nextOpen) => setOpen(nextOpen)}
            lesson={selectedLesson}
            onSuccess={() => {
              void refetch();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
