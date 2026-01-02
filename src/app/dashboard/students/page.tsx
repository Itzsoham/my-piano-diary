import { api } from "@/trpc/server";
import { StudentsTable } from "./_components/students-table";

export default async function StudentsPage() {
  const students = await api.student.getAll();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground mt-2">
          Manage your students and track their progress
        </p>
      </div>
      <StudentsTable data={students} />
    </div>
  );
}
