import { SectionCards } from "@/app/(root)/dashboard/_components/section-cards";
import { DashboardHero } from "@/app/(root)/dashboard/_components/dashboard-hero";
import { DashboardIntelligencePanel } from "@/app/(root)/dashboard/_components/dashboard-intelligence-panel";
import { DashboardMonthBar } from "@/app/(root)/dashboard/_components/dashboard-month-bar";
import { DashboardMonthProvider } from "@/app/(root)/dashboard/_components/dashboard-month-provider";
import { getCurrentMonthScope } from "@/server/current-month";
import { parseMonthScopeParams } from "@/lib/month-scope";
// import { BirthdayCountdownCard } from "./_components/birthday-countdown-card";

export const metadata = {
  title: "Dashboard",
  description:
    "Today at a glance: who is coming, what is expected, and what is still owed.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Resolved in the teacher's timezone so this default is the same month the
  // month-scoped procedures call "current"; the `?month=&year=` query string
  // overrides it from there.
  const currentMonth = await getCurrentMonthScope();

  // Read the initial scope from the URL on the server so the provider can
  // seed the correct month without needing useSearchParams() on the client.
  // This also eliminates the Suspense boundary that was previously required.
  const params = await searchParams;
  const monthStr = Array.isArray(params.month) ? params.month[0] : params.month;
  const yearStr = Array.isArray(params.year) ? params.year[0] : params.year;
  const initialScope =
    parseMonthScopeParams(monthStr, yearStr) ?? currentMonth;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-8 pb-6 md:gap-10 md:pb-10">
          {/* <div className="flex justify-center px-4 lg:px-6">
            <BirthdayCountdownCard />
          </div> */}

          <DashboardHero />

          <DashboardMonthProvider
            defaultMonth={currentMonth.month}
            defaultYear={currentMonth.year}
            initialMonth={initialScope.month}
            initialYear={initialScope.year}
          >
            <div className="flex flex-col gap-8 md:gap-10">
              <DashboardMonthBar />

              <SectionCards />

              <DashboardIntelligencePanel />
            </div>
          </DashboardMonthProvider>
        </div>
      </div>
    </div>
  );
}
