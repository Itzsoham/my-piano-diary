import { SectionCards } from "@/app/(root)/dashboard/_components/section-cards";
import { DashboardIntelligencePanel } from "@/app/(root)/dashboard/_components/dashboard-intelligence-panel";
import { BirthdayCountdownCard } from "./_components/birthday-countdown-card";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-8 py-6 md:gap-10 md:py-10">
          <div className="flex justify-center px-4 lg:px-6">
            <BirthdayCountdownCard />
          </div>

          <SectionCards />

          <DashboardIntelligencePanel />
        </div>
      </div>
    </div>
  );
}
