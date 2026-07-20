import { startOfDay, endOfDay } from "date-fns";
import { api } from "@/trpc/server";
import { LessonsHero } from "./_components/lessons-hero";
import { LessonsPage } from "./_components/lessons-page";

export default async function Lessons() {
  const now = new Date();
  const from = startOfDay(now);
  const to = endOfDay(now);

  const students = await api.student.getAll();
  const lessons = await api.lesson.getAll({ from, to });

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-8 pb-6 md:gap-10 md:pb-10">
        <LessonsHero />

        <LessonsPage
          students={students.map((student) => ({
            id: student.id,
            name: student.name,
          }))}
          initialLessons={lessons}
        />
      </div>
    </div>
  );
}
