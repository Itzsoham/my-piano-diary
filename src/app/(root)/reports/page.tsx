import { api } from "@/trpc/server";
import { ReportsPage } from "./_components/reports-page";

export default async function Reports(props: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const students = await api.student.getAll();
  const searchParams = await props.searchParams;

  return (
    <div className="container mx-auto p-6 print:m-0 print:max-w-none print:p-0">
      <ReportsPage
        students={students.map((student) => ({
          id: student.id,
          name: student.name,
        }))}
        initialStudentId={searchParams.studentId}
      />
    </div>
  );
}
