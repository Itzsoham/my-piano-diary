"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TopStudent = {
  studentId: string | number;
  studentName: string;
  lessonCount: number;
  avatar: string | null;
};

type DashboardTopStudentsCardProps = {
  studentsLoading: boolean;
  topFiveStudents: TopStudent[];
  className?: string;
};

const getRankStyles = () => {
  return "bg-pink-100 text-pink-700 border border-pink-200";
};

const getRankMedal = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
};

export function DashboardTopStudentsCard({
  studentsLoading,
  topFiveStudents,
  className,
}: DashboardTopStudentsCardProps) {
  return (
    <Card
      className={cn(
        "h-full overflow-hidden rounded-[2rem] border border-pink-100/70 bg-white shadow-none backdrop-blur",
        className,
      )}
    >
      <CardHeader className="pb-1">
        <CardTitle className="text-1.5xl mt-3 text-rose-950/90 sm:text-[1.5rem]">
          Top Students This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {studentsLoading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : topFiveStudents.length === 0 ? (
          <p className="text-sm text-rose-500">No activity yet this month.</p>
        ) : (
          <div className="divide-y divide-rose-100/70">
            {topFiveStudents.map((student, index) => (
              <div
                key={student.studentId}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {getRankMedal(index + 1) ? (
                    <span
                      className="inline-flex size-8 shrink-0 items-center justify-center text-base"
                      aria-hidden="true"
                    >
                      {getRankMedal(index + 1)}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
                        getRankStyles(),
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                  <Avatar className="size-10 border border-white/60 ring-2 ring-pink-100/80">
                    <AvatarImage src={student.avatar ?? undefined} />
                    <AvatarFallback className="bg-pink-100 text-pink-700">
                      {student.studentName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="truncate text-sm font-semibold text-rose-950">
                    {student.studentName}
                  </p>
                </div>

                <div className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                  {student.lessonCount} lessons
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
