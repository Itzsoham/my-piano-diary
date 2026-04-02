import { SectionCards } from "@/app/(root)/dashboard/_components/section-cards";
import { TodayLessonsTable } from "@/app/(root)/dashboard/_components/today-lessons-table";
import { BirthdayCountdownCard } from "@/app/(root)/dashboard/_components/birthday-countdown-card";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex justify-center px-4 lg:px-6">
            <BirthdayCountdownCard />
          </div>
          <SectionCards />
          <div className="px-4 lg:px-6">
            <TodayLessonsTable />
          </div>
        </div>
      </div>
    </div>
  );
}
