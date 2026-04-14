import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { ReportsPage } from "./_components/reports-page";

export default async function Reports(props: {
  searchParams: Promise<{ studentId?: string; month?: string; year?: string }>;
}) {
  const searchParams = await props.searchParams;
  const now = new Date();
  const month = Number.parseInt(searchParams.month ?? "", 10);
  const year = Number.parseInt(searchParams.year ?? "", 10);
  const safeMonth =
    Number.isInteger(month) && month >= 1 && month <= 12
      ? month
      : now.getMonth() + 1;
  const safeYear =
    Number.isInteger(year) && year >= 2000 && year <= 2100
      ? year
      : now.getFullYear();

  if (searchParams.studentId) {
    redirect(
      `/reports/${searchParams.studentId}?month=${safeMonth}&year=${safeYear}`,
    );
  }

  const students = await api.student.getAll();
  const initialReports = await api.report.getAll({
    month: safeMonth,
    year: safeYear,
  });

  return (
    <div className="container mx-auto p-6 print:m-0 print:max-w-none print:p-0">
      <ReportsPage
        students={students.map((student) => ({
          id: student.id,
          name: student.name,
        }))}
        initialReports={initialReports}
        initialMonth={safeMonth}
        initialYear={safeYear}
      />
    </div>
  );
}
