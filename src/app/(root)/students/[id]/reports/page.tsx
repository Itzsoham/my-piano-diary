import { ReportView } from "./_components/report-view";

export default async function ReportPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const studentId = params.id;

  const now = new Date();
  const month = searchParams.month
    ? parseInt(searchParams.month)
    : now.getMonth() + 1;
  const year = searchParams.year
    ? parseInt(searchParams.year)
    : now.getFullYear();

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <ReportView studentId={studentId} month={month} year={year} />
    </div>
  );
}
