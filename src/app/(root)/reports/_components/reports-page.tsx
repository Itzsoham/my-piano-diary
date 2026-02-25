"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportView } from "../../students/[id]/reports/_components/report-view";

interface ReportsPageProps {
  students: { id: string; name: string }[];
  initialStudentId?: string;
}

const getMonthYear = (searchParams: URLSearchParams) => {
  const now = new Date();
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  return {
    month: month ? parseInt(month) : now.getMonth() + 1,
    year: year ? parseInt(year) : now.getFullYear(),
  };
};

export function ReportsPage({ students, initialStudentId }: ReportsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedStudentId, setSelectedStudentId] = useState(
    initialStudentId ?? "",
  );
  const [isLoaded, setIsLoaded] = useState(false);

  const STORAGE_KEY = "reports-student-id";

  // Load from sessionStorage on mount if not in URL
  useEffect(() => {
    const urlStudentId = searchParams.get("studentId");
    if (!urlStudentId) {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSelectedStudentId(saved);
        // Also update URL to match saved state if we want it to be fully persistent
        const query = new URLSearchParams(searchParams.toString());
        query.set("studentId", saved);
        // We don't have month/year here easily without duplicating logic,
        // but ReportView will handle defaults if missing
        router.replace(`?${query.toString()}`);
      }
    }
    setIsLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to sessionStorage when it changes
  useEffect(() => {
    if (isLoaded && selectedStudentId) {
      sessionStorage.setItem(STORAGE_KEY, selectedStudentId);
    }
  }, [selectedStudentId, isLoaded]);

  useEffect(() => {
    const urlStudentId = searchParams.get("studentId");
    if (urlStudentId) {
      setSelectedStudentId(urlStudentId);
    }
  }, [searchParams]);

  const { month, year } = useMemo(
    () => getMonthYear(searchParams),
    [searchParams],
  );

  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
  };

  const handleGenerateReport = () => {
    if (!selectedStudentId) return;
    const query = new URLSearchParams(searchParams.toString());
    query.set("studentId", selectedStudentId);
    query.set("month", month.toString());
    query.set("year", year.toString());
    router.push(`?${query.toString()}`);
  };

  const studentOptions = students.map((student) => (
    <SelectItem key={student.id} value={student.id}>
      {student.name}
    </SelectItem>
  ));

  const studentControl = (
    <div className="min-w-50">
      <Label className="sr-only">Student</Label>
      <Select value={selectedStudentId} onValueChange={handleStudentChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select student" />
        </SelectTrigger>
        <SelectContent>{studentOptions}</SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Reports
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:mt-2 sm:text-base">
          Select a student to view their monthly report
        </p>
      </div>

      {selectedStudentId ? (
        <ReportView
          studentId={selectedStudentId}
          month={month}
          year={year}
          includeStudentIdInQuery
          studentControl={studentControl}
        />
      ) : (
        <div className="mt-4 w-full space-y-6">
          <div className="space-y-4 rounded-xl border border-pink-100 bg-white/60 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                <FileText className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  Generate Monthly Report
                </h2>
                <p className="text-muted-foreground text-sm">
                  Select a student to view their monthly report
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Student</Label>
                <Select
                  value={selectedStudentId}
                  onValueChange={handleStudentChange}
                >
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>{studentOptions}</SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  disabled={!selectedStudentId}
                  onClick={handleGenerateReport}
                >
                  Generate Report
                </Button>
                <p className="text-muted-foreground text-xs">
                  Includes lessons, cancellations and earnings
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
