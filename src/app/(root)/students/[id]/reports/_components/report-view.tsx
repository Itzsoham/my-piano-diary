"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getWeekOfMonth, getDate, format } from "date-fns";
import { Loader2, Save, Printer } from "lucide-react";
import { api } from "@/trpc/react";

interface ReportViewProps {
  studentId: string;
  month: number;
  year: number;
}

export function ReportView({ studentId, month, year }: ReportViewProps) {
  const router = useRouter();

  const { data, isLoading } = api.report.getStudentReport.useQuery({
    studentId,
    month,
    year,
  });

  const upsertReport = api.report.upsertReport.useMutation();

  const [summary, setSummary] = useState(data?.report?.summary ?? "");
  const [comments, setComments] = useState(data?.report?.comments ?? "");
  const [nextMonthPlan, setNextMonthPlan] = useState(
    data?.report?.nextMonthPlan ?? "",
  );

  // Update state when data loads
  if (
    data?.report &&
    summary === "" &&
    comments === "" &&
    nextMonthPlan === ""
  ) {
    setSummary(data.report.summary ?? "");
    setComments(data.report.comments ?? "");
    setNextMonthPlan(data.report.nextMonthPlan ?? "");
  }

  const handleSave = async () => {
    try {
      await upsertReport.mutateAsync({
        studentId,
        month,
        year,
        summary,
        comments,
        nextMonthPlan,
      });
      toast.success("Report saved successfully");
    } catch {
      toast.error("Failed to save report");
    }
  };

  const handleMonthChange = (val: string) => {
    const newMonth = parseInt(val);
    router.push(`?month=${newMonth}&year=${year}`);
  };

  const handleYearChange = (val: string) => {
    const newYear = parseInt(val);
    router.push(`?month=${month}&year=${newYear}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data?.student) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Student not found</p>
      </div>
    );
  }

  const { student, lessons } = data;

  // Calculate Stats
  const validLessons = lessons.filter((l) => l.status === "COMPLETE");
  const totalSessions = validLessons.length;

  // Attendance Grid Logic
  const weeksData: Record<number, { day: number; status: string }[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };

  lessons.forEach((lesson) => {
    const week = getWeekOfMonth(lesson.date, { weekStartsOn: 1 });
    const day = getDate(lesson.date);
    const status = lesson.status ?? "PENDING";
    if (weeksData[week]) {
      weeksData[week].push({ day, status });
    }
  });

  const hasWeek6 = weeksData[6] && weeksData[6].length > 0;
  const weeks = hasWeek6 ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Controls - Hidden on Print */}
      <div className="bg-card flex flex-col items-center justify-between gap-4 rounded-lg border p-4 shadow-sm sm:flex-row print:hidden">
        <div className="flex items-center gap-2">
          <Select value={month.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-30">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  Month {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-25">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleSave} disabled={upsertReport.isPending}>
            {upsertReport.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Report Paper */}
      <div className="mx-auto min-h-[297mm] max-w-[210mm] bg-white p-8 font-serif text-black shadow-lg print:m-0 print:w-full print:p-0 print:shadow-none">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-xl font-bold uppercase">
            MONTHLY REPORT {month}/{year}
          </h1>
          <p className="font-semibold">Student Name: {student.name}</p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-lg font-bold">I. Monthly Summary</h2>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-25 w-full resize-none border-none bg-transparent p-0 font-serif text-base leading-relaxed shadow-none focus-visible:ring-0"
              placeholder="- Student completed..."
            />
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold">II. Comments</h2>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-37.5 w-full resize-none border-none bg-transparent p-0 font-serif text-base leading-relaxed shadow-none focus-visible:ring-0"
              placeholder="- Technique..."
            />
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold">III. Next Month Plan</h2>
            <Textarea
              value={nextMonthPlan}
              onChange={(e) => setNextMonthPlan(e.target.value)}
              className="min-h-25 w-full resize-none border-none bg-transparent p-0 font-serif text-base leading-relaxed shadow-none focus-visible:ring-0"
              placeholder="- Learn new piece..."
            />
          </section>

          {/* Attendance Table */}
          <section className="pt-4">
            <h2 className="mb-4 text-center text-lg font-bold">
              ATTENDANCE TABLE FOR MONTH {month}
            </h2>

            <div className="border border-black">
              {/* Header Row */}
              <div
                className="grid divide-x divide-black border-b border-black text-center font-bold"
                style={{
                  gridTemplateColumns: `50px 100px repeat(${weeks.length}, 1fr)`,
                }}
              >
                <div className="flex items-center justify-center p-2">NO</div>
                <div className="flex items-center justify-center p-2">
                  STUDENT
                </div>
                {weeks.map((w) => (
                  <div key={w} className="p-2">
                    Week {w}
                  </div>
                ))}
              </div>

              {/* Data Row */}
              <div
                className="grid min-h-15 divide-x divide-black text-center"
                style={{
                  gridTemplateColumns: `50px 100px repeat(${weeks.length}, 1fr)`,
                }}
              >
                <div className="flex items-center justify-center p-2">1</div>
                <div className="flex items-center justify-center p-2 font-bold uppercase">
                  {student.name}
                </div>
                {weeks.map((w) => (
                  <div
                    key={w}
                    className="flex h-full flex-wrap content-center items-center justify-center gap-2 p-2"
                  >
                    {weeksData[w]?.map((item, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex h-8 w-8 items-center justify-center border border-black text-sm font-semibold ${
                          item.status === "CANCELLED" ? "bg-yellow-300" : ""
                        } ${item.status === "COMPLETE" ? "bg-white" : ""} ${
                          item.status === "PENDING"
                            ? "bg-gray-100 text-gray-400"
                            : ""
                        } `}
                      >
                        {item.day}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend & Stats */}
            <div className="mt-4 space-y-2">
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span>Legend: Cancelled:</span>
                  <div className="h-4 w-4 border border-black bg-yellow-300"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span>Completed:</span>
                  <div className="h-4 w-4 border border-black bg-white"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span>Pending:</span>
                  <div className="h-4 w-4 border border-black bg-gray-100"></div>
                </div>
              </div>

              <div className="mt-4 text-lg font-bold italic">
                TOTAL: {totalSessions} SESSIONS
              </div>
            </div>

            <div className="mt-12 mb-12 text-right italic">
              Date: {format(new Date(), "dd/MM/yyyy")}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
