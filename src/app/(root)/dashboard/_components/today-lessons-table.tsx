"use client";

import { useState } from "react";
import { format, isSameDay, startOfDay } from "date-fns";
import { Music } from "lucide-react";
import { AttendanceDialog } from "@/app/(root)/calendar/_components/attendance-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
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
  actualMin: number | null;
  cancelReason: string | null;
  note: string | null;
  date: Date;
};

export function TodayLessonsTable({
  className,
  contentClassName,
}: TodayLessonsTableProps = {}) {
  const [date, setDate] = useState<Date>(() => startOfDay(new Date()));
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

  const totalEarnings = lessons.reduce(
    (sum, lesson) => sum + lesson.earnings,
    0,
  );
  const formattedDate = format(date, "EEEE, MMMM do");
  const isToday = isSameDay(date, new Date());

  const formatTime = (lessonDate: Date) => {
    return new Date(lessonDate).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const openAttendanceDialog = (lesson: (typeof lessons)[number]) => {
    setSelectedLesson({
      id: lesson.id,
      studentName: lesson.student.name,
      duration: lesson.duration,
      status: toLessonStatus(lesson.status),
      actualMin: lesson.actualMin,
      cancelReason: lesson.cancelReason,
      note: lesson.note,
      date: lesson.date,
    });
    setOpen(true);
  };

  const getStatusBadge = (status: LessonStatus) => {
    switch (status) {
      case "COMPLETE":
        return (
          <Badge className="border-none bg-emerald-100 text-emerald-700 shadow-none hover:bg-emerald-200">
            Complete
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="border-none bg-rose-100 text-rose-600 shadow-none hover:bg-rose-200">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="border-none bg-amber-100 text-amber-700 shadow-none hover:bg-amber-200">
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[2rem] border border-pink-100/70 bg-white shadow-none backdrop-blur",
        className,
      )}
    >
      <CardHeader className="bg-transparent">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-2xl text-rose-950 sm:text-[1.75rem]">
              Today&apos;s Focus <span className="text-lg sm:text-xl">🎹</span>
            </CardTitle>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="cursor-pointer text-left text-sm text-rose-500 italic transition-colors duration-200 hover:text-rose-700 sm:text-base"
                >
                  {formattedDate}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(day) => day && setDate(day)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-[1.2rem] border border-rose-100 bg-rose-50/40 px-4 py-2.5">
            <div>
              <div>
                <div className="text-muted-foreground text-[10px] font-semibold tracking-[0.18em] uppercase">
                  {isToday ? "Today's Total" : "Day Total"}
                </div>
                <div className="text-sm font-semibold text-rose-950 sm:text-base">
                  {formatCurrency(totalEarnings, currency)}
                </div>
              </div>
            </div>
            <div className="text-sm text-rose-700">
              <span className="font-semibold text-rose-950">
                {lessons.length}
              </span>{" "}
              lessons
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "min-h-0 flex-1 px-0 pt-0 pb-0 sm:px-6 sm:pt-0 sm:pb-6",
          contentClassName,
        )}
      >
        {isLoading ? (
          <div className="flex h-32 items-center justify-center px-4 text-rose-400 italic">
            Gathering your lessons...
          </div>
        ) : lessons.length > 0 ? (
          <>
            <div className="hidden h-full sm:block">
              <div className="overflow-hidden rounded-[1.5rem] border border-rose-100 bg-white">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-rose-100 bg-rose-50/60">
                      <th className="px-5 py-2.5 text-left text-[11px] font-semibold tracking-[0.14em] text-rose-500 uppercase">
                        Student
                      </th>
                      <th className="px-5 py-2.5 text-left text-[11px] font-semibold tracking-[0.14em] text-rose-500 uppercase">
                        Schedule
                      </th>
                      <th className="px-5 py-2.5 text-left text-[11px] font-semibold tracking-[0.14em] text-rose-500 uppercase">
                        Status
                      </th>
                      <th className="hidden px-5 py-2.5 text-left text-[11px] font-semibold tracking-[0.14em] text-rose-500 uppercase lg:table-cell">
                        Attendance
                      </th>
                      <th className="px-5 py-2.5 text-right text-[11px] font-semibold tracking-[0.14em] text-rose-500 uppercase">
                        Earnings
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {lessons.map((lesson, index) => (
                      <tr
                        key={lesson.id}
                        className={cn(
                          "group transition-colors duration-200 hover:bg-rose-50/30",
                          index === lessons.length - 1 && "border-b-0",
                        )}
                      >
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9 shrink-0 border border-white/50 ring-2 ring-pink-500/10">
                              <AvatarImage
                                src={lesson.student.avatar ?? undefined}
                              />
                              <AvatarFallback className="bg-pink-100 text-xs text-pink-600">
                                {lesson.student.name
                                  .split(" ")
                                  .map((name) => name[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="truncate text-sm font-medium text-rose-950">
                              {lesson.student.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="text-sm font-medium text-rose-950">
                            {formatTime(lesson.date)}
                          </span>
                        </td>
                        <td className="px-5 py-2.5">
                          {getStatusBadge(toLessonStatus(lesson.status))}
                        </td>
                        <td className="hidden px-5 py-2.5 lg:table-cell">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={cn(
                              "h-8 rounded-full px-3.5 text-xs font-medium whitespace-nowrap transition-all duration-300 active:scale-[0.98]",
                              lesson.status !== "PENDING"
                                ? "bg-pink-100 text-pink-700 hover:bg-pink-200 hover:text-pink-800"
                                : "text-muted-foreground border border-pink-200 bg-white hover:bg-rose-50 hover:text-rose-600",
                            )}
                            onClick={() => openAttendanceDialog(lesson)}
                          >
                            {lesson.status !== "PENDING" ? "Update" : "Mark"}
                          </Button>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          {lesson.status === "CANCELLED" ? (
                            <span className="text-sm font-semibold text-rose-400 line-through opacity-70">
                              {formatCurrency(lesson.earnings, currency)}
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-rose-600">
                              {formatCurrency(lesson.earnings, currency)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 px-4 sm:hidden">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="rounded-[1.6rem] bg-white/80 p-4 shadow-sm backdrop-blur-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-white/90 hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-1.5 rounded-full border border-pink-100/70 bg-pink-50 px-3 py-1 text-[11px] font-medium text-pink-600">
                      {formatTime(lesson.date)}
                    </div>
                    {getStatusBadge(toLessonStatus(lesson.status))}
                  </div>

                  <div className="mb-4 flex items-center gap-3">
                    <Avatar className="size-10 border border-white/50 ring-2 ring-pink-500/15">
                      <AvatarImage src={lesson.student.avatar ?? ""} />
                      <AvatarFallback className="bg-pink-50 text-xs font-bold text-pink-600">
                        {lesson.student.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-[15px] font-semibold text-rose-950">
                      {lesson.student.name}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 border-t border-pink-50 pt-3">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground text-[10px] font-medium tracking-[0.2em] uppercase">
                        Earned
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          lesson.status === "CANCELLED"
                            ? "text-rose-400 line-through opacity-70"
                            : "text-rose-600",
                        )}
                      >
                        {formatCurrency(lesson.earnings, currency)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className={cn(
                        "h-9 rounded-full px-4 text-xs font-medium shadow-none transition-all duration-300 active:scale-[0.98]",
                        lesson.status !== "PENDING"
                          ? "bg-pink-100 text-pink-700 hover:bg-pink-200"
                          : "bg-pink-500 text-white hover:bg-pink-600",
                      )}
                      onClick={() => openAttendanceDialog(lesson)}
                    >
                      {lesson.status !== "PENDING" ? "Update" : "Mark"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-14 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-pink-50 shadow-sm">
              <Music className="size-8 text-pink-400" />
            </div>
            <p className="text-muted-foreground font-medium">
              No lessons today 🎀
            </p>
            <p className="text-muted-foreground/70 mt-1 text-xs">
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
