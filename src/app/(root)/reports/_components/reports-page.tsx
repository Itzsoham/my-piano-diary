"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type RouterOutputs } from "@/trpc/react";

const STORAGE_KEY = "reports-filters";

type Report = RouterOutputs["report"]["getAll"][number];

interface ReportsPageProps {
  students: { id: string; name: string }[];
  initialReports: Report[];
  initialMonth: number;
  initialYear: number;
}

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
  const [studentId, setStudentId] = useState("all");
  const [month, setMonth] = useState(initialMonth.toString());
  const [year, setYear] = useState(initialYear.toString());
  const [isLoaded, setIsLoaded] = useState(false);
  const [deleteReport, setDeleteReport] = useState<Report | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          studentId?: string;
          month?: string;
          year?: string;
        };

        if (parsed.studentId) {
          setStudentId(parsed.studentId);
        }
        if (parsed.month) {
          setMonth(parsed.month);
        }
        if (parsed.year) {
          setYear(parsed.year);
        }
      } catch (error) {
        console.error("Failed to parse saved reports filters", error);
      }
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        studentId,
        month,
        year,
      }),
    );
  }, [studentId, month, year, isLoaded]);

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

  const { data: reports = [], isPending } = api.report.getAll.useQuery(
    filters,
    {
      initialData: isDefaultFilters ? initialReports : undefined,
      placeholderData: keepPreviousData,
    },
  );

  const isLoading = isPending && reports.length === 0;
  const yearOptions = getYearOptions(initialYear);

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

  const resetFilters = () => {
    setStudentId("all");
    setMonth(initialMonth.toString());
    setYear(initialYear.toString());
  };

  const selectedStudentName =
    studentId === "all"
      ? ""
      : (students.find((student) => student.id === studentId)?.name ?? "");

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          Monthly Reports
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate a new report or manage archived reports for any student.
        </p>
      </div>

      <div className="rounded-2xl border border-pink-100 bg-white/80 p-3 shadow-sm md:p-6">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4 md:items-end md:gap-3">
          <div className="space-y-1 md:space-y-1.5">
            <label className="text-xs font-medium text-pink-700">Student</label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="h-11 w-full border-pink-200 bg-pink-50 text-sm focus:ring-pink-400 md:h-10">
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

          <div className="space-y-1 md:space-y-1.5">
            <label className="text-xs font-medium text-pink-700">Month</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-11 w-full border-pink-200 bg-pink-50 text-sm focus:ring-pink-400 md:h-10">
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

          <div className="space-y-1 md:space-y-1.5">
            <label className="text-xs font-medium text-pink-700">Year</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-11 w-full border-pink-200 bg-pink-50 text-sm focus:ring-pink-400 md:h-10">
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
            className="h-11 w-full rounded-xl border-pink-200 text-pink-600 hover:bg-pink-100 md:h-10"
          >
            Reset
          </Button>
        </div>

        <div className="mt-4 rounded-2xl border border-pink-100 bg-linear-to-r from-rose-50 to-pink-50 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-base font-semibold text-pink-900">
                <FileText className="h-4 w-4" />
                Generate Monthly Report
              </div>
              <p className="mt-1 text-sm text-pink-700/80">
                Open the report editor for the selected student and month.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-2 md:items-end">
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
                className="min-w-44"
              >
                <Plus className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              <p className="text-xs text-pink-700/70">
                {studentId === "all"
                  ? "Choose a student to create or update a monthly report."
                  : `Open ${selectedStudentName} for ${filters.month}/${filters.year}.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t pt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-pink-900">
              Existing Reports
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Open, update, or remove reports already saved for this month
              filter.
            </p>
          </div>
          <Badge className="rounded-full bg-pink-100 px-3 py-1 text-pink-700 hover:bg-pink-100">
            {reports.length} report{reports.length === 1 ? "" : "s"}
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <AppLoader size="sm" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 text-4xl">🎼</div>
            <div className="text-lg font-medium text-pink-700">
              No reports saved for this month yet
            </div>
            <div className="mt-1 text-sm text-pink-600/70">
              Generate a report above or adjust the filters to browse past
              months.
            </div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-2xl border border-pink-100 bg-white shadow-md md:block">
              <Table>
                <TableHeader className="bg-rose-50/60">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Student</TableHead>
                    <TableHead className="whitespace-nowrap">Month</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead className="whitespace-nowrap">Updated</TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow
                      key={report.id}
                      className="transition-colors hover:bg-pink-50"
                    >
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8 border border-pink-100">
                            <AvatarImage src={report.student.avatar ?? ""} />
                            <AvatarFallback className="bg-pink-50 text-xs font-bold text-pink-600">
                              {report.student.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">
                            {report.student.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className="rounded-full bg-rose-100 px-3 py-1 text-rose-700 hover:bg-rose-100">
                          {report.month}/{report.year}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md text-sm text-gray-600">
                        {getSummaryPreview(report)}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap text-gray-600">
                        {format(new Date(report.updatedAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-xl border-pink-100 bg-white shadow-lg"
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
                              className="rounded-lg hover:bg-pink-50"
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
                              className="rounded-lg hover:bg-pink-50"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit report
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setDeleteReport(report)}
                              className="rounded-lg text-rose-500 hover:bg-rose-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border border-pink-100">
                        <AvatarImage src={report.student.avatar ?? ""} />
                        <AvatarFallback className="bg-pink-50 text-xs font-bold text-pink-600">
                          {report.student.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {report.student.name}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Updated{" "}
                          {format(new Date(report.updatedAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                    <Badge className="rounded-full bg-rose-100 px-3 py-1 text-rose-700 hover:bg-rose-100">
                      {report.month}/{report.year}
                    </Badge>
                  </div>

                  <p className="text-sm leading-6 text-gray-600">
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
                      className="flex-1 rounded-xl bg-pink-500 text-white hover:bg-pink-600"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View / Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="size-10 rounded-xl border border-pink-100 text-pink-600 hover:bg-pink-50"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="rounded-xl border-pink-100 bg-white shadow-lg"
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
                          className="rounded-lg hover:bg-pink-50"
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
                          className="rounded-lg hover:bg-pink-50"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit report
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteReport(report)}
                          className="rounded-lg text-rose-500 hover:bg-rose-50"
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
    </div>
  );
}
