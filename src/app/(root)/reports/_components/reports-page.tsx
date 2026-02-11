"use client";

import { useEffect, useMemo, useState } from "react";
import { format, getWeekOfMonth } from "date-fns";
import { Printer, Save } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";

interface ReportsPageProps {
  students: { id: string; name: string }[];
}

type LessonStatus = "PENDING" | "COMPLETE" | "CANCELLED";

type PreviewLesson = {
  id: string;
  date: Date;
  status: LessonStatus;
};

const statusBadgeClass = (status: LessonStatus) => {
  if (status === "COMPLETE") {
    return "bg-sky-100 text-sky-700 border-sky-200";
  }
  if (status === "CANCELLED") {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  return "bg-amber-100 text-amber-800 border-amber-200";
};

export function ReportsPage({ students }: ReportsPageProps) {
  const { currency } = useCurrency();
  const now = new Date();

  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [hasPreview, setHasPreview] = useState(false);
  const [summary, setSummary] = useState("");
  const [comments, setComments] = useState("");
  const [nextMonthPlan, setNextMonthPlan] = useState("");

  const previewQuery = api.report.generatePreview.useQuery(
    { studentId, month, year },
    { enabled: false },
  );
  const reportQuery = api.report.getByMonth.useQuery(
    { studentId, month, year },
    { enabled: false },
  );

  const saveReport = api.report.createOrUpdate.useMutation({
    onSuccess: () => {
      toast.success("Report saved");
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to save report");
    },
  });

  useEffect(() => {
    setHasPreview(false);
    setSummary("");
    setComments("");
    setNextMonthPlan("");
  }, [studentId, month, year]);

  const handleGenerate = async () => {
    if (!studentId) {
      return;
    }

    setHasPreview(true);
    const [previewResult, reportResult] = await Promise.all([
      previewQuery.refetch(),
      reportQuery.refetch(),
    ]);

    const report = reportResult.data;
    if (report) {
      setSummary(report.summary ?? "");
      setComments(report.comments ?? "");
      setNextMonthPlan(report.nextMonthPlan ?? "");
    } else {
      setSummary("");
      setComments("");
      setNextMonthPlan("");
    }

    if (previewResult.error) {
      toast.error(previewResult.error.message ?? "Failed to generate preview");
    }
  };

  const handleSave = () => {
    if (!studentId) {
      return;
    }

    saveReport.mutate({
      studentId,
      month,
      year,
      summary,
      comments,
      nextMonthPlan,
    });
  };

  const preview = previewQuery.data;

  const weeks = useMemo(() => {
    const lessons = (preview?.lessons ?? []) as PreviewLesson[];
    const buckets: Record<number, PreviewLesson[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
    };

    lessons.forEach((lesson) => {
      const week = Math.min(
        4,
        getWeekOfMonth(new Date(lesson.date), { weekStartsOn: 1 }),
      );
      if (buckets[week]) {
        buckets[week].push(lesson);
      }
    });

    Object.values(buckets).forEach((bucket) =>
      bucket.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    );

    return buckets;
  }, [preview?.lessons]);

  const student = students.find((s) => s.id === studentId);
  const totalLessons = preview?.totalLessons ?? 0;
  const totalFee = preview?.totalFee ?? 0;

  const isGenerating = previewQuery.isFetching || reportQuery.isFetching;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-2">
          Generate monthly report for a student
        </p>
      </div>

      <div className="rounded-2xl border bg-rose-50/40 p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(200px,1.4fr)_minmax(120px,0.8fr)_minmax(120px,0.8fr)_auto] lg:items-end">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((studentOption) => (
                  <SelectItem key={studentOption.id} value={studentOption.id}>
                    {studentOption.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Month</Label>
            <Select
              value={month.toString()}
              onValueChange={(value) => setMonth(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (value) => (
                    <SelectItem key={value} value={value.toString()}>
                      {`Month ${value}`}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Year</Label>
            <Select
              value={year.toString()}
              onValueChange={(value) => setYear(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: 5 },
                  (_, index) => now.getFullYear() - 2 + index,
                ).map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!studentId || isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </div>

      {hasPreview && (
        <div className="rounded-2xl border bg-white shadow-sm">
          {isGenerating ? (
            <div className="flex h-56 items-center justify-center">
              <AppLoader />
            </div>
          ) : (
            <div className="space-y-8 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {student?.name ?? "Student"}
                  </h2>
                  <p className="text-muted-foreground">
                    {`Month ${month} / ${year}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button onClick={handleSave} disabled={saveReport.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {saveReport.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-2 lg:col-span-3">
                  <Label>Summary</Label>
                  <Textarea
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    placeholder="Monthly summary"
                    rows={3}
                  />
                </div>
                <div className="space-y-2 lg:col-span-3">
                  <Label>Comments</Label>
                  <Textarea
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                    placeholder="Notes and feedback"
                    rows={3}
                  />
                </div>
                <div className="space-y-2 lg:col-span-3">
                  <Label>Next month plan</Label>
                  <Textarea
                    value={nextMonthPlan}
                    onChange={(event) => setNextMonthPlan(event.target.value)}
                    placeholder="Plan for next month"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">Attendance</h3>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                    <Badge className={statusBadgeClass("COMPLETE")}>
                      Normal
                    </Badge>
                    <Badge className={statusBadgeClass("PENDING")}>
                      Pending
                    </Badge>
                    <Badge className={statusBadgeClass("CANCELLED")}>
                      Cancelled
                    </Badge>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border">
                  <Table>
                    <TableHeader className="bg-rose-50/60">
                      <TableRow>
                        <TableHead>Week 1</TableHead>
                        <TableHead>Week 2</TableHead>
                        <TableHead>Week 3</TableHead>
                        <TableHead>Week 4</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        {[1, 2, 3, 4].map((week) => (
                          <TableCell key={week} className="align-top">
                            <div className="flex flex-wrap gap-2">
                              {(weeks[week]?.length ?? 0) === 0 && (
                                <span className="text-muted-foreground text-xs">
                                  No lessons
                                </span>
                              )}
                              {weeks[week]?.map((lesson) => (
                                <span
                                  key={lesson.id}
                                  className={`rounded-full border px-2 py-1 text-xs font-medium ${statusBadgeClass(
                                    lesson.status ?? "PENDING",
                                  )}`}
                                >
                                  {format(new Date(lesson.date), "d")}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-rose-50/40 px-4 py-3">
                <div>
                  <div className="text-muted-foreground text-sm">
                    Total lessons
                  </div>
                  <div className="text-lg font-semibold">{totalLessons}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Total fee</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(totalFee, currency)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
