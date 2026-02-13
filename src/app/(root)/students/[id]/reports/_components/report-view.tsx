"use client";

import { useState, useEffect, type ReactNode } from "react";
import { AppLoader } from "@/components/ui/app-loader";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  Loader2,
  Save,
  Printer,
  Music,
  MessageSquare,
  Target,
  Info,
} from "lucide-react";
import { api } from "@/trpc/react";
import { formatCurrency, formatCurrencyNumber } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface ReportViewProps {
  studentId: string;
  month: number;
  year: number;
  includeStudentIdInQuery?: boolean;
  studentControl?: ReactNode;
}

export function ReportView({
  studentId,
  month,
  year,
  includeStudentIdInQuery = false,
  studentControl,
}: ReportViewProps) {
  const router = useRouter();
  const { currency } = useCurrency();

  const [prettyMode, setPrettyMode] = useState(false);
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [summary, setSummary] = useState("");
  const [comments, setComments] = useState("");
  const [nextMonthPlan, setNextMonthPlan] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  const { data, isLoading } = api.report.getStudentReport.useQuery({
    studentId,
    month,
    year,
  });

  const upsertReport = api.report.upsertReport.useMutation();

  // Update state when data loads - only once
  useEffect(() => {
    if (data?.report && !isInitialized) {
      setSummary(data.report.summary ?? "");
      setComments(data.report.comments ?? "");
      setNextMonthPlan(data.report.nextMonthPlan ?? "");
      setIsInitialized(true);
    }
  }, [data?.report, isInitialized]);

  const copy = {
    vi: {
      monthPlaceholder: "Tháng",
      yearPlaceholder: "Năm",
      monthOption: (val: number) => `Tháng ${val}`,
      print: "In",
      save: "Lưu thay đổi",
      pretty: "Pretty mode",
      language: "Ngôn ngữ",
      printHelp:
        "Ẩn giờ/URL khi in: tắt 'Headers and footers' trong hộp thoại in.",
      studentNotFound: "Không tìm thấy học sinh",
      reportTitle: (m: number, y: number) => `TỔNG KẾT THÁNG ${m}/${y}`,
      reportTitlePretty: (m: number, y: number) => `TỔNG KẾT THÁNG ${m} · ${y}`,
      studentLabel: "Tên học sinh",
      studentBadge: "Học sinh",
      monthBadge: (m: number, y: number) => `Tháng ${m} / ${y}`,
      sections: {
        summary: "I. Tổng kết tháng",
        comments: "II. Nhận xét",
        nextPlan: "III. Hoạt động tháng tới",
      },
      placeholders: {
        summary: "- Con hoàn thành...",
        comments: "- Nhận xét...",
        nextPlan: "- Học bài mới...",
      },
      attendanceTitle: (m: number) => `BẢNG ĐIỂM DANH THÁNG ${m}`,
      tableNo: "STT",
      tableStudent: "TÊN HS",
      weekLabel: (w: number) => `Tuần ${w}`,
      legendAbsent: "Buổi vắng",
      legendPresent: "Buổi đầy đủ",
      legendPending: "Chưa có",
      legendTitle: "Ghi chú",
      totalLabel: "TỔNG",
      tuitionLabel: "Học phí",
      teacherLabel: "Giáo viên",
      dateLabel: "Đà Nẵng, Ngày",
      totalLessons: (count: number) => `${count} BUỔI`,
      tuitionLine: (sessions: number, rate: string, total: string) =>
        `${sessions} buổi x ${rate} = ${total}`,
    },
    en: {
      monthPlaceholder: "Month",
      yearPlaceholder: "Year",
      monthOption: (val: number) => `Month ${val}`,
      print: "Print",
      save: "Save changes",
      pretty: "Pretty mode",
      language: "Language",
      printHelp:
        "Hide time/URL in print: disable 'Headers and footers' in the print dialog.",
      studentNotFound: "Student not found",
      reportTitle: (m: number, y: number) => `MONTHLY REPORT ${m}/${y}`,
      reportTitlePretty: (m: number, y: number) => `MONTHLY REPORT ${m} · ${y}`,
      studentLabel: "Student",
      studentBadge: "Student",
      monthBadge: (m: number, y: number) => `Month ${m} / ${y}`,
      sections: {
        summary: "I. Monthly Summary",
        comments: "II. Feedback",
        nextPlan: "III. Next Month Plan",
      },
      placeholders: {
        summary: "- Completed...",
        comments: "- Feedback...",
        nextPlan: "- New pieces...",
      },
      attendanceTitle: (m: number) => `ATTENDANCE - MONTH ${m}`,
      tableNo: "No.",
      tableStudent: "STUDENT",
      weekLabel: (w: number) => `Week ${w}`,
      legendAbsent: "Missed",
      legendPresent: "Attended",
      legendPending: "Pending",
      legendTitle: "Note",
      totalLabel: "TOTAL",
      tuitionLabel: "Tuition",
      teacherLabel: "Teacher",
      dateLabel: "Da Nang, Date",
      totalLessons: (count: number) => `${count} LESSONS`,
      tuitionLine: (sessions: number, rate: string, total: string) =>
        `${sessions} sessions x ${rate} = ${total}`,
    },
  } as const;

  const t = copy[language];

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
      toast.success(language === "vi" ? "Đã lưu báo cáo" : "Report saved");
    } catch {
      toast.error(
        language === "vi" ? "Lưu báo cáo thất bại" : "Failed to save report",
      );
    }
  };

  const handleMonthChange = (val: string) => {
    const newMonth = parseInt(val);
    if (includeStudentIdInQuery) {
      router.push(`?studentId=${studentId}&month=${newMonth}&year=${year}`);
      return;
    }
    router.push(`?month=${newMonth}&year=${year}`);
  };

  const handleYearChange = (val: string) => {
    const newYear = parseInt(val);
    if (includeStudentIdInQuery) {
      router.push(`?studentId=${studentId}&month=${month}&year=${newYear}`);
      return;
    }
    router.push(`?month=${month}&year=${newYear}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center p-8">
        <AppLoader />
      </div>
    );
  }

  if (!data?.student) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">{t.studentNotFound}</p>
      </div>
    );
  }

  const { student, lessons } = data;
  const teacherName = data?.teacherName ?? "";
  const perSessionRate = data?.teacherHourlyRate ?? 0;

  // Calculate Stats
  const validLessons = lessons.filter((l) => l.status === "COMPLETE");
  const totalSessions = validLessons.length;
  const totalTuition = totalSessions * perSessionRate;

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

  const reportCardClass = cn(
    "mx-auto min-h-[297mm] max-w-[210mm] bg-white p-8 font-serif text-black print:m-0 print:w-full print:p-0 print:shadow-none",
    prettyMode
      ? "rounded-2xl shadow-xl ring-1 ring-rose-100 print:ring-0"
      : "shadow-lg",
  );

  const statusClass = (status: string) => {
    if (status === "CANCELLED") {
      return prettyMode
        ? "bg-amber-200 text-amber-900 border-amber-300"
        : "bg-yellow-300";
    }
    if (status === "COMPLETE") {
      return prettyMode
        ? "bg-sky-200 text-sky-900 border-sky-300"
        : "bg-blue-300";
    }
    if (status === "PENDING") {
      return prettyMode
        ? "bg-rose-50 text-rose-300 border-rose-100"
        : "bg-gray-100 text-gray-400";
    }
    return "";
  };

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Controls - Hidden on Print */}
      <div className="bg-card flex flex-col justify-between gap-4 rounded-lg border p-3 shadow-sm sm:p-4 xl:flex-row print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {studentControl}
            <Select value={month.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-24 sm:w-30">
                <SelectValue placeholder={t.monthPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {t.monthOption(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-20 sm:w-25">
                <SelectValue placeholder={t.yearPlaceholder} />
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

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={language}
              onValueChange={(val: "vi" | "en") => setLanguage(val)}
            >
              <SelectTrigger className="w-24 sm:w-28">
                <SelectValue placeholder={t.language} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">VI</SelectItem>
                <SelectItem value="en">EN</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 rounded-full border px-3 py-1">
              <Label className="text-muted-foreground text-xs whitespace-nowrap">
                {t.pretty}
              </Label>
              <Switch
                checked={prettyMode}
                onCheckedChange={(val) => setPrettyMode(val)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex-1 sm:flex-none"
            >
              <Printer className="mr-2 h-4 w-4" />
              {t.print}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-200/30 text-rose-400 transition-all duration-200 hover:border-rose-300/50 hover:bg-rose-500/10 hover:text-rose-300"
                  aria-label={t.printHelp}
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                sideOffset={8}
                className="max-w-xs rounded-lg border-0 bg-linear-to-br from-rose-300/90 via-rose-400/85 to-pink-400/90 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm"
                arrowClassName="bg-rose-400/90 fill-rose-400/90 size-2 rounded-[2px]"
              >
                {t.printHelp}
              </TooltipContent>
            </Tooltip>
          </div>
          <Button
            onClick={handleSave}
            disabled={upsertReport.isPending}
            className="flex-1 sm:flex-none"
          >
            {upsertReport.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t.save}
          </Button>
        </div>
      </div>

      {/* Report Paper */}
      <div
        className={cn(
          prettyMode
            ? "rounded-3xl bg-rose-50/70 p-4 sm:p-6 lg:p-8 print:bg-white print:p-0"
            : "",
          "overflow-x-auto",
        )}
      >
        <div className={cn(reportCardClass, "min-w-[600px] sm:min-w-0")}>
          {/* Header */}
          <div className="mb-6 text-center">
            {prettyMode ? (
              <div className="flex flex-col items-center gap-3">
                <h1 className="text-2xl font-bold tracking-wide uppercase">
                  {t.reportTitlePretty(month, year)}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-semibold text-rose-700">
                    {t.studentBadge}: {student.name}
                  </span>
                  <span className="rounded-full border border-rose-200 bg-white px-3 py-1 text-rose-700">
                    {t.monthBadge(month, year)}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="mb-2 text-xl font-bold uppercase">
                  {t.reportTitle(month, year)}
                </h1>
                <p className="font-semibold">
                  {t.studentLabel}: {student.name}
                </p>
              </div>
            )}
          </div>

          {/* Sections */}
          <div className="space-y-6">
            <section
              className={cn(
                prettyMode
                  ? "rounded-xl border border-rose-200/70 bg-rose-50/60 p-4 print:border-neutral-300 print:bg-white"
                  : "",
              )}
            >
              <div className="mb-2 flex items-center gap-2 text-lg font-bold">
                {prettyMode && (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                    <Music className="h-4 w-4" />
                  </span>
                )}
                <h2>{t.sections.summary}</h2>
              </div>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="min-h-25 w-full resize-none border-none bg-transparent p-0 font-serif text-base leading-relaxed shadow-none focus-visible:ring-0"
                placeholder={t.placeholders.summary}
              />
            </section>

            <section
              className={cn(
                prettyMode
                  ? "rounded-xl border border-rose-200/70 bg-rose-50/60 p-4 print:border-neutral-300 print:bg-white"
                  : "",
              )}
            >
              <div className="mb-2 flex items-center gap-2 text-lg font-bold">
                {prettyMode && (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                )}
                <h2>{t.sections.comments}</h2>
              </div>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="min-h-37.5 w-full resize-none border-none bg-transparent p-0 font-serif text-base leading-relaxed shadow-none focus-visible:ring-0"
                placeholder={t.placeholders.comments}
              />
            </section>

            <section
              className={cn(
                prettyMode
                  ? "rounded-xl border border-rose-200/70 bg-rose-50/60 p-4 print:border-neutral-300 print:bg-white"
                  : "",
              )}
            >
              <div className="mb-2 flex items-center gap-2 text-lg font-bold">
                {prettyMode && (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                    <Target className="h-4 w-4" />
                  </span>
                )}
                <h2>{t.sections.nextPlan}</h2>
              </div>
              <Textarea
                value={nextMonthPlan}
                onChange={(e) => setNextMonthPlan(e.target.value)}
                className="min-h-25 w-full resize-none border-none bg-transparent p-0 font-serif text-base leading-relaxed shadow-none focus-visible:ring-0"
                placeholder={t.placeholders.nextPlan}
              />
            </section>

            {/* Attendance Table */}
            <section className="pt-4">
              <h2 className="mb-4 text-center text-lg font-bold">
                {t.attendanceTitle(month)}
              </h2>

              <div
                className={cn(
                  "overflow-hidden",
                  prettyMode
                    ? "rounded-2xl border border-rose-200/70 bg-white/90 shadow-sm print:border-neutral-300"
                    : "border border-black",
                )}
              >
                {/* Header Row */}
                <div
                  className={cn(
                    "grid text-center font-bold",
                    prettyMode
                      ? "divide-x divide-rose-200/70 border-b border-rose-200/70 bg-rose-50 print:divide-neutral-300 print:border-neutral-300"
                      : "divide-x divide-black border-b border-black",
                  )}
                  style={{
                    gridTemplateColumns: `40px 100px repeat(${weeks.length}, 1fr)`,
                  }}
                >
                  <div className="flex items-center justify-center p-2">
                    {t.tableNo}
                  </div>
                  <div className="flex items-center justify-center p-2">
                    {t.tableStudent}
                  </div>
                  {weeks.map((w) => (
                    <div
                      key={w}
                      className={cn(
                        "p-2",
                        prettyMode ? "text-base" : "text-sm",
                      )}
                    >
                      {t.weekLabel(w)}
                    </div>
                  ))}
                </div>

                {/* Data Row */}
                <div
                  className={cn(
                    "grid min-h-15 text-center",
                    prettyMode
                      ? "divide-x divide-rose-200/70 print:divide-neutral-300"
                      : "divide-x divide-black",
                  )}
                  style={{
                    gridTemplateColumns: `40px 100px repeat(${weeks.length}, 1fr)`,
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
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center border text-sm font-semibold",
                            prettyMode ? "rounded-md" : "border-black",
                            statusClass(item.status),
                          )}
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
                {prettyMode ? (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1">
                      <span className="h-3 w-3 rounded-sm border border-amber-300 bg-amber-200" />
                      {t.legendAbsent}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1">
                      <span className="h-3 w-3 rounded-sm border border-sky-300 bg-sky-200" />
                      {t.legendPresent}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1">
                      <span className="h-3 w-3 rounded-sm border border-rose-200 bg-rose-50" />
                      {t.legendPending}
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span>
                        {t.legendTitle}: {t.legendAbsent}:
                      </span>
                      <div className="h-4 w-4 border border-black bg-yellow-300"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{t.legendPresent}:</span>
                      <div className="h-4 w-4 border border-black bg-blue-300"></div>
                    </div>
                  </div>
                )}

                {prettyMode ? (
                  <div className="rounded-xl border border-rose-200/70 bg-rose-50/60 p-4 text-sm print:border-neutral-300 print:bg-white">
                    <div className="text-base font-bold italic">
                      {t.totalLabel}: {t.totalLessons(totalSessions)}
                    </div>
                    <div className="mt-2 italic">
                      {t.tuitionLabel}{" "}
                      {t.tuitionLine(
                        totalSessions,
                        formatCurrencyNumber(perSessionRate, currency),
                        formatCurrency(totalTuition, currency),
                      )}
                    </div>
                    <div className="mt-4 text-right italic">
                      {t.dateLabel} {format(new Date(), "dd/MM/yyyy")}
                    </div>
                    <div className="mt-6 text-right">
                      <div className="font-semibold">{t.teacherLabel}</div>
                      <div className="mt-6 font-semibold">
                        {teacherName || "__________________"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mt-4 text-lg font-bold italic">
                      {t.totalLabel}: {t.totalLessons(totalSessions)}
                    </div>
                    <div className="mt-2 text-sm italic">
                      {t.tuitionLabel}{" "}
                      {t.tuitionLine(
                        totalSessions,
                        formatCurrencyNumber(perSessionRate, currency),
                        formatCurrency(totalTuition, currency),
                      )}
                    </div>
                    <div className="mt-6 text-right italic">
                      {t.dateLabel} {format(new Date(), "dd/MM/yyyy")}
                    </div>
                    <div className="mt-10 text-right">
                      <div className="font-semibold">{t.teacherLabel}</div>
                      <div className="mt-8 font-semibold">
                        {teacherName || "__________________"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
