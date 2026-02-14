"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, DollarSign, Music } from "lucide-react";
import { AttendanceDialog } from "@/app/(root)/calendar/_components/attendance-dialog";
import { format, isSameDay } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

type LessonStatus = "PENDING" | "COMPLETE" | "CANCELLED";

const toLessonStatus = (status: string): LessonStatus => {
  if (status === "COMPLETE" || status === "CANCELLED" || status === "PENDING") {
    return status;
  }

  return "PENDING";
};

export function TodayLessonsTable() {
  const [date, setDate] = useState<Date>(new Date());
  const { currency } = useCurrency();

  const {
    data: lessons = [],
    isLoading,
    refetch,
  } = api.earnings.getTodayLessons.useQuery({ date });

  const [open, setOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<{
    id: string;
    studentName: string;
    duration: number;
    status: LessonStatus;
    actualMin: number | null;
    cancelReason: string | null;
    note: string | null;
    date: Date;
  } | null>(null);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status: LessonStatus) => {
    switch (status) {
      case "COMPLETE":
        return (
          <Badge className="border-none bg-green-100 text-green-700 shadow-none hover:bg-green-200">
            complete
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="border-none bg-rose-100 text-rose-600 shadow-none hover:bg-rose-200">
            cancelled
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground border-pink-200 bg-white/50"
          >
            pending
          </Badge>
        );
    }
  };

  const totalEarnings =
    lessons?.reduce((sum, lesson) => sum + lesson.earnings, 0) ?? 0;

  return (
    <Card className="overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm backdrop-blur">
      <CardHeader className="bg-transparent pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg text-rose-950 sm:text-xl">
              Today&apos;s Focus <span className="text-lg sm:text-xl">🎹</span>
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto p-0 text-sm font-normal text-rose-600/80 italic hover:bg-transparent hover:text-rose-700 sm:text-base"
                >
                  {format(date, "EEEE, MMMM do")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2 self-start rounded-2xl border border-pink-100 bg-white/60 px-3 py-2 shadow-sm backdrop-blur sm:gap-3 sm:self-auto sm:px-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 text-pink-500 sm:h-8 sm:w-8">
              <DollarSign className="size-3 sm:size-4" />
            </div>
            <div>
              <div className="text-muted-foreground text-[9px] font-medium tracking-wider uppercase sm:text-[10px]">
                {isSameDay(date, new Date())
                  ? "Today&apos;s Total"
                  : "Day&apos;s Total"}
              </div>
              <div className="text-sm font-semibold text-rose-950 sm:text-base">
                {formatCurrency(totalEarnings, currency)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-2">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center px-4 text-rose-400 italic">
            Gathering your lessons...
          </div>
        ) : lessons && lessons.length > 0 ? (
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="mx-4 overflow-hidden rounded-xl border border-pink-100 bg-white/60 shadow-sm backdrop-blur sm:mx-0">
                <Table>
                  <TableHeader className="bg-pink-50/50">
                    <TableRow className="border-pink-100 hover:bg-transparent">
                      <TableHead className="whitespace-nowrap text-rose-900/70">
                        Time
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-rose-900/70">
                        Student
                      </TableHead>
                      <TableHead className="hidden whitespace-nowrap text-rose-900/70 sm:table-cell">
                        Piece
                      </TableHead>
                      <TableHead className="hidden whitespace-nowrap text-rose-900/70 md:table-cell">
                        Duration
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-rose-900/70">
                        Status
                      </TableHead>
                      <TableHead className="hidden whitespace-nowrap text-rose-900/70 lg:table-cell">
                        Attendance
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap text-rose-900/70">
                        Earnings
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessons.map((lesson) => (
                      <TableRow
                        key={lesson.id}
                        className="border-pink-50 hover:bg-pink-50/30"
                      >
                        <TableCell className="font-medium whitespace-nowrap text-rose-950">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Clock className="size-3 shrink-0 text-rose-400 sm:size-4" />
                            <span className="text-xs sm:text-sm">
                              {formatTime(lesson.date)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="size-6 shrink-0 border border-pink-100 sm:size-8">
                              <AvatarImage
                                src={lesson.student.avatar ?? undefined}
                              />
                              <AvatarFallback className="bg-pink-100 text-xs text-pink-600">
                                {lesson.student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-rose-950 sm:text-sm">
                              {lesson.student.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {lesson.piece?.title ? (
                            <span className="text-xs text-rose-800 sm:text-sm">
                              {lesson.piece.title}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">
                              No piece
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden text-xs sm:text-sm md:table-cell">
                          {lesson.duration} min
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(toLessonStatus(lesson.status))}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={cn(
                              "h-8 rounded-full px-3 text-xs font-medium whitespace-nowrap sm:px-4",
                              lesson.status !== "PENDING"
                                ? "bg-pink-100 text-pink-700 hover:bg-pink-200 hover:text-pink-800"
                                : "text-muted-foreground border border-pink-200 bg-white hover:bg-rose-50 hover:text-rose-600",
                            )}
                            disabled={lesson.status === "CANCELLED"}
                            onClick={() => {
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
                            }}
                          >
                            {lesson.status !== "PENDING" ? "Update" : "Mark"}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">
                          {lesson.status === "CANCELLED" ? (
                            <span className="text-xs text-rose-400 line-through opacity-70 sm:text-sm">
                              {formatCurrency(lesson.earnings, currency)}
                            </span>
                          ) : (
                            <span className="text-xs text-rose-600 sm:text-sm">
                              {formatCurrency(lesson.earnings, currency)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Music className="mx-auto mb-4 size-10 animate-bounce text-pink-400" />
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
            onOpenChange={(o) => setOpen(o)}
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
