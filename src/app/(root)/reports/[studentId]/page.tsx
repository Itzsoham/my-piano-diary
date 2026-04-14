import { api } from "@/trpc/server";
import { ReportDetailPage } from "../_components/report-detail-page";

type ReportDetailProps = {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
};

const getSafeMonthYear = (searchParams: { month?: string; year?: string }) => {
  const now = new Date();
  const month = Number.parseInt(searchParams.month ?? "", 10);
  const year = Number.parseInt(searchParams.year ?? "", 10);

  return {
    month:
      Number.isInteger(month) && month >= 1 && month <= 12
        ? month
        : now.getMonth() + 1,
    year:
      Number.isInteger(year) && year >= 2000 && year <= 2100
        ? year
        : now.getFullYear(),
  };
};

export default async function ReportDetail(props: ReportDetailProps) {
  const [{ studentId }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const students = await api.student.getAll();
  const { month, year } = getSafeMonthYear(searchParams);

  return (
    <div className="container mx-auto p-6 print:m-0 print:max-w-none print:p-0">
      <ReportDetailPage
        studentId={studentId}
        month={month}
        year={year}
        students={students.map((student) => ({
          id: student.id,
          name: student.name,
        }))}
      />
    </div>
  );
}
