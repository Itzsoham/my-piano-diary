import { Suspense } from "react";

import { SectionCards } from "@/app/(root)/dashboard/_components/section-cards";
import { DashboardHero } from "@/app/(root)/dashboard/_components/dashboard-hero";
import { DashboardIntelligencePanel } from "@/app/(root)/dashboard/_components/dashboard-intelligence-panel";
import { DashboardMonthBar } from "@/app/(root)/dashboard/_components/dashboard-month-bar";
import { DashboardMonthProvider } from "@/app/(root)/dashboard/_components/dashboard-month-provider";
import { getCurrentMonthScope } from "@/server/current-month";
// import { BirthdayCountdownCard } from "./_components/birthday-countdown-card";

export const metadata = {
  title: "Dashboard",
  description:
    "Today at a glance: who is coming, what is expected, and what is still owed.",
};

export default async function Page() {
  // Resolved in the teacher's timezone so this default is the same month the
  // month-scoped procedures call "current"; the `?month=&year=` query string
  // overrides it from there.
  const currentMonth = await getCurrentMonthScope();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-8 pb-6 md:gap-10 md:pb-10">
          {/* <div className="flex justify-center px-4 lg:px-6">
            <BirthdayCountdownCard />
          </div> */}

          <DashboardHero />

          {/*
            Suspense is required here because DashboardMonthProvider calls
            useSearchParams() (via useFilterParams). Without this boundary,
            Next.js has no streaming checkpoint and freezes the entire page
            on every router.replace() call triggered by the month dropdown.
          */}
          <Suspense>
            <DashboardMonthProvider
              defaultMonth={currentMonth.month}
              defaultYear={currentMonth.year}
            >
              <div className="flex flex-col gap-8 md:gap-10">
                <DashboardMonthBar />

                <SectionCards />

                <DashboardIntelligencePanel />
              </div>
            </DashboardMonthProvider>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
