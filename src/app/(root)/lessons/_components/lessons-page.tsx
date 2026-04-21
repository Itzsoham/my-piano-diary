"use client";

import { useEffect, useMemo, useState } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { CheckCircle2, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";

import { api, type RouterOutputs } from "@/trpc/react";
import { BirthdayBanner } from "@/components/birthday/birthday-banner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { LessonEditDialog } from "@/components/lessons/lesson-edit-dialog";
import { AttendanceDialog } from "@/app/(root)/calendar/_components/attendance-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

const statusLabels: Record<LessonStatus, string> = {
  COMPLETE: "Complete",
  CANCELLED: "Cancelled",
  PENDING: "Pending",
};

const statusClasses: Record<LessonStatus, string> = {
  COMPLETE:
    "bg-emerald-100 text-emerald-700 rounded-full px-3 py-1.5 text-xs md:text-sm font-medium",
  CANCELLED:
    "bg-rose-100 text-rose-700 rounded-full px-3 py-1.5 text-xs md:text-sm font-medium",
  PENDING:
    "bg-amber-100 text-amber-700 rounded-full px-3 py-1.5 text-xs md:text-sm font-medium",
};

type LessonStatus = "PENDING" | "COMPLETE" | "CANCELLED";

const INITIAL_FROM = startOfDay(new Date());
const INITIAL_TO = endOfDay(new Date());

const STORAGE_KEY = "lessons-filters";

type Lesson = RouterOutputs["lesson"]["getAll"][number];

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
  const [studentId, setStudentId] = useState("all");
  const [status, setStatus] = useState<LessonStatus | "all">("all");
  const [fromDate, setFromDate] = useState<Date | undefined>(INITIAL_FROM);
  const [toDate, setToDate] = useState<Date | undefined>(INITIAL_TO);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [attendanceLesson, setAttendanceLesson] = useState<Lesson | null>(null);
  const [deleteLesson, setDeleteLesson] = useState<Lesson | null>(null);

  // Load filters from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          studentId?: string;
          status?: LessonStatus | "all";
          from?: string;
          to?: string;
        };
        if (parsed.studentId) setStudentId(parsed.studentId);
        if (parsed.status) setStatus(parsed.status);
        if (parsed.from) setFromDate(new Date(parsed.from));
        if (parsed.to) setToDate(new Date(parsed.to));
      } catch (e) {
        console.error("Failed to parse saved filters", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;

    const filtersToSave = {
      studentId,
      status,
      from: fromDate?.toISOString(),
      to: toDate?.toISOString(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filtersToSave));
  }, [studentId, status, fromDate, toDate, isLoaded]);

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
    studentId === "all" &&
    status === "all" &&
    fromDate === INITIAL_FROM &&
    toDate === INITIAL_TO;

  const { data: lessons = [], isPending } = api.lesson.getAll.useQuery(
    filters,
    {
      initialData: isDefaultFilters ? initialLessons : undefined,
      placeholderData: keepPreviousData,
    },
  );

  const isLoading = isPending && lessons.length === 0;

  const columns: DataTableColumn<Lesson>[] = [
    {
      id: "date",
      header: "Date",
      cell: (lesson) => format(new Date(lesson.date), "MMM d, yyyy"),
    },
    {
      id: "time",
      header: "Time",
      cell: (lesson) => format(new Date(lesson.date), "h:mm a"),
    },
    {
      id: "student",
      header: "Student",
      cell: (lesson) => lesson.student.name,
      cellClassName: "font-medium",
    },
    {
      id: "piece",
      header: "Piece",
      cell: (lesson) => (
        <div className="max-w-37.5 truncate" title={lesson.piece?.title ?? ""}>
          {lesson.piece?.title ?? "None"}
        </div>
      ),
    },
    {
      id: "duration",
      header: "Duration",
      cell: (lesson) => `${lesson.duration} min`,
    },
    {
      id: "status",
      header: "Status",
      cell: (lesson) => (
        <Badge className={statusClasses[lesson.status as LessonStatus]}>
          {statusLabels[lesson.status as LessonStatus]}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (lesson) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="rounded-xl border-pink-100 bg-white shadow-lg"
          >
            <DropdownMenuItem
              onSelect={() => setEditLesson(lesson)}
              className="rounded-lg hover:bg-pink-50"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setAttendanceLesson(lesson)}
              className="rounded-lg hover:bg-pink-50"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark attendance
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteLesson(lesson)}
              className="rounded-lg text-rose-500 hover:bg-rose-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

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

  const resetFilters = () => {
    setStudentId("all");
    setStatus("all");
    setFromDate(INITIAL_FROM);
    setToDate(INITIAL_TO);
  };

  return (
    <div className="container mx-auto">
      <BirthdayBanner
        text="Each lesson you give echoes forever 🎵"
        icon="🎵"
        storageKey="lessons"
        leftEmojis={["🎵", "🎹", "🎵"]}
      />
      <div className="mb-6">
        <h1 className="bday-animate-title flex items-center gap-2 text-3xl font-bold tracking-tight">
          Lessons & Attendance
        </h1>
        <p className="text-muted-foreground mt-2">
          Track every beautiful session
        </p>
      </div>

      <div className="rounded-2xl border border-pink-100 bg-white/80 p-3 shadow-sm md:p-6">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-5 md:items-end md:gap-3">
          <div className="space-y-1 md:space-y-1.5">
            <label className="text-xs font-medium text-pink-700">Student</label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="h-11 w-full border-pink-200 bg-pink-50 text-sm focus:ring-pink-400 md:h-10">
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

          <div className="space-y-1 md:space-y-1.5">
            <label className="text-xs font-medium text-pink-700">Status</label>
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as LessonStatus | "all")
              }
            >
              <SelectTrigger className="h-11 w-full border-pink-200 bg-pink-50 text-sm focus:ring-pink-400 md:h-10">
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

          <div className="space-y-1 md:space-y-1.5">
            <label className="text-xs font-medium text-pink-700">From</label>
            <DatePicker
              date={fromDate}
              onDateChange={setFromDate}
              placeholder="Start date"
              className="h-11 w-full text-sm md:h-10"
            />
          </div>

          <div className="space-y-1 md:space-y-1.5">
            <label className="text-xs font-medium text-pink-700">To</label>
            <DatePicker
              date={toDate}
              onDateChange={setToDate}
              placeholder="End date"
              className="h-11 w-full text-sm md:h-10"
            />
          </div>

          <Button
            variant="outline"
            onClick={resetFilters}
            className="bday-animate-button h-11 w-full rounded-xl border-pink-200 text-pink-600 hover:bg-pink-100 md:h-10 md:w-full"
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="mt-6 border-t pt-6">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <AppLoader size="sm" />
          </div>
        ) : lessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 text-4xl">🎹</div>
            <div className="text-lg font-medium text-pink-700">
              No lessons scheduled yet
            </div>
            <div className="mt-1 text-sm text-pink-600/70">
              Your piano week is waiting for music.
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <DataTable
              className="hidden md:block"
              columns={columns}
              data={lessons}
              getRowKey={(lesson) => lesson.id}
              itemRowClassName="transition-colors hover:bg-pink-50"
            />

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <span className="rounded-full bg-pink-100 px-3 py-1 text-[11px] font-medium text-pink-600">
                      {format(new Date(lesson.date), "MMM d • h:mm a")}
                    </span>
                    <Badge
                      className={cn(
                        statusClasses[lesson.status as LessonStatus],
                        "px-2 py-0.5 text-[10px] md:text-[10px]",
                      )}
                    >
                      {statusLabels[lesson.status as LessonStatus]}
                    </Badge>
                  </div>

                  <div className="mb-4 flex items-center gap-3">
                    <Avatar className="size-7 border border-pink-100">
                      <AvatarImage src={lesson.student.avatar ?? ""} />
                      <AvatarFallback className="bg-pink-50 text-[10px] font-bold text-pink-600">
                        {lesson.student.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-semibold text-gray-900">
                        {lesson.student.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {lesson.piece?.title ?? "No piece"} • {lesson.duration}{" "}
                        min
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Button
                      className="flex-1 rounded-xl bg-pink-500 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-pink-600 active:scale-[0.98]"
                      onClick={() => setAttendanceLesson(lesson)}
                    >
                      Mark Attendance
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="size-10 rounded-xl border border-pink-100 text-pink-600 hover:bg-pink-50"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="rounded-xl border-pink-100 bg-white shadow-lg"
                      >
                        <DropdownMenuItem
                          onSelect={() => setEditLesson(lesson)}
                          className="rounded-lg hover:bg-pink-50"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onSelect={() => setAttendanceLesson(lesson)}
                          className="rounded-lg hover:bg-pink-50"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark attendance
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteLesson(lesson)}
                          className="rounded-lg text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

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
            actualMin: attendanceLesson.actualMin,
            cancelReason: attendanceLesson.cancelReason,
            note: attendanceLesson.note,
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
    </div>
  );
}
