import { api } from "@/trpc/server";
import { Blossom } from "@/components/blossom/blossom";
import { PracticeFeed } from "./_components/practice-feed";

export const metadata = {
  title: "Practice Feed",
  description: "Review home practice videos and leave feedback for your students.",
};

export default async function PracticePage() {
  const students = await api.student.getAll();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 pb-6 md:pb-10">
        {/* Practice Hero */}
        <div className="border-b border-pink-100 bg-white/60 px-4 py-6 md:px-6 md:py-8 backdrop-blur-xs">
          <div className="flex flex-col gap-1 max-w-3xl">
            <div className="flex items-center gap-2 text-pink-700 text-xs font-semibold uppercase tracking-wider">
              <Blossom size={14} className="text-bubblegum" />
              Student Practice Studio
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-normal text-ink">
              Practice Recordings &amp; Feedback
            </h1>
            <p className="text-xs md:text-sm text-ink-soft leading-relaxed">
              Listen to your students practicing at home, celebrate milestones, and
              leave helpful coaching notes that parents and students can read in their portal.
            </p>
          </div>
        </div>

        <div className="px-4 lg:px-6">
          <PracticeFeed
            students={students.map((s) => ({
              id: s.id,
              name: s.name,
              avatar: s.avatar,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
