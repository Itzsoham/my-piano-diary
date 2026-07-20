import { api } from "@/trpc/server";
import { ReportDetailPage } from "../_components/report-detail-page";
import { ReportDetailHero } from "../_components/report-detail-hero";

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
  const studentName =
    students.find((student) => student.id === studentId)?.name ?? "";

  return (
    <div className="flex flex-1 flex-col print:m-0 print:max-w-none print:p-0">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-8 pb-6 md:gap-10 md:pb-10 print:pb-0">
          <ReportDetailHero
            studentId={studentId}
            month={month}
            year={year}
            studentName={studentName}
          />

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
      </div>
    </div>
  );
}
