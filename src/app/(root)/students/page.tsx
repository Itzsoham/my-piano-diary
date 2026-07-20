import { api } from "@/trpc/server";
import { StudentsHero } from "./_components/students-hero";
import { StudentsTable } from "./_components/students-table";
import { FamiliesManager } from "./_components/families-manager";

export default async function StudentsPage() {
  const students = await api.student.getAll();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-8 pb-6 md:gap-10 md:pb-10">
          <StudentsHero count={students.length} />

          <div className="px-4 lg:px-6">
            <StudentsTable data={students} />
          </div>

          <div className="px-4 lg:px-6">
            <FamiliesManager
              students={students.map((student) => ({
                id: student.id,
                name: student.name,
                avatar: student.avatar,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
