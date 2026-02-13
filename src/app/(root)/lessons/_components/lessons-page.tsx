"use client";

import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  CheckCircle2,
  Edit,
  MoreHorizontal,
  Music2,
  Trash2,
} from "lucide-react";

import { api, type RouterOutputs } from "@/trpc/react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppLoader } from "@/components/ui/app-loader";
import { LessonEditDialog } from "@/components/lessons/lesson-edit-dialog";
import { AttendanceDialog } from "@/app/(root)/calendar/_components/attendance-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

const statusLabels: Record<LessonStatus, string> = {
  COMPLETE: "Complete",
  CANCELLED: "Cancelled",
  PENDING: "Pending",
};

const statusClasses: Record<LessonStatus, string> = {
  COMPLETE:
    "bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-xs font-medium",
  CANCELLED:
    "bg-rose-100 text-rose-700 rounded-full px-3 py-1 text-xs font-medium",
  PENDING:
    "bg-amber-100 text-amber-700 rounded-full px-3 py-1 text-xs font-medium",
};

type LessonStatus = "PENDING" | "COMPLETE" | "CANCELLED";

const INITIAL_FROM = startOfMonth(new Date());
const INITIAL_TO = endOfMonth(new Date());

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
  const [studentId, setStudentId] = useState("all");
  const [status, setStatus] = useState<LessonStatus | "all">("all");
  const [fromDate, setFromDate] = useState<Date | undefined>(INITIAL_FROM);
  const [toDate, setToDate] = useState<Date | undefined>(INITIAL_TO);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [attendanceLesson, setAttendanceLesson] = useState<Lesson | null>(null);
  const [deleteLesson, setDeleteLesson] = useState<Lesson | null>(null);

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

  const { data: lessons = [], isLoading } = api.lesson.getAll.useQuery(
    filters,
    {
      initialData: isDefaultFilters ? initialLessons : undefined,
    },
  );

  const deleteMutation = api.lesson.delete.useMutation({
    onSuccess: () => {
      toast.success("Lesson deleted");
      void utils.lesson.invalidate();
      setDeleteLesson(null);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete lesson");
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
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          Lessons & Attendance
        </h1>
        <p className="text-muted-foreground mt-2">
          Track every beautiful session
        </p>
      </div>

      <div className="rounded-2xl border border-pink-100 bg-white/80 p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs font-medium text-pink-700 sm:text-sm">
                Student
              </label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger className="h-9 border-pink-200 bg-pink-50 text-sm focus:ring-pink-400 sm:h-10">
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

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs font-medium text-pink-700 sm:text-sm">
                From
              </label>
              <DatePicker
                date={fromDate}
                onDateChange={setFromDate}
                placeholder="Start date"
                className="h-9 w-full text-sm sm:h-10"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs font-medium text-pink-700 sm:text-sm">
                To
              </label>
              <DatePicker
                date={toDate}
                onDateChange={setToDate}
                placeholder="End date"
                className="h-9 w-full text-sm sm:h-10"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs font-medium text-pink-700 sm:text-sm">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as LessonStatus | "all")
                }
              >
                <SelectTrigger className="h-9 border-pink-200 bg-pink-50 text-sm focus:ring-pink-400 sm:h-10">
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
          </div>
          <Button
            variant="outline"
            onClick={resetFilters}
            className="h-9 rounded-xl text-pink-600 hover:bg-pink-100 sm:h-10"
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-pink-100 bg-white shadow-md">
        <Table>
          <TableHeader className="bg-rose-50/60">
            <TableRow>
              <TableHead className="whitespace-nowrap">Date</TableHead>
              <TableHead className="whitespace-nowrap">Time</TableHead>
              <TableHead className="whitespace-nowrap">Student</TableHead>
              <TableHead className="whitespace-nowrap">Piece</TableHead>
              <TableHead className="whitespace-nowrap">Duration</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex h-32 items-center justify-center">
                    <AppLoader size="sm" />
                  </div>
                </TableCell>
              </TableRow>
            ) : lessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-3 text-4xl">🎹</div>
                    <div className="text-lg font-medium text-pink-700">
                      No lessons scheduled yet
                    </div>
                    <div className="mt-1 text-sm text-pink-600/70">
                      Your piano week is waiting for music.
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              lessons.map((lesson) => (
                <TableRow
                  key={lesson.id}
                  className="transition-colors hover:bg-pink-50"
                >
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(lesson.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(lesson.date), "h:mm a")}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    {lesson.student.name}
                  </TableCell>
                  <TableCell
                    className="max-w-[150px] truncate whitespace-nowrap"
                    title={lesson.piece?.title ?? ""}
                  >
                    {lesson.piece?.title ?? "None"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {lesson.duration} min
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={statusClasses[lesson.status as LessonStatus]}
                    >
                      {statusLabels[lesson.status as LessonStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
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
                          onSelect={() => setEditLesson(lesson)}
                          className="rounded-lg hover:bg-pink-50"
                        >
                          <Music2 className="mr-2 h-4 w-4" />
                          Change piece
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
