"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { format, parse, startOfDay, endOfDay, isSameDay } from "date-fns";
import {
  CheckCircle2,
  Edit,
  ListFilter,
  MoreHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";

import { api, type RouterOutputs } from "@/trpc/react";
import { BirthdayBanner } from "@/components/birthday/birthday-banner";
import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppLoader } from "@/components/ui/app-loader";
import { RefreshOverlay } from "@/components/ui/refresh-overlay";
import { LessonEditDialog } from "@/components/lessons/lesson-edit-dialog";
import { AttendanceDialog } from "@/app/(root)/calendar/_components/attendance-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useFilterParams } from "@/lib/use-filter-params";
import { useCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";

type LessonStatus = "PENDING" | "COMPLETE" | "CANCELLED";

const STATUS_LABELS: Record<LessonStatus, string> = {
  COMPLETE: "Complete",
  CANCELLED: "Cancelled",
  PENDING: "Pending",
};

// Sober status chip — background/foreground bound to the real LessonStatus
// enum. No ornament: the rail node blooms, the data chip stays plain.
const CHIP_STYLES: Record<LessonStatus, string> = {
  COMPLETE: "bg-ok-bg text-ok-fg",
  CANCELLED: "bg-no-bg text-no-fg",
  PENDING: "bg-wait-bg text-wait-fg",
};

// The rail's blossom node colour per status (COMPLETE→ok, CANCELLED→no,
// PENDING→wait) — matches today-lessons-table.tsx's NODE_COLORS exactly.
const NODE_COLORS: Record<LessonStatus, string> = {
  COMPLETE: "text-ok-dot",
  CANCELLED: "text-no-dot",
  PENDING: "text-wait-dot",
};

// Only COMPLETE is billable. Every lesson card says so next to its amount so
// the figure is never mistaken for revenue.
const BILL_CAPTION: Record<LessonStatus, string> = {
  COMPLETE: "billable",
  PENDING: "not billed yet",
  CANCELLED: "not billed",
};

const BILL_CAPTION_CLASS: Record<LessonStatus, string> = {
  COMPLETE: "text-ok-fg",
  PENDING: "text-wait-fg",
  CANCELLED: "text-no-fg",
};

const getStatusChip = (status: LessonStatus) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
      CHIP_STYLES[status],
    )}
  >
    {STATUS_LABELS[status]}
  </span>
);

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const INITIAL_FROM = startOfDay(new Date());
const INITIAL_TO = endOfDay(new Date());

type Lesson = RouterOutputs["lesson"]["getAll"][number];

type DayGroup = {
  date: Date;
  lessons: Lesson[];
};

type StudentOption = {
  id: string;
  name: string;
};

interface LessonsPageProps {
  students: StudentOption[];
  initialLessons: Lesson[];
}

export function LessonsPage({ students, initialLessons }: LessonsPageProps) {
  const utils = api.useUtils();
  const queryClient = useQueryClient();
  const { searchParams, setParams } = useFilterParams();
  const { currency } = useCurrency();
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [attendanceLesson, setAttendanceLesson] = useState<Lesson | null>(null);
  const [deleteLesson, setDeleteLesson] = useState<Lesson | null>(null);

  // Filters live in the URL (shareable + SSR-consistent). Dates are memoised off
  // the raw `yyyy-MM-dd` params so their identity is stable across renders —
  // otherwise the query key would change every render and refetch in a loop.
  const studentId = searchParams.get("student") ?? "all";
  const statusParam = searchParams.get("status");
  const status: LessonStatus | "all" =
    statusParam === "COMPLETE" ||
    statusParam === "CANCELLED" ||
    statusParam === "PENDING"
      ? statusParam
      : "all";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const fromDate = useMemo(
    () =>
      fromParam
        ? startOfDay(parse(fromParam, "yyyy-MM-dd", new Date()))
        : INITIAL_FROM,
    [fromParam],
  );
  const toDate = useMemo(
    () =>
      toParam ? endOfDay(parse(toParam, "yyyy-MM-dd", new Date())) : INITIAL_TO,
    [toParam],
  );

  const setStudentId = (value: string) =>
    setParams({ student: value === "all" ? null : value });
  const setStatus = (value: string) =>
    setParams({ status: value === "all" ? null : value });
  const setFromDate = (date: Date | undefined) =>
    setParams({ from: date ? format(date, "yyyy-MM-dd") : null });
  const setToDate = (date: Date | undefined) =>
    setParams({ to: date ? format(date, "yyyy-MM-dd") : null });

  const filters = useMemo(
    () => ({
      studentId: studentId === "all" ? undefined : studentId,
      status: status === "all" ? undefined : status,
      from: fromDate,
      to: toDate,
    }),
    [studentId, status, fromDate, toDate],
  );

  const isDefaultFilters =
    studentId === "all" && status === "all" && !fromParam && !toParam;

  const {
    data: lessons = [],
    isPending,
    isFetching,
  } = api.lesson.getAll.useQuery(filters, {
    initialData: isDefaultFilters ? initialLessons : undefined,
    placeholderData: keepPreviousData,
  });

  const isLoading = isPending && lessons.length === 0;
  // keepPreviousData keeps the old rows on screen during a filter refetch;
  // surface the in-flight fetch so the swap isn't silent.
  const isRefreshing = isFetching && !isLoading;

  // Group the already-sorted lessons (API returns date desc) by calendar day,
  // under a serif day-divider heading — the "blossom timeline" river.
  const dayGroups = useMemo<DayGroup[]>(() => {
    const groups: DayGroup[] = [];
    for (const lesson of lessons) {
      const lessonDate = new Date(lesson.date);
      const current = groups[groups.length - 1];
      if (current && isSameDay(current.date, lessonDate)) {
        current.lessons.push(lesson);
      } else {
        groups.push({ date: lessonDate, lessons: [lesson] });
      }
    }
    return groups;
  }, [lessons]);

  const deleteMutation = api.lesson.delete.useMutation({
    mutationKey: ["lesson-write"],
    onMutate: async ({ id }) => {
      // Cancel any outgoing refetches
      await utils.lesson.getAll.cancel({});

      // Snapshot current cached data (with current filters)
      const previousData = utils.lesson.getAll.getData(filters);

      // Optimistically close modal and show toast instantly
      toast.success("Lesson deleted", { id: "lesson-delete" });
      setDeleteLesson(null);

      // Optimistically remove the deleted lesson from cache
      utils.lesson.getAll.setData(filters, (old) =>
        old ? old.filter((l) => l.id !== id) : old,
      );

      return { previousData };
    },

    onSuccess: () => {
      // Handled in onMutate
    },

    onError: (error, _input, context) => {
      toast.error(error.message ?? "Failed to delete lesson", {
        id: "lesson-delete",
      });
      // Rollback on error
      if (context?.previousData) {
        utils.lesson.getAll.setData(filters, context.previousData);
      }
    },

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

  const resetFilters = () =>
    setParams({ student: null, status: null, from: null, to: null });

  return (
    <>
      {/* ═══════════ FILTERS ═══════════ */}
      <section
        className="px-4 lg:px-6"
        aria-labelledby="lessons-filters-heading"
      >
        <BirthdayBanner
          text="Each lesson you give echoes forever 🎵"
          icon="🎵"
          storageKey="lessons"
          leftEmojis={["🎵", "🎹", "🎵"]}
        />

        <h2 id="lessons-filters-heading" className="sr-only">
          Filter lessons
        </h2>

        <div className="bg-card/90 rounded-[calc(var(--radius)+8px)] border border-pink-100 p-3.5 shadow-[var(--sh-sm)] backdrop-blur-sm md:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:items-end md:gap-3.5">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] text-pink-700 uppercase">
                <Users className="size-3.5" aria-hidden="true" />
                Student
              </label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger
                  aria-label="Filter by student"
                  className="h-11 w-full rounded-full border-pink-200 bg-pink-50 text-sm focus:ring-pink-400 md:h-10"
                >
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] text-pink-700 uppercase">
                <ListFilter className="size-3.5" aria-hidden="true" />
                Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger
                  aria-label="Filter by status"
                  className="h-11 w-full rounded-full border-pink-200 bg-pink-50 text-sm focus:ring-pink-400 md:h-10"
                >
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="COMPLETE">Complete</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-[0.08em] text-pink-700 uppercase">
                From
              </label>
              <DatePicker
                date={fromDate}
                onDateChange={setFromDate}
                placeholder="Start date"
                className="h-11 w-full rounded-full border-pink-200 bg-pink-50 text-sm hover:bg-pink-100 md:h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-[0.08em] text-pink-700 uppercase">
                To
              </label>
              <DatePicker
                date={toDate}
                onDateChange={setToDate}
                placeholder="End date"
                className="h-11 w-full rounded-full border-pink-200 bg-pink-50 text-sm hover:bg-pink-100 md:h-10"
              />
            </div>

            <Button
              variant="outline"
              onClick={resetFilters}
              className="bday-animate-button h-11 w-full rounded-full border-pink-200 text-pink-600 hover:bg-pink-100 md:h-10 md:w-full"
            >
              Reset
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════ THE RIVER — the day-grouped blossom timeline ═══════════ */}
      <section className="px-4 lg:px-6" aria-labelledby="lessons-river-heading">
        <div className="mb-4 flex items-center gap-2 md:mb-5">
          <Blossom size={17} className="text-bubblegum" />
          <h2
            id="lessons-river-heading"
            className="text-ink font-serif text-xl font-normal sm:text-2xl"
          >
            Every lesson, newest first
          </h2>
        </div>

        <div className="relative">
          <RefreshOverlay active={isRefreshing} />
          <div
            className={cn(
              "transition-opacity",
              isRefreshing && "pointer-events-none opacity-60",
            )}
          >
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <AppLoader size="sm" />
              </div>
            ) : lessons.length === 0 ? (
              <div className="bg-card/70 relative isolate flex flex-col items-center overflow-hidden rounded-[calc(var(--radius)+8px)] border border-pink-100 px-6 py-14 text-center">
                <Blossom
                  size={84}
                  className="text-bubblegum absolute -top-5 -right-5 -z-10 opacity-30"
                />
                <Mochi mood="sleepy" bob size={128} />
                <h3 className="text-ink mt-4 text-lg font-semibold">
                  No lessons scheduled yet
                </h3>
                <p className="text-ink-soft mt-1 text-sm">
                  Your piano week is waiting for music.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-8 md:gap-10">
                {dayGroups.map((group) => {
                  const isToday = isSameDay(group.date, new Date());

                  return (
                    <div key={group.lessons[0]!.id}>
                      {/* The screen's one budgeted scalloped edge lives here
                          (not the hero — see lessons-hero.tsx's docblock): a
                          --floss wash "sticky note" head, per the mockup's
                          `.day__head` recipe, translated to the shared
                          scallop-b utility. */}
                      {/* scallop-b's bottom ~11px is a repeating scalloped
                          cutout (see globals.css), not a flat edge — its
                          forced 14px padding-bottom is only just enough
                          clearance for content sitting flush against it, so
                          this row needs real breathing room (a margin, which
                          the mask rule doesn't override) between the text and
                          that cutout, not just the mask's own padding. */}
                      <div className="scallop-b bg-floss relative mb-4 rounded-t-2xl px-4 pt-4 md:mb-5 md:px-4.5 md:pt-4.5">
                        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="text-ink font-serif text-lg font-normal sm:text-xl">
                            {format(group.date, "EEEE, MMMM d")}
                          </h3>
                          {isToday && (
                            <span className="rounded-full border border-pink-100 bg-pink-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-pink-700 uppercase">
                              Today
                            </span>
                          )}
                        </div>
                      </div>

                      <ol className="flex flex-col gap-4">
                        {group.lessons.map((lesson, idx) => {
                          const lessonStatus = lesson.status as LessonStatus;
                          const isCancelled = lessonStatus === "CANCELLED";
                          const isLessonPending = lessonStatus === "PENDING";
                          const isLastInGroup =
                            idx === group.lessons.length - 1;

                          return (
                            <li
                              key={lesson.id}
                              className="rise grid grid-cols-[24px_minmax(0,1fr)] gap-x-2 gap-y-1 sm:grid-cols-[78px_30px_minmax(0,1fr)] sm:gap-x-3.5 sm:gap-y-0"
                              style={{ "--i": idx } as CSSProperties}
                            >
                              {/* Time + duration — a fixed column on the left
                                  at ≥sm, stacked above the card on phone. */}
                              <div className="col-start-2 row-start-1 flex items-baseline gap-1.5 sm:col-start-1 sm:flex-col sm:items-end sm:gap-0 sm:pt-4 sm:text-right">
                                <span className="text-ink text-[13px] font-bold tracking-tight tabular-nums">
                                  {format(new Date(lesson.date), "h:mm a")}
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
                                    isLastInGroup ? "h-7" : "-bottom-4",
                                  )}
                                  style={{
                                    backgroundImage:
                                      "linear-gradient(180deg, var(--mint), var(--cotton))",
                                  }}
                                />
                                <div
                                  className={cn(
                                    "relative z-[1] mt-2 grid size-[22px] shrink-0 place-items-center sm:mt-3",
                                    NODE_COLORS[lessonStatus],
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
                                  <Blossom
                                    size={21}
                                    className="relative z-[1]"
                                  />
                                </div>
                              </div>

                              {/* The lesson card — sober data layer, no ornament. */}
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
                                    <AvatarImage
                                      src={lesson.student.avatar ?? undefined}
                                    />
                                    <AvatarFallback className="text-mint-ink [background-image:var(--grad-brand)] text-xs font-bold">
                                      {getInitials(lesson.student.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <div
                                      className={cn(
                                        "text-ink truncate text-[15px] font-semibold tracking-tight",
                                        isCancelled &&
                                          "text-ink-soft line-through decoration-[1.5px]",
                                      )}
                                    >
                                      {lesson.student.name}
                                    </div>
                                    {lesson.piece && (
                                      <p className="text-ink-soft mt-1 truncate font-serif text-sm italic">
                                        {lesson.piece.title}
                                      </p>
                                    )}
                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                      {getStatusChip(lessonStatus)}
                                      {lesson.isOnline && (
                                        <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-teal-700">
                                          Online
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {isCancelled && lesson.cancelReason && (
                                  <p className="bg-no-bg text-no-fg rounded-lg px-2.5 py-2 text-xs font-medium">
                                    <span className="font-semibold">
                                      Reason:{" "}
                                    </span>
                                    {lesson.cancelReason}
                                  </p>
                                )}

                                <div className="border-border flex flex-wrap items-center gap-3 border-t border-dashed pt-3">
                                  <div className="flex flex-col">
                                    <span
                                      className={cn(
                                        "text-[15px] font-bold tracking-tight tabular-nums",
                                        isCancelled
                                          ? "text-no-fg line-through decoration-[1.5px]"
                                          : "text-ink",
                                      )}
                                    >
                                      {formatCurrency(lesson.rate, currency)}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-[10px] font-semibold",
                                        BILL_CAPTION_CLASS[lessonStatus],
                                      )}
                                    >
                                      {BILL_CAPTION[lessonStatus]}
                                    </span>
                                  </div>

                                  <div className="ml-auto flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      onClick={() =>
                                        setAttendanceLesson(lesson)
                                      }
                                      className={cn(
                                        "h-9 rounded-full px-4 text-xs font-semibold sm:h-10 sm:px-5 sm:text-sm",
                                        isLessonPending
                                          ? "text-mint-ink hover:text-mint-ink [background-image:var(--grad-mint)] shadow-[var(--sh-mint)] hover:brightness-95"
                                          : "border-border bg-card text-ink hover:bg-muted border shadow-[var(--sh-sm)]",
                                      )}
                                    >
                                      Mark attendance
                                    </Button>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          className="border-border bg-card text-ink hover:bg-muted size-9 shrink-0 rounded-full border p-0 shadow-[var(--sh-sm)] sm:size-10"
                                        >
                                          <span className="sr-only">
                                            More actions for{" "}
                                            {lesson.student.name}
                                          </span>
                                          <MoreHorizontal className="size-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        className="w-48 rounded-xl border-pink-100"
                                      >
                                        <DropdownMenuItem
                                          onSelect={() => setEditLesson(lesson)}
                                          className="rounded-lg hover:bg-pink-50 focus:bg-pink-50"
                                        >
                                          <Edit className="mr-2 size-4" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onSelect={() =>
                                            setAttendanceLesson(lesson)
                                          }
                                          className="rounded-lg hover:bg-pink-50 focus:bg-pink-50"
                                        >
                                          <CheckCircle2 className="mr-2 size-4" />
                                          Mark attendance
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          variant="destructive"
                                          onSelect={() =>
                                            setDeleteLesson(lesson)
                                          }
                                          className="rounded-lg"
                                        >
                                          <Trash2 className="mr-2 size-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </article>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {editLesson && (
        <LessonEditDialog
          open={!!editLesson}
          onOpenChange={(open) => !open && setEditLesson(null)}
          lesson={{
            id: editLesson.id,
            studentName: editLesson.student.name,
            date: new Date(editLesson.date),
            duration: editLesson.duration,
            status: editLesson.status as LessonStatus,
            isOnline: editLesson.isOnline,
            pieceId: editLesson.piece?.id ?? editLesson.pieceId ?? null,
          }}
        />
      )}

      {attendanceLesson && (
        <AttendanceDialog
          open={!!attendanceLesson}
          onOpenChange={(open) => !open && setAttendanceLesson(null)}
          lesson={{
            id: attendanceLesson.id,
            studentName: attendanceLesson.student.name,
            duration: attendanceLesson.duration,
            status: attendanceLesson.status as LessonStatus,
            isOnline: attendanceLesson.isOnline,
            rate: attendanceLesson.rate,
            actualMin: attendanceLesson.actualMin,
            cancelReason: attendanceLesson.cancelReason,
            note: attendanceLesson.note,
            score: attendanceLesson.score,
            date: new Date(attendanceLesson.date),
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteLesson}
        onOpenChange={(open) => !open && setDeleteLesson(null)}
        title="Delete lesson"
        description="Are you sure you want to delete this lesson? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          deleteLesson && deleteMutation.mutate({ id: deleteLesson.id })
        }
      />
    </>
  );
}
