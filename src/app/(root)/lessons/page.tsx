import { startOfMonth, endOfMonth } from "date-fns";
import { api } from "@/trpc/server";
import { LessonsPage } from "./_components/lessons-page";

export default async function Lessons() {
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  const students = await api.student.getAll();
  const lessons = await api.lesson.getAll({ from, to });

  return (
    <div className="container mx-auto p-6">
      <LessonsPage
        students={students.map((student) => ({
          id: student.id,
          name: student.name,
        }))}
        initialLessons={lessons}
      />
    </div>
  );
}
