import { api } from "@/trpc/server";
import { ReportsPage } from "./_components/reports-page";

export default async function Reports() {
  const students = await api.student.getAll();

  return (
    <div className="container mx-auto p-6">
      <ReportsPage
        students={students.map((student) => ({
          id: student.id,
          name: student.name,
        }))}
      />
    </div>
  );
}
