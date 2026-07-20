"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { format, getWeekOfMonth } from "date-fns";
import { Printer, Info, Users, Monitor } from "lucide-react";

import { AppLoader } from "@/components/ui/app-loader";
import { Button } from "@/components/ui/button";
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
import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { api } from "@/trpc/react";
import { formatCurrency, formatCurrencyNumber } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { computeTuition, type GroupSummary } from "@/lib/report/tuition";
import { buildWeeksData, resolveWeeks } from "@/lib/report/attendance";

const copy = {
  vi: {
    print: "In",
    language: "Ngôn ngữ",
    printHelp:
      "Ẩn giờ/URL khi in: tắt 'Headers and footers' trong hộp thoại in.",
    familyLabel: "Gia đình",
    familyNotFound: "Không tìm thấy gia đình",
    notFoundHint: "Gia đình này có thể đã bị xoá hoặc đổi tên.",
    monthPlaceholder: "Tháng",
    yearPlaceholder: "Năm",
    heroTitleMain: "Bảng học phí",
    heroTitleEm: "gia đình",
    heroStudentsLabel: (n: number) => `${n} học sinh`,
    heroLessonsLabel: "buổi trên bảng",
    heroCompleteLabel: "buổi đã hoàn thành, được tính phí",
    monthBadge: (m: number, y: number) => `Tháng ${m} / ${y}`,
    reportTitle: (m: number, y: number) => `BẢNG HỌC PHÍ THÁNG ${m} · ${y}`,
    attendanceTitle: (m: number) => `BẢNG ĐIỂM DANH THÁNG ${m}`,
    tableNo: "STT",
    tableStudent: "TÊN HS",
    weekLabel: (w: number) => `Tuần ${w}`,
    legendGroupLabel: "Chú giải",
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
    notFoundHint: "This family may have been removed or renamed.",
    monthPlaceholder: "Month",
    yearPlaceholder: "Year",
    heroTitleMain: "Family Tuition",
    heroTitleEm: "Sheet",
    heroStudentsLabel: (n: number) => `${n} student${n === 1 ? "" : "s"}`,
    heroLessonsLabel: "lessons on the sheet",
    heroCompleteLabel: "COMPLETE and billable",
    monthBadge: (m: number, y: number) => `Month ${m} / ${y}`,
    reportTitle: (m: number, y: number) => `TUITION SHEET ${m} · ${y}`,
    attendanceTitle: (m: number) => `ATTENDANCE - MONTH ${m}`,
    tableNo: "No.",
    tableStudent: "STUDENT",
    weekLabel: (w: number) => `Week ${w}`,
    legendGroupLabel: "Legend",
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

// Status vocabulary for the attendance grid, shared with the single-student
// report: colour is never the only signal, so every cell also carries its own
// glyph (and CANCELLED strikes the day number), so the sheet still reads
// correctly out of a black-and-white printer.
const getStatusGlyph = (status: string): string => {
  if (status === "COMPLETE") return "✓";
  if (status === "CANCELLED") return "✕";
  if (status === "PENDING") return "•";
  return "";
};

const getDayCellClasses = (status: string): string => {
  if (status === "CANCELLED") return "bg-no-bg text-no-fg border-transparent";
  if (status === "COMPLETE") return "bg-ok-bg text-ok-fg border-transparent";
  if (status === "PENDING") {
    return "bg-wait-bg text-wait-fg border-current border-dashed";
  }
  return "bg-muted text-ink-soft border-transparent";
};

const getDaySrLabel = (
  status: string,
  isOnline: boolean,
  t: {
    legendPresent: string;
    legendAbsent: string;
    legendPending: string;
    onlineLabel: string;
  },
): string => {
  const online = isOnline ? ` (${t.onlineLabel})` : "";
  if (status === "COMPLETE") return t.legendPresent + online;
  if (status === "CANCELLED") return t.legendAbsent;
  if (status === "PENDING") return t.legendPending;
  return status;
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
      <div className="tabular-nums">
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
          <div
            key={ex.rate}
            className="text-special-fg pl-4 text-[13px] italic"
          >
            <span aria-hidden="true">★</span>{" "}
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
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <Mochi mood="sleepy" size={104} />
        <p className="text-ink-soft text-sm">{t.familyNotFound}</p>
        <p className="text-ink-soft/80 max-w-xs text-xs">{t.notFoundHint}</p>
      </div>
    );
  }

  const teacherName = data.teacherName ?? "";

  // Per-student computed data. computeTuition/buildWeeksData are the SAME libs
  // the single-student report uses, so numbers here equal the individual
  // sheets. weeksRaw is a second, parallel bucketing of the RAW lessons (same
  // predicate/order as buildWeeksData) so weeksRaw[w][idx] and
  // weeksData[w][idx] always refer to the same lesson — WeekCell only carries
  // {day, status, cancelReason}, so this recovers `isOnline` for the grid
  // without editing the shared attendance lib.
  const perStudent = data.students.map((student) => {
    const weeksRaw: Record<number, typeof student.lessons> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    };
    for (const lesson of student.lessons) {
      const week = getWeekOfMonth(lesson.date, { weekStartsOn: 1 });
      weeksRaw[week]?.push(lesson);
    }
    return {
      student,
      weeksData: buildWeeksData(student.lessons),
      weeksRaw,
      tuition: computeTuition(student.lessons, {
        inPersonRate: student.inPersonRate,
        onlineRate: student.onlineRate,
      }),
    };
  });

  // Union of weeks so every student's row has the same columns.
  const weeks = resolveWeeks(perStudent.map((p) => p.weeksData));
  const gridTemplate = `40px 100px repeat(${weeks.length}, 1fr)`;

  const grandTotal = perStudent.reduce(
    (sum, p) => sum + p.tuition.totalTuition,
    0,
  );

  // Hero counts only — never the money (the tuition figure is stated once, in
  // the grand-total box below).
  const studentCount = data.students.length;
  const totalLessonsOnSheet = data.students.reduce(
    (sum, s) => sum + s.lessons.length,
    0,
  );
  const completeLessons = perStudent.reduce(
    (sum, p) => sum + p.tuition.totalSessions,
    0,
  );

  return (
    <>
      {/* ── HERO — screen only ─────────────────────────────────────────── */}
      <section className="px-4 pt-4 lg:px-6 print:hidden">
        <div className="hero-band scallop-b relative isolate overflow-hidden rounded-3xl px-6 py-7 shadow-(--sh) sm:px-9 sm:py-9">
          {/* drifting blobs — decorative */}
          <div
            aria-hidden="true"
            className="bg-cotton/50 motion-safe:animate-drift pointer-events-none absolute -top-10 -right-6 -z-10 size-40 rounded-[46%_54%_40%_60%/55%_45%_60%_40%]"
          />
          <div
            aria-hidden="true"
            className="bg-mint/40 pointer-events-none absolute -bottom-16 left-1/3 -z-10 size-44 rounded-[46%_54%_40%_60%/55%_45%_60%_40%] motion-safe:animate-[drift_26s_ease-in-out_infinite]"
          />

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-block">
                <h1 className="text-ink flex flex-wrap items-center gap-2 font-serif text-[clamp(1.5rem,3.2vw,2.1rem)] leading-tight font-bold">
                  {t.heroTitleMain}{" "}
                  <em className="font-normal text-pink-700 italic">
                    {t.heroTitleEm}
                  </em>
                </h1>
                <Squiggle className="text-bubblegum mt-0.5 h-2.5 w-full max-w-60" />
              </div>

              <p className="text-ink-soft mt-3 max-w-[62ch] text-sm leading-relaxed sm:text-[15px]">
                <b className="text-ink font-semibold">{data.family.name}</b> ·{" "}
                {t.monthBadge(month, year)} —{" "}
                <b className="text-ink font-semibold">{studentCount}</b>{" "}
                {t.heroStudentsLabel(studentCount)},{" "}
                <b className="text-ink font-semibold">{totalLessonsOnSheet}</b>{" "}
                {t.heroLessonsLabel},{" "}
                <b className="text-ink font-semibold">{completeLessons}</b>{" "}
                {t.heroCompleteLabel}.
              </p>
            </div>

            <Mochi
              mood={completeLessons === 0 ? "sleepy" : "content"}
              bob
              size={108}
              className="hidden shrink-0 sm:block"
            />
          </div>
        </div>
      </section>

      {/* ── CONTROLS — screen only ─────────────────────────────────────── */}
      <section className="px-4 lg:px-6 print:hidden">
        <div className="rounded-3xl border border-(--line-pink) bg-linear-to-br from-teal-100 via-teal-50 to-pink-50 p-3 shadow-(--sh-sm) sm:p-4">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold tracking-wide text-teal-700 uppercase">
                  {t.familyLabel}
                </span>
                <Select
                  value={familyId}
                  onValueChange={(value) => go(month, year, value)}
                >
                  <SelectTrigger className="bg-card w-full min-w-50 rounded-full">
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

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold tracking-wide text-teal-700 uppercase">
                  {t.monthPlaceholder}
                </span>
                <Select
                  value={month.toString()}
                  onValueChange={(val) => go(parseInt(val), year)}
                >
                  <SelectTrigger className="bg-card w-24 rounded-full sm:w-30">
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
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold tracking-wide text-teal-700 uppercase">
                  {t.yearPlaceholder}
                </span>
                <Select
                  value={year.toString()}
                  onValueChange={(val) => go(month, parseInt(val))}
                >
                  <SelectTrigger className="bg-card w-20 rounded-full sm:w-25">
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
              </div>

              <div className="flex flex-col gap-1.5">
                <span
                  id="report-lang-label"
                  className="text-[11px] font-bold tracking-wide text-teal-700 uppercase"
                >
                  {t.language}
                </span>
                <div
                  role="group"
                  aria-labelledby="report-lang-label"
                  className="border-border bg-card/60 inline-flex items-center gap-0.5 rounded-full border p-1"
                >
                  <button
                    type="button"
                    aria-pressed={language === "vi"}
                    onClick={() => setLanguage("vi")}
                    className={cn(
                      "min-h-9 min-w-12 rounded-full px-3 text-xs font-bold transition-colors",
                      language === "vi"
                        ? "bg-primary text-primary-foreground shadow-(--sh-xs)"
                        : "text-ink-soft hover:text-ink",
                    )}
                  >
                    VI
                  </button>
                  <button
                    type="button"
                    aria-pressed={language === "en"}
                    onClick={() => setLanguage("en")}
                    className={cn(
                      "min-h-9 min-w-12 rounded-full px-3 text-xs font-bold transition-colors",
                      language === "en"
                        ? "bg-primary text-primary-foreground shadow-(--sh-xs)"
                        : "text-ink-soft hover:text-ink",
                    )}
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="flex-1 rounded-full sm:flex-none"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {t.print}
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-(--line-pink) text-pink-400 transition-colors duration-200 hover:bg-pink-50 hover:text-pink-600"
                      aria-label={t.printHelp}
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    sideOffset={8}
                    className="bg-primary text-primary-foreground max-w-xs rounded-lg border-0 px-2.5 py-1.5 text-xs font-medium shadow-lg"
                    arrowClassName="bg-primary fill-primary size-2 rounded-[2px]"
                  >
                    {t.printHelp}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE MAT + THE PAPER ───────────────────────────────────────── */}
      <section className="px-4 pb-2 lg:px-6 print:m-0 print:max-w-none print:p-0">
        <div className="from-floss rounded-[2rem] border border-(--line-pink) bg-linear-to-br via-pink-50 to-pink-100 p-4 shadow-(--sh) sm:p-6 lg:p-8 print:rounded-none print:border-0 print:bg-transparent print:p-0 print:shadow-none">
          {/* Report Paper — its own horizontal-scroll boundary, so the very
              narrowest phones scroll just the sheet. */}
          <div className="w-full overflow-x-auto print:overflow-visible">
            <div
              className={cn(
                "bg-card text-ink mx-auto min-h-[297mm] max-w-[210mm] min-w-150 rounded-3xl p-8 font-serif shadow-(--sh-xl) ring-1 ring-(--line-pink) [-webkit-print-color-adjust:exact] [print-color-adjust:exact] sm:min-w-0",
                "print:m-0 print:min-h-0 print:w-full print:rounded-none print:p-0 print:text-black print:shadow-none print:ring-0",
              )}
            >
              {/* ── 1 · HEADER — the one ornament budgeted to survive print ── */}
              <header className="text-center">
                <Blossom size={22} className="text-bubblegum mx-auto" />
                <h2 className="text-ink mt-2.5 text-xl font-bold tracking-wide uppercase sm:text-2xl">
                  {t.reportTitle(month, year)}
                </h2>
                <hr className="bg-bubblegum mx-auto my-4 h-px w-full max-w-85 rounded-full border-0" />
                <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-(--line-pink) bg-pink-100 px-3 py-1 font-semibold text-pink-700">
                    <Users className="h-3.5 w-3.5" />
                    {data.family.name}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-(--line-strong) bg-teal-100 px-3 py-1 font-semibold text-teal-700 tabular-nums">
                    {t.monthBadge(month, year)}
                  </span>
                </div>
              </header>

              {/* ── one attendance block per student, in STT order ────────── */}
              <div className="mt-6 space-y-6">
                {perStudent.map(
                  ({ student, weeksData, weeksRaw, tuition }, index) => (
                    <section
                      key={student.id}
                      className="rise print:break-inside-avoid"
                      style={{ "--i": index } as CSSProperties}
                    >
                      <h3 className="text-ink mb-3 text-center text-lg font-bold tracking-wide">
                        {t.attendanceTitle(month)}
                        <span className="mt-1 block text-sm font-semibold tracking-normal text-pink-700 normal-case">
                          {index + 1}. {student.name}
                        </span>
                      </h3>

                      <div
                        role="table"
                        aria-label={`${t.attendanceTitle(month)} — ${student.name}`}
                        className="border-border bg-card overflow-hidden rounded-2xl border shadow-(--sh-xs) print:border-neutral-300"
                      >
                        {/* header row */}
                        <div
                          role="row"
                          className="divide-border border-border bg-muted grid divide-x border-b text-center font-bold print:divide-neutral-300 print:border-neutral-300 [&>*+*]:border-l"
                          style={{ gridTemplateColumns: gridTemplate }}
                        >
                          <div
                            role="columnheader"
                            className="text-ink-soft flex items-center justify-center p-2 text-xs uppercase"
                          >
                            {t.tableNo}
                          </div>
                          <div
                            role="columnheader"
                            className="text-ink-soft flex items-center justify-center p-2 text-xs uppercase"
                          >
                            {t.tableStudent}
                          </div>
                          {weeks.map((w) => (
                            <div
                              key={w}
                              role="columnheader"
                              className="text-ink p-2 text-base"
                            >
                              {t.weekLabel(w)}
                            </div>
                          ))}
                        </div>

                        {/* data row */}
                        <div
                          role="row"
                          className="divide-border grid min-h-15 divide-x text-center print:divide-neutral-300 [&>*+*]:border-l"
                          style={{ gridTemplateColumns: gridTemplate }}
                        >
                          <div
                            role="cell"
                            className="bg-muted text-ink-soft flex items-center justify-center p-2 font-bold tabular-nums"
                          >
                            {index + 1}
                          </div>
                          <div
                            role="cell"
                            className="bg-muted flex items-center justify-center p-2 font-bold uppercase"
                          >
                            {student.name}
                          </div>
                          {weeks.map((w) => {
                            const rowLessons = weeksData[w] ?? [];
                            const lessonCount = rowLessons.length;
                            return (
                              <div
                                key={w}
                                role="cell"
                                className="divide-border grid h-full min-h-21.25 divide-x [&>*+*]:border-l"
                                style={{
                                  gridTemplateColumns: `repeat(${lessonCount || 1}, 1fr)`,
                                }}
                              >
                                {rowLessons.map((item, idx) => {
                                  const isOnline =
                                    weeksRaw[w]?.[idx]?.isOnline ?? false;
                                  return (
                                    <div
                                      key={idx}
                                      className={cn(
                                        "flex h-full flex-col items-center justify-center gap-0.5 rounded-lg border p-1 font-semibold",
                                        getDayCellClasses(item.status),
                                      )}
                                    >
                                      <span className="flex items-center gap-1 text-[14px] tabular-nums">
                                        <span
                                          aria-hidden="true"
                                          className="text-[10px]"
                                        >
                                          {getStatusGlyph(item.status)}
                                        </span>
                                        <span className="sr-only">
                                          {getDaySrLabel(
                                            item.status,
                                            isOnline,
                                            t,
                                          )}
                                        </span>
                                        {isOnline && (
                                          <Monitor
                                            aria-hidden="true"
                                            className="size-2.5"
                                          />
                                        )}
                                        <span
                                          className={cn(
                                            item.status === "CANCELLED" &&
                                              "line-through decoration-1",
                                          )}
                                        >
                                          {item.day}
                                        </span>
                                      </span>
                                      {item.cancelReason && (
                                        <span className="mt-0.5 max-w-full px-1 text-center text-[9.5px] leading-[1.15] font-bold tracking-wide wrap-break-word uppercase">
                                          {item.cancelReason}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                                {lessonCount === 0 && (
                                  <div className="h-full" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* per-student total */}
                      <div className="mt-2.5 rounded-2xl border border-pink-200 bg-pink-50 p-4 text-sm print:break-inside-avoid">
                        <div className="border-b border-pink-200 pb-2.5 text-[13px] font-bold tracking-wide text-pink-700 uppercase tabular-nums">
                          {t.totalLabel}:{" "}
                          {t.totalLessons(tuition.totalSessions)}
                        </div>
                        {tuition.bothGroups ? (
                          <div className="mt-2 space-y-1">
                            {renderTuitionGroup(
                              t.inPersonLabel,
                              tuition.inPersonSummary,
                            )}
                            {renderTuitionGroup(
                              t.onlineLabel,
                              tuition.onlineSummary,
                            )}
                            <div className="mt-1 border-t border-dashed border-pink-200/70 pt-1.5 font-semibold">
                              {t.tuitionLabel}:{" "}
                              <span className="tabular-nums">
                                {formatCurrency(tuition.totalTuition, currency)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            {renderTuitionGroup(
                              t.tuitionLabel,
                              tuition.inPersonSummary ?? tuition.onlineSummary,
                            )}
                          </div>
                        )}
                      </div>
                    </section>
                  ),
                )}
              </div>

              {/* ── legend — once, sober ────────────────────────────────── */}
              <div
                role="group"
                aria-label={t.legendGroupLabel}
                className="mt-5 flex flex-wrap gap-2 text-xs"
              >
                <span className="border-ok-fg/25 bg-ok-bg text-ok-fg inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold">
                  <span aria-hidden="true">✓</span>
                  {t.legendPresent}
                </span>
                <span className="border-no-fg/25 bg-no-bg text-no-fg inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold">
                  <span aria-hidden="true">✕</span>
                  {t.legendAbsent}
                </span>
                <span className="border-wait-fg/25 bg-wait-bg text-wait-fg inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold">
                  <span aria-hidden="true">•</span>
                  {t.legendPending}
                </span>
              </div>

              {/* ── grand total — the money anchor, stated once ───────────── */}
              <div className="mt-5 rounded-2xl border border-pink-200 bg-pink-50 p-5 print:break-inside-avoid">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-bold tracking-wide text-pink-700 uppercase">
                    {t.grandTotalLabel}
                  </span>
                  <span className="text-[clamp(21px,3vw,27px)] font-bold whitespace-nowrap text-pink-700 tabular-nums">
                    {formatCurrency(grandTotal, currency)}
                  </span>
                </div>

                {perStudent.length > 1 && (
                  <p className="text-ink-soft mt-3 border-t border-dashed border-pink-200/70 pt-3 text-[13px] italic">
                    {perStudent
                      .map(
                        (p) =>
                          `${formatCurrency(p.tuition.totalTuition, currency)} (${p.student.name})`,
                      )
                      .join("  +  ")}
                  </p>
                )}
              </div>

              {/* Sign-off */}
              <div className="mt-6 flex justify-end print:break-inside-avoid">
                <div className="min-w-52.5 text-center">
                  <p className="text-ink-soft text-sm italic tabular-nums">
                    {t.dateLabel} {format(new Date(), "dd/MM/yyyy")}
                  </p>
                  <p className="mt-1 text-sm font-bold tracking-wide uppercase">
                    {t.teacherLabel}
                  </p>
                  <p className="mt-11 text-base font-bold">
                    {teacherName || "__________________"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
