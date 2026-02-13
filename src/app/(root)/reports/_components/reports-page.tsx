"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
    const query = new URLSearchParams(searchParams.toString());
    query.set("studentId", value);
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
      <div>
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
        <div className="text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-sm sm:p-10">
          Choose a student to load the report.
          <div className="mt-3 flex justify-center sm:mt-4">
            {studentControl}
          </div>
        </div>
      )}
    </div>
  );
}
