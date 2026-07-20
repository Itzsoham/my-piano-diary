import { CombinedReportView } from "./_components/combined-report-view";

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

type CombinedReportProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
};

export default async function CombinedReportPage(props: CombinedReportProps) {
  const [{ familyId }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const { month, year } = getSafeMonthYear(searchParams);

  return (
    <div className="flex flex-1 flex-col print:m-0 print:max-w-none print:p-0">
      <div className="flex flex-col gap-8 pb-6 md:gap-10 md:pb-10 print:gap-0 print:pb-0">
        <CombinedReportView familyId={familyId} month={month} year={year} />
      </div>
    </div>
  );
}
