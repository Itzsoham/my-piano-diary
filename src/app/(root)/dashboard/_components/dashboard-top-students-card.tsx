"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import type { CurrencyCode } from "@/lib/currency";
import { cn } from "@/lib/utils";

type TopStudent = {
  studentId: string | number;
  studentName: string;
  lessonCount: number;
  earnings: number;
  avatar: string | null;
};

type DashboardTopStudentsCardProps = {
  studentsLoading: boolean;
  topThreeStudents: TopStudent[];
  currency: CurrencyCode;
  className?: string;
};

export function DashboardTopStudentsCard({
  studentsLoading,
  topThreeStudents,
  currency,
  className,
}: DashboardTopStudentsCardProps) {
  return (
    <Card
      className={cn(
        "h-full overflow-hidden rounded-[2rem] border border-pink-100/70 bg-white shadow-none backdrop-blur transition-shadow duration-300 hover:shadow-lg",
        className,
      )}
    >
      <CardHeader className="pb-1">
        <CardTitle className="mt-3 text-xl text-rose-950/90">
          Top Students This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {studentsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : topThreeStudents.length === 0 ? (
          <p className="text-sm text-rose-500">No activity yet this month.</p>
        ) : (
          topThreeStudents.map((student, index) => (
            <div
              key={student.studentId}
              className="flex items-center justify-between rounded-[1.35rem] bg-white/70 px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-2xl bg-linear-to-br from-pink-500 to-fuchsia-500 text-sm font-semibold text-white shadow-sm">
                  {index + 1}
                </span>
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
                <div>
                  <p className="text-sm font-semibold text-rose-900/90">
                    {student.studentName}
                  </p>
                  <p className="text-xs text-rose-500">
                    {student.lessonCount} lessons
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-fuchsia-600">
                {formatCurrency(student.earnings, currency)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
