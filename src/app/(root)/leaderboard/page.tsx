import { api } from "@/trpc/server";
import { LeaderboardHero } from "./_components/leaderboard-hero";
import { LeaderboardPage } from "./_components/leaderboard-page";

export default async function Leaderboard() {
  const data = await api.earnings.getStudentLeaderboard();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-5 pb-6 md:gap-6 md:pb-10">
        <LeaderboardHero
          rankedStudents={data.summary.rankedStudents}
          ratedLessons={data.summary.ratedLessons}
          studioAverage={data.summary.studioAverage}
        />
        <div className="px-4 lg:px-6">
          {/* The server fetch above seeds the client query so the board is
              painted on first byte, then stays live through tRPC's cache when
              a lesson gets rated elsewhere in the app. */}
          <LeaderboardPage initialData={data} />
        </div>
      </div>
    </div>
  );
}
