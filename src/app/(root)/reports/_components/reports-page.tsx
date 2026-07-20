"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { BirthdayBanner } from "@/components/birthday/birthday-banner";
import {
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties } from "react";
import { toast } from "sonner";

import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { AppLoader } from "@/components/ui/app-loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { RefreshOverlay } from "@/components/ui/refresh-overlay";
import { api, type RouterOutputs } from "@/trpc/react";
import { cn } from "@/lib/utils";
import { useFilterParams } from "@/lib/use-filter-params";

type Report = RouterOutputs["report"]["getAll"][number];

interface ReportsPageProps {
  students: { id: string; name: string }[];
  initialReports: Report[];
  initialMonth: number;
  initialYear: number;
}

// Shared "candy pill" trigger treatment for every filter Select on this
// screen. SelectTrigger's own height is set via a `data-[size=default]:h-9`
// CSS variant (not a plain utility), which outranks a plain `h-11` override
// on specificity alone — so the override has to target that same variant.
const selectTriggerClass =
  "h-11 w-full min-w-0 rounded-full border-pink-200 bg-card px-4 text-sm shadow-(--sh-xs) focus-visible:ring-pink-400 data-[size=default]:h-11";

const getYearOptions = (baseYear: number) =>
  Array.from({ length: 5 }, (_, index) => baseYear - 2 + index);

const buildReportHref = (studentId: string, month: number, year: number) =>
  `/reports/${studentId}?month=${month}&year=${year}`;

const getSummaryPreview = (report: Report) => {
  const preview = [report.summary, report.comments, report.nextMonthPlan].find(
    (value) => value && value.trim().length > 0,
  );

  if (!preview) {
    return "Report saved and ready to open.";
  }

  return preview.length > 96 ? `${preview.slice(0, 96)}...` : preview;
};

export function ReportsPage({
  students,
  initialReports,
  initialMonth,
  initialYear,
}: ReportsPageProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const { searchParams, setParams } = useFilterParams();
  const [deleteReport, setDeleteReport] = useState<Report | null>(null);
  const [selectedFamily, setSelectedFamily] = useState("");
  const { data: families = [] } = api.family.getAll.useQuery();

  // Filters live in the URL (shareable + SSR-consistent). Note: the reports
  // server page redirects `?studentId=` to the report editor, so the list's
  // student filter uses a distinct `student` key.
  const studentId = searchParams.get("student") ?? "all";
  const month = searchParams.get("month") ?? initialMonth.toString();
  const year = searchParams.get("year") ?? initialYear.toString();

  const setStudentId = (value: string) =>
    setParams({ student: value === "all" ? null : value });
  const setMonth = (value: string) => setParams({ month: value });
  const setYear = (value: string) => setParams({ year: value });

  const filters = useMemo(
    () => ({
      studentId: studentId === "all" ? undefined : studentId,
      month: Number.parseInt(month, 10),
      year: Number.parseInt(year, 10),
    }),
    [studentId, month, year],
  );

  const isDefaultFilters =
    studentId === "all" &&
    filters.month === initialMonth &&
    filters.year === initialYear;

  const {
    data: reports = [],
    isPending,
    isFetching,
  } = api.report.getAll.useQuery(filters, {
    initialData: isDefaultFilters ? initialReports : undefined,
    placeholderData: keepPreviousData,
  });

  const isLoading = isPending && reports.length === 0;
  // keepPreviousData means isPending stays false on a filter change, so the
  // list would silently swap. Surface the in-flight refetch instead.
  const isRefreshing = isFetching && !isLoading;
  const yearOptions = getYearOptions(initialYear);

  const columns: DataTableColumn<Report>[] = [
    {
      id: "student",
      header: "Student",
      headerClassName:
        "text-[11px] font-semibold tracking-[0.08em] text-pink-700 uppercase",
      cell: (report) => (
        <div className="flex items-center gap-3">
          <Avatar className="border-card size-9 shrink-0 border-2 shadow-(--sh-xs)">
            <AvatarImage src={report.student.avatar ?? ""} />
            <AvatarFallback className="text-mint-ink [background-image:var(--grad-brand)] text-xs font-bold">
              {report.student.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-ink font-medium">{report.student.name}</div>
        </div>
      ),
    },
    {
      id: "month",
      header: "Month",
      headerClassName:
        "text-[11px] font-semibold tracking-[0.08em] text-pink-700 uppercase",
      cell: (report) => (
        <Badge className="rounded-full bg-pink-100 px-3 py-1 font-semibold text-pink-700 tabular-nums hover:bg-pink-100">
          {report.month}/{report.year}
        </Badge>
      ),
    },
    {
      id: "preview",
      header: "Preview",
      headerClassName:
        "text-[11px] font-semibold tracking-[0.08em] text-pink-700 uppercase",
      cell: (report) => getSummaryPreview(report),
      cellClassName: "max-w-md text-sm whitespace-normal text-ink-soft",
    },
    {
      id: "updated",
      header: "Updated",
      headerClassName:
        "text-[11px] font-semibold tracking-[0.08em] text-pink-700 uppercase",
      cell: (report) => format(new Date(report.updatedAt), "MMM d, yyyy"),
      cellClassName: "text-sm tabular-nums text-ink-soft",
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName:
        "text-right text-[11px] font-semibold tracking-[0.08em] text-pink-700 uppercase",
      cellClassName: "text-right",
      cell: (report) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="text-ink-soft size-9 rounded-full p-0 hover:bg-pink-50 hover:text-pink-700"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="rounded-xl border-pink-100 shadow-(--sh-lg)"
          >
            <DropdownMenuItem
              onSelect={() =>
                router.push(
                  buildReportHref(report.studentId, report.month, report.year),
                )
              }
              className="rounded-lg focus:bg-pink-50"
            >
              <Eye className="mr-2 h-4 w-4" />
              View report
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                router.push(
                  buildReportHref(report.studentId, report.month, report.year),
                )
              }
              className="rounded-lg focus:bg-pink-50"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit report
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteReport(report)}
              className="rounded-lg"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const deleteMutation = api.report.delete.useMutation({
    onMutate: async (input) => {
      await utils.report.getAll.cancel(filters);

      const previousReports = utils.report.getAll.getData(filters);

      toast.success("Report deleted", { id: "report-delete" });
      setDeleteReport(null);

      utils.report.getAll.setData(filters, (current) =>
        current
          ? current.filter(
              (report) =>
                !(
                  report.studentId === input.studentId &&
                  report.month === input.month &&
                  report.year === input.year
                ),
            )
          : current,
      );

      return { previousReports };
    },
    onError: (error, _input, context) => {
      toast.error(error.message ?? "Failed to delete report", {
        id: "report-delete",
      });

      if (context?.previousReports) {
        utils.report.getAll.setData(filters, context.previousReports);
      }
    },
    onSettled: async (_data, _error, input) => {
      await utils.report.getAll.invalidate();
      await utils.report.getStudentReport.invalidate({
        studentId: input.studentId,
        month: input.month,
        year: input.year,
      });
    },
  });

  const resetFilters = () =>
    setParams({ student: null, month: null, year: null });

  const selectedStudentName =
    studentId === "all"
      ? ""
      : (students.find((student) => student.id === studentId)?.name ?? "");

  return (
    <>
      {/* reports/page.tsx already supplies the flex-1 flex-col > gap-8 shell
          and wraps this whole component in one "px-4 lg:px-6", as a sibling
          of <ReportsHero>. This is a leaf: its own two blocks share their own
          internal rhythm, not another page-level padding pass. */}
      <div className="flex flex-col gap-8 md:gap-10 print:hidden">
        {/* ── Filters + actions ────────────────────────────────────────── */}
        <section>
          <BirthdayBanner
            text="You're building something beautiful ✨"
            icon="✨"
            storageKey="reports"
          />

          <div
            className="relative overflow-hidden rounded-3xl border border-pink-100 p-4 shadow-(--sh) sm:p-6"
            style={{
              background:
                "linear-gradient(165deg, var(--pink-50), var(--surface) 55%)",
            }}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-[0.08em] text-pink-700 uppercase">
                  Student
                </label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="All students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All students</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-[0.08em] text-pink-700 uppercase">
                  Month
                </label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, index) => index + 1).map(
                      (value) => (
                        <SelectItem key={value} value={value.toString()}>
                          Month {value}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-[0.08em] text-pink-700 uppercase">
                  Year
                </label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((value) => (
                      <SelectItem key={value} value={value.toString()}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                onClick={resetFilters}
                className="bday-animate-button h-11 w-full rounded-full border-pink-200 text-pink-700 hover:bg-pink-100"
              >
                Reset
              </Button>
            </div>

            {/* ── Action tiles ──────────────────────────────────────────── */}
            {/* xl (1280px), not lg (1024px): each tile already switches to a
                horizontal sm:flex-row layout at 640px, so going 2-up any
                earlier than xl leaves ~1024px tablet-landscape widths with
                no room for both the tile's own row layout AND a second
                column — the description text collapses to ~1 word/line. */}
            <div className="mt-5 grid grid-cols-1 gap-4 border-t border-dashed border-pink-200 pt-5 xl:grid-cols-2">
              {/* Generate Monthly Report */}
              <div
                className="rise relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-pink-200/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                style={
                  {
                    "--i": 0,
                    background:
                      "linear-gradient(160deg, var(--pink-100), var(--surface) 72%)",
                  } as CSSProperties
                }
              >
                <Blossom
                  size={56}
                  className="text-bubblegum absolute -top-3 -right-3 z-0 opacity-50"
                />
                <div className="relative z-10 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-card grid size-9 shrink-0 place-items-center rounded-full text-pink-600 shadow-(--sh-xs)">
                      <FileText className="size-4" aria-hidden="true" />
                    </span>
                    <span className="text-ink text-[15px] font-semibold">
                      Generate Monthly Report
                    </span>
                  </div>
                  <p className="text-ink-soft mt-1.5 text-sm">
                    Open the report editor for the selected student and month.
                  </p>
                </div>
                <div className="relative z-10 flex flex-col items-stretch gap-1.5 sm:shrink-0 sm:items-end">
                  <Button
                    disabled={studentId === "all"}
                    onClick={() => {
                      if (studentId === "all") {
                        return;
                      }

                      router.push(
                        buildReportHref(studentId, filters.month, filters.year),
                      );
                    }}
                    className="bday-animate-button h-11 min-w-44 rounded-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                  <p className="text-ink-soft text-xs">
                    {studentId === "all"
                      ? "Choose a student to create or update a monthly report."
                      : `Open ${selectedStudentName} for ${filters.month}/${filters.year}.`}
                  </p>
                </div>
              </div>

              {/* Combined Family Report */}
              <div
                className="rise relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-teal-200/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                style={
                  {
                    "--i": 1,
                    background:
                      "linear-gradient(160deg, var(--teal-100), var(--surface) 72%)",
                  } as CSSProperties
                }
              >
                <Blossom
                  size={56}
                  className="text-wintergreen absolute -top-3 -right-3 z-0 opacity-40"
                />
                <div className="relative z-10 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-card grid size-9 shrink-0 place-items-center rounded-full text-teal-700 shadow-(--sh-xs)">
                      <Users className="size-4" aria-hidden="true" />
                    </span>
                    <span className="text-ink text-[15px] font-semibold">
                      Combined Family Report
                    </span>
                  </div>
                  <p className="text-ink-soft mt-1.5 text-sm">
                    Merge siblings or a parent + child onto one sheet for{" "}
                    {filters.month}/{filters.year}.
                  </p>
                </div>
                <div className="relative z-10 flex flex-col items-stretch gap-2 sm:shrink-0 sm:flex-row sm:items-center">
                  {families.length === 0 ? (
                    <p className="text-ink-soft text-xs sm:max-w-44">
                      No families yet — create one on the{" "}
                      <Link
                        href="/students"
                        className="font-semibold text-teal-700 underline underline-offset-2"
                      >
                        Students
                      </Link>{" "}
                      page.
                    </p>
                  ) : (
                    <>
                      <Select
                        value={selectedFamily}
                        onValueChange={setSelectedFamily}
                      >
                        <SelectTrigger
                          className={cn(
                            selectTriggerClass,
                            "min-w-48 border-teal-200 focus-visible:ring-teal-400",
                          )}
                        >
                          <SelectValue placeholder="Select a family" />
                        </SelectTrigger>
                        <SelectContent>
                          {families.map((family) => (
                            <SelectItem key={family.id} value={family.id}>
                              {family.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        disabled={!selectedFamily}
                        onClick={() => {
                          if (!selectedFamily) return;
                          router.push(
                            `/reports/family/${selectedFamily}?month=${filters.month}&year=${filters.year}`,
                          );
                        }}
                        className="text-mint-ink hover:text-mint-ink h-11 min-w-44 rounded-full [background-image:var(--grad-mint)] shadow-(--sh-mint) hover:brightness-95"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Open family report
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Existing reports ─────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-ink flex items-center gap-2 font-serif text-xl font-normal sm:text-2xl">
                <Blossom size={17} className="text-bubblegum" />
                Existing Reports
              </h2>
              <p className="text-ink-soft mt-1 text-sm">
                Open, update, or remove reports already saved for this month
                filter.
              </p>
            </div>
            <Badge className="rounded-full bg-pink-100 px-3 py-1 font-semibold text-pink-700 tabular-nums hover:bg-pink-100">
              {reports.length} report{reports.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="relative">
            <RefreshOverlay active={isRefreshing} />
            <div
              className={cn(
                "transition-opacity",
                isRefreshing && "pointer-events-none opacity-60",
              )}
            >
              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <AppLoader size="sm" />
                </div>
              ) : reports.length === 0 ? (
                <div className="bg-card/60 flex flex-col items-center justify-center rounded-3xl border border-dashed border-pink-200 px-6 py-14 text-center">
                  <Mochi mood="sleepy" bob size={112} />
                  <div className="text-ink mt-4 text-lg font-medium">
                    No reports saved for this month yet
                  </div>
                  <div className="text-ink-soft mt-1 max-w-sm text-sm">
                    Generate a report above or adjust the filters to browse past
                    months.
                  </div>
                </div>
              ) : (
                <>
                  <DataTable
                    className="hidden md:block"
                    columns={columns}
                    data={reports}
                    getRowKey={(report) => report.id}
                    viewportClassName="rounded-3xl border-pink-100 shadow-(--sh)"
                    headerClassName="bg-pink-50/70"
                    itemRowClassName="transition-colors hover:bg-pink-50/70"
                  />

                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {reports.map((report, index) => (
                      <div
                        key={report.id}
                        className="rise bg-card rounded-3xl border border-pink-100 p-4 shadow-(--sh-sm)"
                        style={{ "--i": index } as CSSProperties}
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="border-card size-10 shrink-0 border-2 shadow-(--sh-xs)">
                              <AvatarImage src={report.student.avatar ?? ""} />
                              <AvatarFallback className="text-mint-ink [background-image:var(--grad-brand)] text-xs font-bold">
                                {report.student.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-ink font-semibold">
                                {report.student.name}
                              </div>
                              <div className="text-ink-soft text-xs">
                                Updated{" "}
                                {format(
                                  new Date(report.updatedAt),
                                  "MMM d, yyyy",
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge className="rounded-full bg-pink-100 px-3 py-1 font-semibold text-pink-700 tabular-nums hover:bg-pink-100">
                            {report.month}/{report.year}
                          </Badge>
                        </div>

                        <p className="text-ink-soft text-sm leading-6">
                          {getSummaryPreview(report)}
                        </p>

                        <div className="mt-4 flex gap-3">
                          <Button
                            onClick={() =>
                              router.push(
                                buildReportHref(
                                  report.studentId,
                                  report.month,
                                  report.year,
                                ),
                              )
                            }
                            className="h-11 flex-1 rounded-full"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View / Edit
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                className="size-11 rounded-full border-pink-200 text-pink-600 hover:bg-pink-50"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="rounded-xl border-pink-100 shadow-(--sh-lg)"
                            >
                              <DropdownMenuItem
                                onSelect={() =>
                                  router.push(
                                    buildReportHref(
                                      report.studentId,
                                      report.month,
                                      report.year,
                                    ),
                                  )
                                }
                                className="rounded-lg focus:bg-pink-50"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View report
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  router.push(
                                    buildReportHref(
                                      report.studentId,
                                      report.month,
                                      report.year,
                                    ),
                                  )
                                }
                                className="rounded-lg focus:bg-pink-50"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit report
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleteReport(report)}
                                className="rounded-lg"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={!!deleteReport}
        onOpenChange={(open) => !open && setDeleteReport(null)}
        title="Delete report"
        description={`Are you sure you want to delete the ${deleteReport?.month}/${deleteReport?.year} report for ${deleteReport?.student.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteReport) {
            return;
          }

          deleteMutation.mutate({
            studentId: deleteReport.studentId,
            month: deleteReport.month,
            year: deleteReport.year,
          });
        }}
      />
    </>
  );
}
