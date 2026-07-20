"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { AppLoader } from "@/components/ui/app-loader";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, getWeekOfMonth } from "date-fns";
import {
  Loader2,
  Save,
  Printer,
  Info,
  Monitor,
  ChevronDown,
} from "lucide-react";
import { api } from "@/trpc/react";
import { formatCurrency, formatCurrencyNumber } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { computeTuition, type GroupSummary } from "@/lib/report/tuition";
import { buildWeeksData, resolveWeeks } from "@/lib/report/attendance";
import { Blossom, Sparkle } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";

type LessonMetadata = Record<
  string,
  {
    reason: string;
    customReason: string;
    isSpecial: boolean;
    color: string;
  }
>;

const normalizeLessonMetadata = (value: unknown): LessonMetadata => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const metadata: LessonMetadata = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }

    const item = entry as Record<string, unknown>;
    metadata[key] = {
      reason: typeof item.reason === "string" ? item.reason : "",
      customReason:
        typeof item.customReason === "string" ? item.customReason : "",
      isSpecial: item.isSpecial === true,
      color: typeof item.color === "string" ? item.color : "",
    };
  }

  return metadata;
};

// Status vocabulary shared by the attendance grid, its legend and the
// screen-only timeline, so one lesson reads the same way everywhere on the
// screen. Colour is never the only signal: every status also gets its own
// glyph and a short word, so the sheet still reads correctly out of a
// black-and-white printer (see globals.css tokens ok/no/wait/special-*).
const getStatusGlyph = (status: string, isSpecial: boolean): string => {
  if (isSpecial) return "★";
  if (status === "COMPLETE") return "✓";
  if (status === "CANCELLED") return "✕";
  if (status === "PENDING") return "•";
  return "";
};

// Attendance-grid cell tone. PENDING/special also get a border STYLE (dashed /
// dotted), not just a colour, so the three exceptional statuses stay tellable
// apart even when a printer desaturates the wash.
const getDayCellClasses = (status: string, isSpecial: boolean): string => {
  if (isSpecial) {
    return "bg-special-bg text-special-fg border-current border-dotted";
  }
  if (status === "CANCELLED") {
    return "bg-no-bg text-no-fg border-transparent";
  }
  if (status === "COMPLETE") {
    return "bg-ok-bg text-ok-fg border-transparent";
  }
  if (status === "PENDING") {
    return "bg-wait-bg text-wait-fg border-current border-dashed";
  }
  return "bg-muted text-ink-soft border-transparent";
};

// Same vocabulary, styled for the timeline's dot + status word instead of a
// filled chip.
const getTimelineTone = (
  status: string,
  isSpecial: boolean,
): { dot: string; text: string } => {
  if (isSpecial) return { dot: "text-special-fg", text: "text-special-fg" };
  if (status === "COMPLETE") return { dot: "text-ok-dot", text: "text-ok-fg" };
  if (status === "CANCELLED") return { dot: "text-no-dot", text: "text-no-fg" };
  if (status === "PENDING")
    return { dot: "text-wait-dot", text: "text-wait-fg" };
  return { dot: "text-ink-soft", text: "text-ink-soft" };
};

const getStatusLabel = (
  status: string,
  isSpecial: boolean,
  lang: "vi" | "en",
): string => {
  if (isSpecial) {
    return lang === "vi" ? "Hoàn thành · có ghi chú" : "Complete · noted";
  }
  if (status === "COMPLETE") return lang === "vi" ? "Hoàn thành" : "Complete";
  if (status === "CANCELLED") return lang === "vi" ? "Vắng" : "Cancelled";
  if (status === "PENDING") {
    return lang === "vi" ? "Chưa đánh dấu" : "Pending";
  }
  return "";
};

const getStatusSrLabel = (
  status: string,
  isSpecial: boolean,
  isOnline: boolean,
  lang: "vi" | "en",
): string => {
  const online = isOnline ? (lang === "vi" ? ", trực tuyến" : ", online") : "";
  if (isSpecial) {
    return (
      (lang === "vi" ? "Hoàn thành, có ghi chú" : "Complete, noted") + online
    );
  }
  if (status === "COMPLETE") {
    return (lang === "vi" ? "Hoàn thành" : "Complete") + online;
  }
  if (status === "CANCELLED") return lang === "vi" ? "Vắng" : "Cancelled";
  if (status === "PENDING") return lang === "vi" ? "Chưa có" : "Pending";
  return "";
};

// Mochi's note on the mat: a qualitative line + the counts, NEVER the money
// figure (the tuition total is stated once, in the totals box).
const getMochiMood = (
  totalCount: number,
  pendingCount: number,
  cancelledCount: number,
): "content" | "delighted" | "sleepy" => {
  if (totalCount === 0) return "sleepy";
  if (pendingCount === 0 && cancelledCount === 0) return "delighted";
  return "content";
};

const getMochiNarrative = (
  totalCount: number,
  pendingCount: number,
  lang: "vi" | "en",
): string => {
  if (totalCount === 0) {
    return lang === "vi"
      ? "Chưa có buổi học nào trong tháng này."
      : "No lessons logged for this month yet.";
  }
  if (pendingCount > 0) {
    return lang === "vi"
      ? `Còn ${pendingCount} buổi chưa đánh dấu — cập nhật để hoàn thiện bảng điểm danh tháng này.`
      : `${pendingCount} lesson${pendingCount === 1 ? "" : "s"} still ${
          pendingCount === 1 ? "needs" : "need"
        } a status before this sheet is complete.`;
  }
  return lang === "vi"
    ? "Mọi buổi học trong tháng đã được đánh dấu đầy đủ."
    : "Every lesson this month has been marked — nicely done.";
};

// The "ruled paper" wash behind the three editable notes. Inline, not a
// Tailwind arbitrary class, so the literal commas/spaces in the gradient never
// need bracket-escaping — and it only ever matters on screen: every textarea
// below is print:hidden, swapped for a plain paragraph when the sheet prints.
const ruledNoteStyle: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(180deg, transparent 0 27px, var(--line-pink) 27px 28px)",
  backgroundAttachment: "local",
};

interface ReportViewProps {
  studentId: string;
  month: number;
  year: number;
  includeStudentIdInQuery?: boolean;
  reportBasePath?: string;
  studentControl?: ReactNode;
}

export function ReportView({
  studentId,
  month,
  year,
  includeStudentIdInQuery = false,
  reportBasePath,
  studentControl,
}: ReportViewProps) {
  const router = useRouter();
  const { currency } = useCurrency();

  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [pretty, setPretty] = useState(true);
  const [summary, setSummary] = useState("");
  const [comments, setComments] = useState("");
  const [nextMonthPlan, setNextMonthPlan] = useState("");
  const [tuitionNote, setTuitionNote] = useState("");

  // Lesson metadata tracking for custom reasons and colors
  const [lessonMetadata, setLessonMetadata] = useState<LessonMetadata>({});
  const [selectedLesson, setSelectedLesson] = useState<{
    key: string;
    day: number;
    status: string;
    originalReason?: string;
  } | null>(null);
  const [editReason, setEditReason] = useState("");
  const [isSpecial, setIsSpecial] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);

  const utils = api.useUtils();
  const { data, isLoading } = api.report.getStudentReport.useQuery({
    studentId,
    month,
    year,
  });

  const upsertReport = api.report.upsertReport.useMutation({
    // Refresh every cache that reflects this report: the editor's own query,
    // the reports list (preview/updatedAt columns + newly created rows), and
    // the raw getByMonth lookup. Without this, the 5-min staleTime keeps stale
    // data on screen after a save.
    onSuccess: () => {
      void utils.report.getAll.invalidate();
      void utils.report.getStudentReport.invalidate({ studentId, month, year });
      void utils.report.getByMonth.invalidate({ studentId, month, year });
    },
  });

  // The editor holds local, editable copies of the saved report fields. Reset +
  // rehydrate them from the query whenever we switch to a different report
  // (student/month/year). This follows React's "adjust state during render"
  // pattern instead of an effect, so there's no cascading extra render — and it
  // won't clobber in-progress edits when the same report refetches after a save.
  const reportKey = `${studentId}-${month}-${year}`;
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);

  if (!isLoading && hydratedKey !== reportKey) {
    setHydratedKey(reportKey);
    setSummary(data?.report?.summary ?? "");
    setComments(data?.report?.comments ?? "");
    setNextMonthPlan(data?.report?.nextMonthPlan ?? "");
    setTuitionNote(data?.report?.tuitionNote ?? "");
    setLessonMetadata(normalizeLessonMetadata(data?.report?.lessonMetadata));
  }

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
      tuitionFlat: (sessions: number, total: string) =>
        `${sessions} buổi = ${total}`,
      tuitionSpecial: (sessions: number, rate: string, total: string) =>
        `${sessions} buổi giá riêng x ${rate} = ${total}`,
      tuitionNoteLabel: "Ghi chú học phí",
      tuitionNotePlaceholder: "Ghi chú về học phí / giá đặc biệt (nếu có)...",
      inPersonLabel: "Tại lớp",
      onlineLabel: "Trực tuyến",
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
      tuitionFlat: (sessions: number, total: string) =>
        `${sessions} sessions = ${total}`,
      tuitionSpecial: (sessions: number, rate: string, total: string) =>
        `${sessions} session(s) at a different rate x ${rate} = ${total}`,
      tuitionNoteLabel: "Tuition note",
      tuitionNotePlaceholder: "Note about tuition / special rate (optional)...",
      inPersonLabel: "In-person",
      onlineLabel: "Online",
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
        tuitionNote,
        lessonMetadata,
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
    if (reportBasePath) {
      router.push(`${reportBasePath}?month=${newMonth}&year=${year}`);
      return;
    }
    if (includeStudentIdInQuery) {
      router.push(`?studentId=${studentId}&month=${newMonth}&year=${year}`);
      return;
    }
    router.push(`?month=${newMonth}&year=${year}`);
  };

  const handleYearChange = (val: string) => {
    const newYear = parseInt(val);
    if (reportBasePath) {
      router.push(`${reportBasePath}?month=${month}&year=${newYear}`);
      return;
    }
    if (includeStudentIdInQuery) {
      router.push(`?studentId=${studentId}&month=${month}&year=${newYear}`);
      return;
    }
    router.push(`?month=${month}&year=${newYear}`);
  };

  const handleLessonClick = (
    lessonKey: string,
    day: number,
    status: string,
    originalReason?: string,
  ) => {
    setSelectedLesson({ key: lessonKey, day, status, originalReason });
    const metadata = lessonMetadata[lessonKey];
    setEditReason(metadata?.customReason ?? originalReason ?? "");
    setIsSpecial(metadata?.isSpecial ?? false);
    setShowLessonDialog(true);
  };

  const handleSaveLesson = () => {
    if (!selectedLesson) return;

    const newMetadata = {
      reason: selectedLesson.originalReason ?? "",
      customReason: editReason,
      isSpecial,
      color: isSpecial ? "special" : "",
    };

    setLessonMetadata((prev) => ({
      ...prev,
      [selectedLesson.key]: newMetadata,
    }));

    setShowLessonDialog(false);
    toast.success(
      language === "vi" ? "Đã cập nhật buổi học" : "Lesson updated",
    );
  };

  const handleClearLessonMetadata = (key: string) => {
    setLessonMetadata((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
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
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <Mochi mood="sleepy" size={104} />
        <p className="text-ink-soft text-sm">{t.studentNotFound}</p>
      </div>
    );
  }

  const { student, lessons } = data;
  const teacherName = data?.teacherName ?? "";
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: 5 },
    (_, index) => currentYear - 2 + index,
  );

  // Tuition stats via the shared lib, so this view and the combined family
  // sheet compute money identically (frozen per-lesson rate, online/in-person
  // split, per-lesson rate exceptions).
  const studentInPersonRate = data?.studentLessonRate ?? 0;
  const studentOnlineRate = data?.studentOnlineLessonRate ?? 0;

  const {
    totalSessions,
    totalTuition,
    inPersonSummary,
    onlineSummary,
    bothGroups,
  } = computeTuition(lessons, {
    inPersonRate: studentInPersonRate,
    onlineRate: studentOnlineRate,
  });

  // One tuition line: "N x rate = subtotal", plus a distinct line per group of
  // lessons charged a different rate.
  const renderTuitionGroup = (label: string, summary: GroupSummary | null) => {
    if (!summary) {
      return null;
    }
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

  // Attendance grid — bucket lessons into weeks via the shared lib.
  const weeksData = buildWeeksData(lessons);
  const weeks = resolveWeeks([weeksData]);

  // A second, parallel bucketing of the RAW lessons (same predicate, same
  // iteration order as buildWeeksData), so weeksRaw[w][idx] and
  // weeksData[w][idx] always refer to the same lesson. WeekCell (the shared
  // lib's return shape) only carries {day, status, cancelReason} — this lets
  // the grid + timeline also show `isOnline`, which the report needs but the
  // shared attendance lib doesn't compute, without editing that lib.
  const weeksRaw: Record<number, typeof lessons> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };
  for (const lesson of lessons) {
    const week = getWeekOfMonth(lesson.date, { weekStartsOn: 1 });
    weeksRaw[week]?.push(lesson);
  }

  // The screen-only "month timeline" — every lesson on the sheet, in order,
  // reusing the exact week/index keys the grid uses so a special-rate flag set
  // in the dialog is reflected in both places identically.
  const timelineItems = weeks.flatMap((w) =>
    (weeksData[w] ?? []).map((item, idx) => ({
      key: `${w}-${idx}-${item.day}`,
      day: item.day,
      status: item.status,
      isOnline: weeksRaw[w]?.[idx]?.isOnline ?? false,
    })),
  );

  const pendingCount = lessons.filter((l) => l.status === "PENDING").length;
  const cancelledCount = lessons.filter((l) => l.status === "CANCELLED").length;
  const completeCount = totalSessions;
  const mochiMood = getMochiMood(lessons.length, pendingCount, cancelledCount);
  const mochiNarrative = getMochiNarrative(
    lessons.length,
    pendingCount,
    language,
  );

  const reportCardClass = cn(
    "mx-auto min-h-[297mm] max-w-[210mm] rounded-3xl bg-card p-8 font-serif text-ink shadow-(--sh-xl) ring-1 ring-(--line-pink) [print-color-adjust:exact] [-webkit-print-color-adjust:exact] print:m-0 print:min-h-0 print:w-full print:rounded-none print:p-0 print:text-black print:shadow-none print:ring-0",
  );

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6 sm:space-y-8 print:max-w-none print:space-y-4">
      {/* Controls - Hidden on Print */}
      <div className="rounded-3xl border border-(--line-pink) bg-linear-to-br from-teal-100 via-teal-50 to-pink-50 p-3 shadow-(--sh-sm) sm:p-4 print:hidden">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            {studentControl}

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold tracking-wide text-teal-700 uppercase">
                {t.monthPlaceholder}
              </span>
              <Select
                value={month.toString()}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="bg-card w-24 rounded-full sm:w-30">
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
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold tracking-wide text-teal-700 uppercase">
                {t.yearPlaceholder}
              </span>
              <Select value={year.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="bg-card w-20 rounded-full sm:w-25">
                  <SelectValue placeholder={t.yearPlaceholder} />
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

            <Button
              type="button"
              variant="outline"
              aria-pressed={pretty}
              onClick={() => setPretty((prev) => !prev)}
              className="rounded-full"
            >
              <Sparkle size={15} className="mr-1.5 text-pink-500" />
              {t.pretty}
            </Button>

            <Button
              onClick={handleSave}
              disabled={upsertReport.isPending}
              className="flex-1 rounded-full sm:flex-none"
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
      </div>

      {/* The mat: Mochi's note + the month timeline sit above the printable
          sheet, screen-only. Each is capped at the paper's own width so
          neither ever forces the whole mat to scroll on a narrow phone —
          only the paper (below) keeps its own horizontal-scroll boundary. */}
      <div className="from-floss flex flex-col items-center gap-4 rounded-[2rem] border border-(--line-pink) bg-linear-to-br via-pink-50 to-pink-100 p-4 shadow-(--sh) sm:gap-6 sm:p-6 lg:p-8 print:gap-0 print:rounded-none print:border-0 print:bg-transparent print:p-0 print:shadow-none">
        {/* Mochi — screen only, purely decorative + narrative. */}
        <div className="bg-card/80 flex w-full max-w-[210mm] items-center gap-3 rounded-2xl border border-(--line-pink) p-3 shadow-(--sh-xs) sm:gap-4 sm:p-4 print:hidden">
          <Mochi mood={mochiMood} bob size={92} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-ink flex flex-wrap items-center gap-1.5 text-sm font-semibold">
              {language === "vi"
                ? "Mochi đã xem bảng điểm danh"
                : "Mochi peeked at the sheet"}
              <span aria-hidden="true">🌸</span>
            </p>
            <p className="text-ink-soft mt-0.5 text-[13px] leading-snug">
              {mochiNarrative}
            </p>
            <p className="text-ink-soft mt-1 text-[13px] tabular-nums">
              {completeCount} {language === "vi" ? "ĐẦY ĐỦ" : "COMPLETE"}
              {pendingCount > 0 && (
                <>
                  {" · "}
                  <b className="text-wait-fg font-bold">
                    {pendingCount} {language === "vi" ? "CHƯA CÓ" : "PENDING"}
                  </b>
                </>
              )}
              {cancelledCount > 0 && (
                <>
                  {" · "}
                  {cancelledCount} {language === "vi" ? "VẮNG" : "CANCELLED"} (
                  {language === "vi" ? "không tính phí" : "not billed"})
                </>
              )}
            </p>
          </div>
        </div>

        {/* The month timeline — a screen-only preface. The printed page
            carries these same lessons in the attendance grid below. */}
        {timelineItems.length > 0 && (
          <details
            className="group bg-card/80 w-full max-w-[210mm] rounded-2xl border border-(--line-pink) px-4 py-3 shadow-(--sh-xs) print:hidden"
            open
          >
            <summary className="text-ink flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              <Blossom size={14} className="text-bubblegum shrink-0" />
              <span>
                {t.monthOption(month)} —{" "}
                {language === "vi" ? "từng buổi học" : "lesson by lesson"}
              </span>
              <span className="text-ink-soft ml-auto text-xs font-normal tabular-nums">
                {t.totalLessons(timelineItems.length)}
              </span>
              <ChevronDown
                aria-hidden="true"
                className="text-ink-soft size-4 shrink-0 transition-transform group-open:rotate-180"
              />
            </summary>

            <ol className="mt-3 flex flex-col gap-0.5">
              {timelineItems.map((row, index) => {
                const metadata = lessonMetadata[row.key];
                const rowIsSpecial = metadata?.isSpecial ?? false;
                const isLast = index === timelineItems.length - 1;
                const tone = getTimelineTone(row.status, rowIsSpecial);

                return (
                  <li
                    key={row.key}
                    className="rise grid grid-cols-[34px_18px_minmax(0,1fr)] items-start gap-x-2 sm:grid-cols-[40px_20px_minmax(0,1fr)] sm:gap-x-3"
                    style={{ "--i": index } as CSSProperties}
                  >
                    <p className="text-ink pt-1 text-right text-[13px] font-bold tabular-nums">
                      {String(row.day).padStart(2, "0")}
                    </p>

                    <span
                      className="relative flex justify-center self-stretch"
                      aria-hidden="true"
                    >
                      <span
                        className={cn(
                          "absolute top-1 w-0.5 rounded-full",
                          isLast ? "h-3.5" : "-bottom-2.5",
                        )}
                        style={{
                          backgroundImage:
                            "linear-gradient(180deg, var(--mint), var(--cotton))",
                        }}
                      />
                      <span
                        className={cn(
                          "border-surface relative z-1 mt-1.5 grid size-3 place-items-center rounded-full border-2 shadow-[0_0_0_1px_var(--line)]",
                          tone.dot,
                        )}
                      >
                        <span className="size-full rounded-full bg-current" />
                      </span>
                    </span>

                    <div className="min-w-0 pb-2">
                      <p
                        className={cn(
                          "text-ink text-[13px] font-semibold",
                          row.status === "CANCELLED" &&
                            "text-ink-soft line-through decoration-1",
                        )}
                      >
                        {row.isOnline
                          ? language === "vi"
                            ? "Buổi trực tuyến"
                            : "Online lesson"
                          : language === "vi"
                            ? "Buổi tại lớp"
                            : "In-person lesson"}
                        {row.isOnline && (
                          <Monitor
                            aria-hidden="true"
                            className="text-ink-soft ml-1 inline-block size-2.75 align-[-1px]"
                          />
                        )}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 inline-flex items-center gap-1 text-[10.5px] font-bold tracking-wide uppercase",
                          tone.text,
                        )}
                      >
                        <span aria-hidden="true">
                          {getStatusGlyph(row.status, rowIsSpecial)}
                        </span>
                        {getStatusLabel(row.status, rowIsSpecial, language)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </details>
        )}

        {/* Report Paper — its own horizontal-scroll boundary, so the very
            narrowest phones scroll just the sheet, never Mochi or the
            timeline above it. */}
        <div className="w-full overflow-x-auto print:overflow-visible">
          <div className={cn(reportCardClass, "min-w-150 sm:min-w-0")}>
            {/* Header */}
            <div className="mb-6 text-center">
              <Blossom size={22} className="text-bubblegum mx-auto" />
              <h2 className="mt-2.5 text-2xl font-bold tracking-wide uppercase">
                {pretty
                  ? t.reportTitlePretty(month, year)
                  : t.reportTitle(month, year)}
              </h2>
              <hr className="bg-bubblegum mx-auto my-4 h-px w-full max-w-85 rounded-full border-0" />
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="rounded-full border border-(--line-pink) bg-pink-100 px-3 py-1 font-semibold text-pink-700">
                  {t.studentBadge}: {student.name}
                </span>
                <span className="rounded-full border border-(--line-strong) bg-teal-100 px-3 py-1 font-semibold text-teal-700 tabular-nums">
                  {t.monthBadge(month, year)}
                </span>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              <section className="print:break-inside-avoid">
                <h3 className="mb-2 flex items-center gap-2.5 text-base font-bold tracking-wide uppercase print:gap-0">
                  <span
                    aria-hidden="true"
                    className="bg-mint inline-flex size-7 shrink-0 items-center justify-center rounded-full text-teal-700 print:hidden"
                  >
                    <Blossom size={14} />
                  </span>
                  {t.sections.summary}
                </h3>
                <div className="relative">
                  <Textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    style={ruledNoteStyle}
                    className="min-h-25 w-full resize-none border-none bg-transparent p-1 font-serif text-base leading-7 shadow-none transition-colors hover:bg-pink-50/70 focus-visible:bg-pink-50 focus-visible:ring-0 print:hidden"
                    placeholder={t.placeholders.summary}
                  />
                  <div className="hidden font-serif text-base leading-relaxed whitespace-pre-wrap print:block">
                    {summary}
                  </div>
                </div>
              </section>

              <section className="print:break-inside-avoid">
                <h3 className="mb-2 flex items-center gap-2.5 text-base font-bold tracking-wide uppercase print:gap-0">
                  <span
                    aria-hidden="true"
                    className="bg-bubblegum inline-flex size-7 shrink-0 items-center justify-center rounded-full text-pink-700 print:hidden"
                  >
                    <Blossom size={14} />
                  </span>
                  {t.sections.comments}
                </h3>
                <div className="relative">
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    style={ruledNoteStyle}
                    className="min-h-37.5 w-full resize-none border-none bg-transparent p-1 font-serif text-base leading-7 shadow-none transition-colors hover:bg-pink-50/70 focus-visible:bg-pink-50 focus-visible:ring-0 print:hidden"
                    placeholder={t.placeholders.comments}
                  />
                  <div className="hidden font-serif text-base leading-relaxed whitespace-pre-wrap print:block">
                    {comments}
                  </div>
                </div>
              </section>

              <section className="print:break-inside-avoid">
                <h3 className="mb-2 flex items-center gap-2.5 text-base font-bold tracking-wide uppercase print:gap-0">
                  <span
                    aria-hidden="true"
                    className="bg-cotton inline-flex size-7 shrink-0 items-center justify-center rounded-full text-pink-700 print:hidden"
                  >
                    <Blossom size={14} />
                  </span>
                  {t.sections.nextPlan}
                </h3>
                <div className="relative">
                  <Textarea
                    value={nextMonthPlan}
                    onChange={(e) => setNextMonthPlan(e.target.value)}
                    style={ruledNoteStyle}
                    className="min-h-25 w-full resize-none border-none bg-transparent p-1 font-serif text-base leading-7 shadow-none transition-colors hover:bg-pink-50/70 focus-visible:bg-pink-50 focus-visible:ring-0 print:hidden"
                    placeholder={t.placeholders.nextPlan}
                  />
                  <div className="hidden font-serif text-base leading-relaxed whitespace-pre-wrap print:block">
                    {nextMonthPlan}
                  </div>
                </div>
              </section>

              {/* Attendance Table — DATA. Zero ornament, ever. */}
              <section className="pt-2 print:break-inside-avoid print:pt-0">
                <h3 className="text-ink mb-4 text-center text-lg font-bold tracking-wide">
                  {t.attendanceTitle(month)}
                </h3>

                <div
                  role="table"
                  aria-label={t.attendanceTitle(month)}
                  className="border-border bg-card overflow-hidden rounded-2xl border shadow-(--sh-xs) print:border-neutral-300"
                >
                  {/* Header Row */}
                  <div
                    role="row"
                    className="divide-border border-border bg-muted grid divide-x border-b text-center font-bold print:divide-neutral-300 print:border-neutral-300 [&>*+*]:border-l"
                    style={{
                      gridTemplateColumns: `40px 100px repeat(${weeks.length}, 1fr)`,
                    }}
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

                  {/* Data Row */}
                  <div
                    role="row"
                    className="divide-border grid min-h-15 divide-x text-center print:divide-neutral-300 [&>*+*]:border-l"
                    style={{
                      gridTemplateColumns: `40px 100px repeat(${weeks.length}, 1fr)`,
                    }}
                  >
                    <div
                      role="cell"
                      className="bg-muted text-ink-soft flex items-center justify-center p-2 font-bold tabular-nums"
                    >
                      1
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
                            const lessonKey = `${w}-${idx}-${item.day}`;
                            const metadata = lessonMetadata[lessonKey];
                            const displayReason =
                              metadata?.customReason ?? item.cancelReason;
                            const itemIsSpecial = metadata?.isSpecial ?? false;
                            const isOnline =
                              weeksRaw[w]?.[idx]?.isOnline ?? false;
                            return (
                              <div
                                key={idx}
                                onClick={() =>
                                  handleLessonClick(
                                    lessonKey,
                                    item.day,
                                    item.status,
                                    item.cancelReason ?? undefined,
                                  )
                                }
                                className={cn(
                                  "flex h-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border p-1 font-semibold transition-opacity hover:opacity-90 print:cursor-default",
                                  getDayCellClasses(item.status, itemIsSpecial),
                                )}
                              >
                                <span className="flex items-center gap-1 text-[14px] tabular-nums">
                                  <span
                                    aria-hidden="true"
                                    className="text-[10px]"
                                  >
                                    {getStatusGlyph(item.status, itemIsSpecial)}
                                  </span>
                                  <span className="sr-only">
                                    {getStatusSrLabel(
                                      item.status,
                                      itemIsSpecial,
                                      isOnline,
                                      language,
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
                                {displayReason && (
                                  <span className="mt-0.5 max-w-full px-1 text-center text-[9.5px] leading-[1.15] font-bold tracking-wide wrap-break-word uppercase">
                                    {displayReason}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          {lessonCount === 0 && <div className="h-full" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div
                  role="group"
                  aria-label={language === "vi" ? "Chú giải" : "Legend"}
                  className="mt-3 flex flex-wrap gap-2 text-xs"
                >
                  <span className="border-no-fg/25 bg-no-bg text-no-fg inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold">
                    <span aria-hidden="true">✕</span>
                    {t.legendAbsent}
                  </span>
                  <span className="border-ok-fg/25 bg-ok-bg text-ok-fg inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold">
                    <span aria-hidden="true">✓</span>
                    {t.legendPresent}
                  </span>
                  <span className="border-wait-fg/25 bg-wait-bg text-wait-fg inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold">
                    <span aria-hidden="true">•</span>
                    {t.legendPending}
                  </span>
                  <span className="border-special-fg/25 bg-special-bg text-special-fg inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold">
                    <span aria-hidden="true">★</span>
                    {language === "vi" ? "Có ghi chú" : "Noted"}
                  </span>
                </div>

                {/* Totals — the money anchor. The pink wash is deliberate and
                    survives print (unlike the rest of the chrome): it is the
                    one figure the parent needs to find at a glance. */}
                <div className="mt-3 rounded-2xl border border-pink-200 bg-pink-50 p-4 text-sm print:break-inside-avoid">
                  <div className="border-b border-pink-200 pb-3 text-[13px] font-bold tracking-wide text-pink-700 uppercase tabular-nums">
                    {t.totalLabel}: {t.totalLessons(totalSessions)}
                  </div>

                  {bothGroups ? (
                    <div className="mt-2.5 space-y-1.5">
                      {renderTuitionGroup(t.inPersonLabel, inPersonSummary)}
                      {renderTuitionGroup(t.onlineLabel, onlineSummary)}
                    </div>
                  ) : (
                    <div className="mt-2.5">
                      {renderTuitionGroup(
                        t.tuitionLabel,
                        inPersonSummary ?? onlineSummary,
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-pink-200 pt-3">
                    <span className="text-xs font-bold tracking-wide text-pink-700 uppercase">
                      {t.tuitionLabel}
                    </span>
                    <span className="font-num text-xl font-bold text-pink-700 tabular-nums sm:text-2xl">
                      {formatCurrency(totalTuition, currency)}
                    </span>
                  </div>

                  {/* Editable tuition note — persists and prints in the PDF */}
                  <div className="mt-3 border-t border-dashed border-pink-200/70 pt-3">
                    <Label
                      htmlFor="tuition-note"
                      className="text-xs font-semibold text-pink-700/80 print:hidden"
                    >
                      {t.tuitionNoteLabel}
                    </Label>
                    <Textarea
                      id="tuition-note"
                      value={tuitionNote}
                      onChange={(e) => setTuitionNote(e.target.value)}
                      placeholder={t.tuitionNotePlaceholder}
                      style={ruledNoteStyle}
                      className="bg-card/70 mt-1 min-h-9 resize-none border-pink-200 text-sm italic print:hidden"
                    />
                    {tuitionNote.trim() && (
                      <p className="mt-1 hidden text-sm whitespace-pre-wrap italic print:block">
                        {tuitionNote}
                      </p>
                    )}
                  </div>
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
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Edit Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>
                {language === "vi" ? "Chỉnh sửa buổi học" : "Edit Lesson"}
              </span>
              <span className="text-lg font-bold tabular-nums">
                {selectedLesson?.day}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                {language === "vi" ? "Lý do" : "Reason"}
              </Label>
              <Input
                id="reason"
                placeholder={
                  language === "vi" ? "Nhập lý do..." : "Enter reason..."
                }
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="resize-none"
              />
            </div>

            <div className="border-special-fg/25 bg-special-bg flex items-center gap-3 rounded-lg border p-3">
              <input
                type="checkbox"
                id="isSpecial"
                checked={isSpecial}
                onChange={(e) => setIsSpecial(e.target.checked)}
                className="border-special-fg/50 accent-special-fg size-4 rounded"
              />
              <Label
                htmlFor="isSpecial"
                className="flex-1 cursor-pointer text-sm font-medium"
              >
                {language === "vi"
                  ? "✨ Đánh dấu buổi học này có ghi chú đặc biệt"
                  : "✨ Flag this lesson with a special note"}
              </Label>
            </div>

            {isSpecial && (
              <div className="border-special-fg/25 bg-special-bg/60 text-special-fg flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
                <Blossom size={14} className="shrink-0" />
                <span>
                  {language === "vi"
                    ? "Buổi này sẽ được đánh dấu có ghi chú đặc biệt trong bảng. Số tiền học phí vẫn tính theo mức giá thực tế của buổi học."
                    : "This lesson will be flagged in the table. The tuition total still reflects this lesson's actual rate, not this flag."}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                if (selectedLesson) {
                  handleClearLessonMetadata(selectedLesson.key);
                }
                setShowLessonDialog(false);
              }}
            >
              {language === "vi" ? "Xóa" : "Clear"}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowLessonDialog(false)}
              >
                {language === "vi" ? "Hủy" : "Cancel"}
              </Button>
              <Button onClick={handleSaveLesson}>
                {language === "vi" ? "Lưu" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
