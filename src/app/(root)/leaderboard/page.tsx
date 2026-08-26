import { api } from "@/trpc/server";
import { formatMonthScope, parseMonthScopeParams } from "@/lib/month-scope";
import { getCurrentMonthScope } from "@/server/current-month";
import { LeaderboardHero } from "./_components/leaderboard-hero";
import { LeaderboardPage } from "./_components/leaderboard-page";

export const metadata = {
  title: "Ranking",
  description:
    "Student ranking by average blossom score — all time or month by month, with genuine ties sharing a rank.",
};

type LeaderboardProps = {
  searchParams: Promise<{ month?: string; year?: string }>;
};

export default async function Leaderboard(props: LeaderboardProps) {
  const searchParams = await props.searchParams;

  // A month in the URL scopes the whole board; anything malformed falls back to
  // the all-time view rather than erroring on a hand-edited link.
  const scope = parseMonthScopeParams(searchParams.month, searchParams.year);
  const [data, currentMonth] = await Promise.all([
    api.earnings.getStudentLeaderboard(scope ?? undefined),
    // Teacher's timezone, not the host's — otherwise the "this month" badge
    // can land on a different row than the month the router treats as current.
    getCurrentMonthScope(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-5 pb-6 md:gap-6 md:pb-10">
        <LeaderboardHero
          rankedStudents={data.summary.rankedStudents}
          ratedLessons={data.summary.ratedLessons}
          studioAverage={data.summary.studioAverage}
          scopeLabel={scope ? formatMonthScope(scope) : null}
        />
        <div className="px-4 lg:px-6">
          {/* The server fetch above seeds the client query for this scope so
              the board is painted on first byte, then stays live through
              tRPC's cache when a lesson gets rated elsewhere in the app. */}
          <LeaderboardPage
            initialData={data}
            initialScope={scope}
            currentMonth={currentMonth}
          />
        </div>
      </div>
    </div>
  );
}
