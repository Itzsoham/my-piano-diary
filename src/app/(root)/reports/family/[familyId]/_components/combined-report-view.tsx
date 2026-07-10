"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Printer, Info, Users } from "lucide-react";

import { AppLoader } from "@/components/ui/app-loader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/trpc/react";
import { formatCurrency, formatCurrencyNumber } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import {
  computeTuition,
  type GroupSummary,
} from "@/lib/report/tuition";
import { buildWeeksData, resolveWeeks } from "@/lib/report/attendance";

const copy = {
  vi: {
    print: "In",
    language: "Ngôn ngữ",
    printHelp:
      "Ẩn giờ/URL khi in: tắt 'Headers and footers' trong hộp thoại in.",
    familyLabel: "Gia đình",
    familyNotFound: "Không tìm thấy gia đình",
    reportTitle: (m: number, y: number) => `BẢNG HỌC PHÍ THÁNG ${m} · ${y}`,
    attendanceTitle: (m: number) => `BẢNG ĐIỂM DANH THÁNG ${m}`,
    tableNo: "STT",
    tableStudent: "TÊN HS",
    weekLabel: (w: number) => `Tuần ${w}`,
    legendAbsent: "Buổi vắng",
    legendPresent: "Buổi đầy đủ",
    legendPending: "Chưa có",
    totalLabel: "TỔNG",
    tuitionLabel: "Học phí",
    grandTotalLabel: "Tổng học phí",
    teacherLabel: "Giáo viên",
    dateLabel: "Đà Nẵng, Ngày",
    totalLessons: (count: number) => `${count} BUỔI`,
    tuitionLine: (sessions: number, rate: string, total: string) =>
      `${sessions} buổi x ${rate} = ${total}`,
    tuitionFlat: (sessions: number, total: string) =>
      `${sessions} buổi = ${total}`,
    tuitionSpecial: (sessions: number, rate: string, total: string) =>
      `${sessions} buổi giá riêng x ${rate} = ${total}`,
    inPersonLabel: "Tại lớp",
    onlineLabel: "Trực tuyến",
  },
  en: {
    print: "Print",
    language: "Language",
    printHelp:
      "Hide time/URL in print: disable 'Headers and footers' in the print dialog.",
    familyLabel: "Family",
    familyNotFound: "Family not found",
    reportTitle: (m: number, y: number) => `TUITION SHEET ${m} · ${y}`,
    attendanceTitle: (m: number) => `ATTENDANCE - MONTH ${m}`,
    tableNo: "No.",
    tableStudent: "STUDENT",
    weekLabel: (w: number) => `Week ${w}`,
    legendAbsent: "Missed",
    legendPresent: "Attended",
    legendPending: "Pending",
    totalLabel: "TOTAL",
    tuitionLabel: "Tuition",
    grandTotalLabel: "Grand total",
    teacherLabel: "Teacher",
    dateLabel: "Da Nang, Date",
    totalLessons: (count: number) => `${count} LESSONS`,
    tuitionLine: (sessions: number, rate: string, total: string) =>
      `${sessions} sessions x ${rate} = ${total}`,
    tuitionFlat: (sessions: number, total: string) =>
      `${sessions} sessions = ${total}`,
    tuitionSpecial: (sessions: number, rate: string, total: string) =>
      `${sessions} session(s) at a different rate x ${rate} = ${total}`,
    inPersonLabel: "In-person",
    onlineLabel: "Online",
  },
} as const;

const statusClass = (status: string) => {
  if (status === "CANCELLED") {
    return "bg-amber-200 text-amber-900 border-amber-300";
  }
  if (status === "COMPLETE") {
    return "bg-sky-200 text-sky-900 border-sky-300";
  }
  if (status === "PENDING") {
    return "bg-rose-50 text-rose-300 border-rose-100";
  }
  return "";
};

interface CombinedReportViewProps {
  familyId: string;
  month: number;
  year: number;
}

export function CombinedReportView({
  familyId,
  month,
  year,
}: CombinedReportViewProps) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const t = copy[language];

  const { data, isLoading } = api.family.getCombinedReport.useQuery({
    familyId,
    month,
    year,
  });
  // For the family switcher.
  const { data: families = [] } = api.family.getAll.useQuery();

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: 5 },
    (_, index) => currentYear - 2 + index,
  );

  const go = (nextMonth: number, nextYear: number, nextFamily = familyId) =>
    router.push(
      `/reports/family/${nextFamily}?month=${nextMonth}&year=${nextYear}`,
    );

  // One tuition line ("N x rate = subtotal") + a distinct line per group of
  // lessons charged a different rate. Mirrors the single-student report.
  const renderTuitionGroup = (label: string, summary: GroupSummary | null) => {
    if (!summary) return null;
    return (
      <div>
        <div className="italic">
          {label}:{" "}
          {summary.standardCount > 0
            ? t.tuitionLine(
                summary.standardCount,
                formatCurrencyNumber(summary.referenceRate, currency),
                formatCurrency(summary.standardSum, currency),
              )
            : t.tuitionFlat(
                summary.count,
                formatCurrency(summary.total, currency),
              )}
        </div>
        {summary.exceptions.map((ex) => (
          <div key={ex.rate} className="pl-3 text-[13px] text-rose-600 italic">
            +{" "}
            {t.tuitionSpecial(
              ex.count,
              formatCurrencyNumber(ex.rate, currency),
              formatCurrency(ex.sum, currency),
            )}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center p-8">
        <AppLoader />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">{t.familyNotFound}</p>
      </div>
    );
  }

  const teacherName = data.teacherName ?? "";

  // Per-student computed data. computeTuition/buildWeeksData are the SAME libs
  // the single-student report uses, so numbers here equal the individual sheets.
  const perStudent = data.students.map((student) => ({
    student,
    weeksData: buildWeeksData(student.lessons),
    tuition: computeTuition(student.lessons, {
      inPersonRate: student.inPersonRate,
      onlineRate: student.onlineRate,
    }),
  }));

  // Union of weeks so every student's row has the same columns.
  const weeks = resolveWeeks(perStudent.map((p) => p.weeksData));
  const gridTemplate = `40px 100px repeat(${weeks.length}, 1fr)`;

  const grandTotal = perStudent.reduce(
    (sum, p) => sum + p.tuition.totalTuition,
    0,
  );

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Family report
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:mt-2 sm:text-base">
          Merged monthly attendance &amp; tuition for everyone in the family.
        </p>
      </div>

      {/* Controls — hidden on print */}
      <div className="bg-card flex flex-col justify-between gap-4 rounded-lg border p-3 shadow-sm sm:p-4 xl:flex-row print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-50">
              <Label className="sr-only">{t.familyLabel}</Label>
              <Select
                value={familyId}
                onValueChange={(value) => go(month, year, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.familyLabel} />
                </SelectTrigger>
                <SelectContent>
                  {families.map((family) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select
              value={month.toString()}
              onValueChange={(val) => go(parseInt(val), year)}
            >
              <SelectTrigger className="w-24 sm:w-30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {language === "vi" ? `Tháng ${m}` : `Month ${m}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={year.toString()}
              onValueChange={(val) => go(month, parseInt(val))}
            >
              <SelectTrigger className="w-20 sm:w-25">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
        </div>
      </div>

      {/* Report paper */}
      <div className="overflow-x-auto rounded-3xl bg-rose-50/70 p-4 [-webkit-print-color-adjust:exact] [print-color-adjust:exact] sm:p-6 lg:p-8 print:bg-rose-50/70 print:p-0">
        <div className="mx-auto min-h-[297mm] max-w-[210mm] min-w-150 rounded-2xl bg-white p-8 font-serif text-black shadow-xl ring-1 ring-rose-100 [print-color-adjust:exact] [-webkit-print-color-adjust:exact] sm:min-w-0 print:m-0 print:min-h-0 print:w-full print:p-0 print:shadow-none print:ring-0">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <h1 className="text-2xl font-bold tracking-wide uppercase">
                {t.reportTitle(month, year)}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-semibold text-rose-700">
                  <Users className="h-3.5 w-3.5" />
                  {data.family.name}
                </span>
              </div>
            </div>
          </div>

          {/* One attendance block per student, stacked. */}
          <div className="space-y-6">
            {perStudent.map(({ student, weeksData, tuition }, index) => (
              <section
                key={student.id}
                className="print:break-inside-avoid"
              >
                <h2 className="mb-3 text-center text-lg font-bold">
                  {t.attendanceTitle(month)}
                </h2>

                <div className="overflow-hidden rounded-2xl border border-rose-200/70 bg-white/90 shadow-sm print:border-neutral-300">
                  {/* Header row */}
                  <div
                    className="grid divide-x divide-rose-200/70 border-b border-rose-200/70 bg-rose-50 text-center font-bold print:divide-neutral-300 print:border-neutral-300 [&>*+*]:border-l"
                    style={{ gridTemplateColumns: gridTemplate }}
                  >
                    <div className="flex items-center justify-center p-2">
                      {t.tableNo}
                    </div>
                    <div className="flex items-center justify-center p-2">
                      {t.tableStudent}
                    </div>
                    {weeks.map((w) => (
                      <div key={w} className="p-2 text-base">
                        {t.weekLabel(w)}
                      </div>
                    ))}
                  </div>

                  {/* Data row */}
                  <div
                    className="grid min-h-15 divide-x divide-rose-200/70 text-center print:divide-neutral-300 [&>*+*]:border-l"
                    style={{ gridTemplateColumns: gridTemplate }}
                  >
                    <div className="flex items-center justify-center p-2">
                      {index + 1}
                    </div>
                    <div className="flex items-center justify-center p-2 font-bold uppercase">
                      {student.name}
                    </div>
                    {weeks.map((w) => {
                      const rowLessons = weeksData[w] ?? [];
                      const lessonCount = rowLessons.length;
                      return (
                        <div
                          key={w}
                          className="grid h-full min-h-21.25 divide-x divide-rose-200/70 [&>*+*]:border-l"
                          style={{
                            gridTemplateColumns: `repeat(${lessonCount || 1}, 1fr)`,
                          }}
                        >
                          {rowLessons.map((item, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "flex h-full flex-col items-center justify-center p-1 font-semibold",
                                statusClass(item.status),
                              )}
                            >
                              <span className="text-[14px]">{item.day}</span>
                              {item.cancelReason && (
                                <span className="mt-0.5 max-w-full px-1 text-center text-[10px] leading-[1.1] font-normal wrap-break-word uppercase">
                                  {item.cancelReason}
                                </span>
                              )}
                            </div>
                          ))}
                          {lessonCount === 0 && <div className="h-full" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Per-student total */}
                <div className="mt-2 rounded-xl border border-rose-200/70 bg-rose-50/60 p-3 text-sm print:border-neutral-300 print:bg-rose-50/60">
                  <div className="font-bold italic">
                    {t.totalLabel}: {t.totalLessons(tuition.totalSessions)}
                  </div>
                  {tuition.bothGroups ? (
                    <div className="mt-1 space-y-0.5">
                      {renderTuitionGroup(t.inPersonLabel, tuition.inPersonSummary)}
                      {renderTuitionGroup(t.onlineLabel, tuition.onlineSummary)}
                      <div className="font-semibold italic">
                        {t.tuitionLabel}:{" "}
                        {formatCurrency(tuition.totalTuition, currency)}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      {renderTuitionGroup(
                        t.tuitionLabel,
                        tuition.inPersonSummary ?? tuition.onlineSummary,
                      )}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* Legend (once) */}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
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

          {/* Grand total */}
          <div className="mt-4 rounded-xl border border-rose-200/70 bg-rose-50/60 p-4 text-sm print:break-inside-avoid print:border-neutral-300 print:bg-rose-50/60">
            <div className="text-base font-bold">
              {t.grandTotalLabel}: {formatCurrency(grandTotal, currency)}
            </div>
            {perStudent.length > 1 && (
              <div className="mt-1 text-sm italic">
                {perStudent
                  .map(
                    (p) =>
                      `${formatCurrency(p.tuition.totalTuition, currency)} (${p.student.name})`,
                  )
                  .join("  +  ")}
              </div>
            )}

            <div className="mt-3 text-right italic">
              {t.dateLabel} {format(new Date(), "dd/MM/yyyy")}
            </div>
            <div className="mt-4 text-right">
              <div className="font-semibold">{t.teacherLabel}</div>
              <div className="mt-3 font-semibold">
                {teacherName || "__________________"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
