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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import { AttendanceDialog } from "@/app/(root)/calendar/_components/attendance-dialog";
import { format, isSameDay } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface TodayLesson {
  id: string;
  studentId: string;
  teacherId: string;
  date: Date;
  duration: number;
  status: "PENDING" | "COMPLETE" | "CANCELLED";
  cancelReason: string | null;
  pieceId: string | null;
  createdAt: Date;
  earnings: number;
  actualMin: number | null;
  note: string | null;
  piece: {
    title: string;
  } | null;
  student: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export function TodayLessonsTable() {
  const [date, setDate] = useState<Date>(new Date());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const query: any = (api as any).earnings.getTodayLessons.useQuery({ date });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const lessonsData: unknown = query.data;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const isLoading: unknown = query.isLoading;
  const lessons = (lessonsData ?? []) as TodayLesson[];

  const [open, setOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<{
    id: string;
    studentName: string;
    duration: number;
    status: "PENDING" | "COMPLETE" | "CANCELLED";
    actualMin: number | null;
    cancelReason: string | null;
    note: string | null;
  } | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETE":
        return "default";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const totalEarnings =
    lessons?.reduce((sum, lesson) => sum + lesson.earnings, 0) ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="size-5" />
              {isSameDay(date, new Date())
                ? "Today's Lessons"
                : "Lessons Schedule"}
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground h-8 px-0 font-normal hover:bg-transparent"
                >
                  {format(date, "EEEE, MMMM do, yyyy")}
                  <CalendarDays className="ml-2 h-4 w-4 opacity-50" />
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
          <div className="bg-muted/50 flex items-center gap-2 rounded-lg border px-3 py-2">
            <DollarSign className="text-primary size-5" />
            <div>
              <div className="text-muted-foreground text-xs">
                {isSameDay(date, new Date()) ? "Today's Total" : "Day's Total"}
              </div>
              <div className="font-semibold">
                {formatCurrency(totalEarnings)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground flex h-32 items-center justify-center">
            Loading lessons...
          </div>
        ) : lessons && lessons.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Piece</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Clock className="text-muted-foreground size-4" />
                        {formatTime(lesson.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage
                            src={lesson.student.avatar ?? undefined}
                          />
                          <AvatarFallback>
                            {lesson.student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{lesson.student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lesson.piece?.title ?? (
                        <span className="text-muted-foreground">No piece</span>
                      )}
                    </TableCell>
                    <TableCell>{lesson.duration} min</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(lesson.status)}>
                        {lesson.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={
                          lesson.status !== "PENDING" ? "default" : "outline"
                        }
                        disabled={lesson.status === "CANCELLED"}
                        onClick={() => {
                          setSelectedLesson({
                            id: lesson.id,
                            studentName: lesson.student.name,
                            duration: lesson.duration,
                            status: lesson.status,
                            actualMin: lesson.actualMin,
                            cancelReason: lesson.cancelReason,
                            note: lesson.note,
                          });
                          setOpen(true);
                        }}
                      >
                        {lesson.status !== "PENDING" ? "Update" : "Mark"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {lesson.status === "CANCELLED" ? (
                        <span className="text-destructive">
                          {formatCurrency(lesson.earnings)}
                        </span>
                      ) : (
                        <span className="text-green-600">
                          {formatCurrency(lesson.earnings)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
            <div className="text-muted-foreground text-center">
              <CalendarIcon className="mx-auto mb-2 size-8 opacity-50" />
              <p>
                No lessons scheduled for{" "}
                {isSameDay(date, new Date()) ? "today" : format(date, "MMM do")}
              </p>
            </div>
          </div>
        )}

        {selectedLesson && (
          <AttendanceDialog
            open={open}
            onOpenChange={(o) => setOpen(o)}
            lesson={selectedLesson}
            onSuccess={() => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              void query.refetch?.();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
