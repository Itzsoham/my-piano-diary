import { api } from "@/trpc/server";
import { StudentsHero } from "./_components/students-hero";
import { StudentsTabsView } from "./_components/students-tabs-view";

export const metadata = {
  title: "Students",
  description:
    "Your studio roster — rates, notes, families and lesson history.",
};

export default async function StudentsPage() {
  const students = await api.student.getAll({ includeInactive: true });
  const activeCount = students.filter((s) => s.isActive).length;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-6 pb-6 md:gap-8 md:pb-10">
          <StudentsHero count={activeCount} />

          <div className="px-4 lg:px-6">
            <StudentsTabsView students={students} />
          </div>
        </div>
      </div>
    </div>
  );
}
