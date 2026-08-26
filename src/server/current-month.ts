import "server-only";

import type { MonthScope } from "@/lib/month-scope";
import { fromUTC } from "@/lib/timezone";
import { getServerAuthSession } from "@/server/auth";

/**
 * "This month" as the *teacher* sees it, for server components that need a
 * default month before any query runs.
 *
 * Reading `new Date()` on the server would answer in the host's timezone
 * instead, and every month-scoped procedure resolves its own default from
 * `session.user.timezone`. Across a month boundary those two disagree: the
 * page would default to a month the router then reports as
 * `isCurrentMonth: false`, so the dashboard would open on an empty month with
 * "in progress" copy and a reset button that does nothing.
 */
export async function getCurrentMonthScope(): Promise<MonthScope> {
  const session = await getServerAuthSession();
  const now = fromUTC(new Date(), session?.user?.timezone ?? "UTC");

  return { month: now.getMonth() + 1, year: now.getFullYear() };
}
