"use client";

import { useRouter } from "next/navigation";

import { ReportView } from "../../students/[id]/reports/_components/report-view";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReportDetailPageProps {
  studentId: string;
  month: number;
  year: number;
  students: { id: string; name: string }[];
}

export function ReportDetailPage({
  studentId,
  month,
  year,
  students,
}: ReportDetailPageProps) {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6 print:px-0">
      {/* The page's one h1 lives in ReportDetailHero (a sibling above this
          component, rendered by reports/[studentId]/page.tsx) — this stays a
          plain body wrapper around the control bar + printable paper. */}
      <ReportView
        studentId={studentId}
        month={month}
        year={year}
        reportBasePath={`/reports/${studentId}`}
        studentControl={
          <div className="min-w-50">
            <Label className="sr-only">Student</Label>
            <Select
              value={studentId}
              onValueChange={(value) =>
                router.push(`/reports/${value}?month=${month}&year=${year}`)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}
