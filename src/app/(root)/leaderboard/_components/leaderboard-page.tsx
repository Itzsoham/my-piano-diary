"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, TrendingDown, TrendingUp, Minus } from "lucide-react";

import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { ScorePodium, getInitials } from "@/components/ranking/score-podium";
import { AppLoader } from "@/components/ui/app-loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MonthSelect } from "@/components/ui/month-select";
import { RefreshOverlay } from "@/components/ui/refresh-overlay";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatMonthScope,
  formatShortMonthScope,
  parseMonthScopeParams,
  sameMonthScope,
  type MonthScope,
} from "@/lib/month-scope";
import { formatScore, ordinal, takeWithTies } from "@/lib/ranking";
import { useFilterParams } from "@/lib/use-filter-params";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";

type LeaderboardData = RouterOutputs["earnings"]["getStudentLeaderboard"];
type LeaderboardEntry = LeaderboardData["ranked"][number];
type Comparison = LeaderboardData["summary"]["comparison"];

type SortKey = "rank" | "lessons" | "recent" | "name";

const SORT_LABELS: Record<SortKey, string> = {
  rank: "Rank (average score)",
  lessons: "Most rated lessons",
  recent: "Recently rated",
  name: "Name (A-Z)",
};

// Same candy-pill treatment the Reports filters use — SelectTrigger sets its
// own height through a `data-[size=default]:h-9` variant, so the override has
// to target that variant to win on specificity.
const selectTriggerClass =
  "h-11 w-full min-w-0 rounded-full border-pink-200 bg-card px-4 text-sm shadow-(--sh-xs) focus-visible:ring-pink-400 data-[size=default]:h-11";

// A one-or-two lesson average swings a whole point on a single rating, so the
// board flags it rather than hiding the student — the teacher can see *why* a
// 5.0 is sitting at the top.
const THIN_EVIDENCE = 3;

function ScoreSpread({ counts }: { counts: number[] }) {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return null;

  // Score 5 first so the bar reads best -> worst, left to right. Shades are
  // limited to the tokens globals.css actually registers (there is no
  // teal-300), otherwise a segment would render with no background at all.
  const tiers = [
    { score: 5, className: "bg-pink-400" },
    { score: 4, className: "bg-pink-300" },
    { score: 3, className: "bg-sand-300" },
    { score: 2, className: "bg-teal-400" },
    { score: 1, className: "bg-teal-200" },
  ];

  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-full bg-pink-50"
      role="img"
      aria-label={tiers
        .map((tier) => `${counts[tier.score - 1] ?? 0} rated ${tier.score}`)
        .join(", ")}
    >
      {tiers.map((tier) => {
        const count = counts[tier.score - 1] ?? 0;
        if (count === 0) return null;

        return (
          <span
            key={tier.score}
            className={tier.className}
            style={{ width: `${(count / total) * 100}%` }}
          />
        );
      })}
    </div>
  );
}

/**
 * What the trend is measured against changes with the board: an all-time board
 * compares this month to the all-time average, a month board compares the month
 * on screen to the one before it. The pill has to name the right one or a "+0.4"
 * is meaningless.
 */
function TrendPill({
  entry,
  comparison,
}: {
  entry: LeaderboardEntry;
  comparison: Comparison;
}) {
  const against =
    comparison.kind === "this-month"
      ? "this month"
      : `vs ${formatShortMonthScope(comparison)}`;

  if (entry.trend === null) {
    return (
      <span className="text-ink-soft inline-flex items-center gap-1 text-xs">
        <Minus className="size-3.5" aria-hidden="true" />
        {comparison.kind === "this-month"
          ? "No rating this month"
          : `Nothing rated in ${formatShortMonthScope(comparison)}`}
      </span>
    );
  }

  const rounded = Math.round(entry.trend * 100) / 100;
  const isFlat = Math.abs(rounded) < 0.005;
  const Icon = isFlat ? Minus : rounded > 0 ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold tabular-nums",
        isFlat
          ? "text-ink-soft"
          : rounded > 0
            ? "text-teal-700"
            : "text-pink-700",
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {isFlat
        ? `Holding steady ${against}`
        : `${rounded > 0 ? "+" : "−"}${formatScore(Math.abs(rounded))} ${against}`}
    </span>
  );
}

export function LeaderboardPage({
  initialData,
  initialScope,
  currentMonth,
}: {
  initialData: LeaderboardData;
  /** The scope the server rendered `initialData` for — null means all-time. */
  initialScope: MonthScope | null;
  currentMonth: MonthScope;
}) {
  const { searchParams, setParams } = useFilterParams();

  const scope = parseMonthScopeParams(
    searchParams.get("month"),
    searchParams.get("year"),
  );

  const setScope = (next: MonthScope | null) =>
    setParams(
      next
        ? { month: String(next.month), year: String(next.year) }
        : { month: null, year: null },
    );

  const { data, isPending, isFetching } =
    api.earnings.getStudentLeaderboard.useQuery(scope ?? undefined, {
      // Seeded only for the scope the server actually fetched; every other
      // month arrives over the wire, with the previous board held on screen so
      // switching months never blanks the page.
      initialData: sameMonthScope(scope, initialScope)
        ? initialData
        : undefined,
      placeholderData: keepPreviousData,
    });

  const { data: activityMonths = [] } =
    api.earnings.getActivityMonths.useQuery();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");

  const ranked = useMemo(() => data?.ranked ?? [], [data]);
  const unrated = data?.unrated ?? [];
  const summary = data?.summary;
  const comparison: Comparison = summary?.comparison ?? { kind: "this-month" };
  const isRefreshing = isFetching && !isPending;

  // Named from the data on screen, not from the URL. `keepPreviousData` holds
  // the old month's rows during a switch, and a heading that had already
  // flipped to the new month would be captioning the wrong board. The picker
  // itself still follows `scope`, so the control stays responsive.
  const scopeLabel = summary?.scope ? formatMonthScope(summary.scope) : null;

  // Podium mirrors the dashboard card exactly — same component, same rules,
  // so the two boards can never disagree about who is on top.
  const podiumStudents = useMemo(() => takeWithTies(ranked, 5), [ranked]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? ranked.filter((entry) => entry.studentName.toLowerCase().includes(term))
      : ranked;

    // `ranked` already arrives in rank order; the other keys re-sort a copy.
    if (sortKey === "rank") return filtered;

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "lessons":
          return b.ratedCount - a.ratedCount || a.rank - b.rank;
        case "recent":
          return (
            (b.lastRatedAt?.getTime() ?? 0) - (a.lastRatedAt?.getTime() ?? 0) ||
            a.rank - b.rank
          );
        case "name":
          return a.studentName.localeCompare(b.studentName);
        default:
          return a.rank - b.rank;
      }
    });
  }, [ranked, search, sortKey]);

  const tieCounts = useMemo(
    () =>
      ranked.reduce<Record<number, number>>((acc, entry) => {
        acc[entry.rank] = (acc[entry.rank] ?? 0) + 1;
        return acc;
      }, {}),
    [ranked],
  );

  // The filter bar renders in every state — including the empty one. A month
  // with no ratings that also hid its own month picker would be a dead end.
  const filters = (
    <section className="relative">
      <RefreshOverlay active={isRefreshing} />
      <div className="rounded-[calc(var(--radius)+4px)] border border-pink-100 bg-[linear-gradient(160deg,var(--pink-50),var(--surface)_75%)] p-3 shadow-(--sh-sm) sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,15rem)]">
          <Field label="Period">
            <MonthSelect
              value={scope}
              onChange={setScope}
              months={activityMonths}
              currentMonth={currentMonth}
              allTimeLabel="All time"
              ariaLabel="Ranking period"
              renderHint={(option) =>
                option.lessons ? `${option.lessons} lessons` : "no lessons"
              }
            />
          </Field>

          <Field label="Search" htmlFor="ranking-search">
            <div className="relative">
              <Search
                className="text-ink-soft pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                id="ranking-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students"
                className="bg-card h-11 rounded-full border-pink-200 pl-10 shadow-(--sh-xs) focus-visible:ring-pink-400"
              />
            </div>
          </Field>

          <Field label="Sort by">
            <Select
              value={sortKey}
              onValueChange={(value) => setSortKey(value as SortKey)}
            >
              <SelectTrigger
                className={selectTriggerClass}
                aria-label="Sort by"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SORT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
    </section>
  );

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        {filters}
        <div className="flex h-60 items-center justify-center">
          <AppLoader size="sm" />
        </div>
      </div>
    );
  }

  if (ranked.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {filters}
        <div className="bg-card/60 flex flex-col items-center justify-center rounded-3xl border border-dashed border-pink-200 px-6 py-14 text-center">
          <Mochi mood="sleepy" bob size={112} />
          <div className="text-ink mt-4 text-lg font-medium">
            {scopeLabel
              ? `No rated lessons in ${scopeLabel}`
              : "No rated lessons yet"}
          </div>
          <div className="text-ink-soft mt-1 max-w-sm text-sm">
            {scopeLabel
              ? "Pick another month above, or switch to All time to see the whole studio."
              : "Mark a lesson complete and give it a score from the attendance dialog — the ranking builds itself from there."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {filters}

      {/* ── Podium ─────────────────────────────────────────────────────── */}
      <section>
        <Card className="border-border bg-card rounded-[2rem] py-6 shadow-(--sh)">
          <CardHeader className="gap-1 pb-0">
            <CardTitle className="text-ink flex items-center gap-2 font-serif text-[1.35rem] leading-tight font-normal">
              <Blossom className="text-bubblegum" size={17} />
              {scopeLabel ? `${scopeLabel} Podium` : "All-Time Podium"}
            </CardTitle>
            <p className="text-ink-soft text-xs">
              By average lesson score · students with the same average share a
              rank
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <ScorePodium
              students={podiumStudents}
              renderRunnerMeta={(entry) =>
                `${entry.completedCount} lesson${entry.completedCount === 1 ? "" : "s"} · best ${entry.bestScore}`
              }
            />
          </CardContent>
        </Card>
      </section>

      {/* ── Full ranking ───────────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 className="text-ink flex items-center gap-2 font-serif text-xl font-normal sm:text-2xl">
              <Blossom size={17} className="text-bubblegum" />
              Full Ranking
            </h2>
            <p className="text-ink-soft mt-1 text-sm">
              {scopeLabel
                ? `Every lesson rated in ${scopeLabel}.`
                : summary?.firstRatedAt
                  ? `Every rated lesson since ${format(summary.firstRatedAt, "MMMM yyyy")}.`
                  : "Every rated lesson so far."}
            </p>
          </div>
          <Badge className="flex-none rounded-full bg-pink-100 px-3 py-1 font-semibold text-pink-700 tabular-nums hover:bg-pink-100">
            {visible.length === ranked.length
              ? `${ranked.length} ranked`
              : `${visible.length} of ${ranked.length}`}
          </Badge>
        </div>

        {visible.length === 0 ? (
          <div className="bg-card/60 rounded-3xl border border-dashed border-pink-200 px-6 py-10 text-center">
            <p className="text-ink font-medium">
              No student matches “{search}”
            </p>
          </div>
        ) : (
          <>
            {/* >=xl: one row per student. Every value on these cards is short
                and tabular, so as a card grid they read as nine tall blocks
                that force the eye back to the left edge to compare any two
                averages. The table puts the whole board in one scan and drops
                the section to roughly a third of its height. */}
            <div className="bg-card hidden overflow-hidden rounded-3xl border border-pink-100 shadow-(--sh-sm) xl:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Full student ranking by average lesson score
                </caption>
                <thead>
                  <tr className="border-b border-pink-100 bg-pink-50/70">
                    <RankTh className="w-20 pl-5">Rank</RankTh>
                    <RankTh>Student</RankTh>
                    <RankTh className="w-24 text-right">Lessons</RankTh>
                    <RankTh className="w-28 text-right">Rated</RankTh>
                    <RankTh className="w-20 text-right">Best</RankTh>
                    <RankTh className="w-32 text-right">Last rated</RankTh>
                    <RankTh className="w-56">Score spread</RankTh>
                    <RankTh className="w-28 pr-5 text-right">Average</RankTh>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((entry) => {
                    const isTied = (tieCounts[entry.rank] ?? 0) > 1;
                    const thinEvidence = entry.ratedCount < THIN_EVIDENCE;

                    return (
                      <tr
                        key={entry.studentId}
                        className="border-b border-pink-50 transition-colors last:border-0 hover:bg-pink-50/40"
                      >
                        <td className="py-3 pr-3 pl-5 align-middle">
                          <span
                            className={cn(
                              "grid size-10 place-items-center rounded-2xl font-serif text-lg font-bold tabular-nums",
                              entry.rank === 1
                                ? "bg-pink-100 text-pink-700"
                                : entry.rank === 2
                                  ? "bg-teal-100 text-teal-700"
                                  : entry.rank === 3
                                    ? "bg-sand-100 text-sand-700"
                                    : "text-ink-soft bg-pink-50",
                            )}
                          >
                            <span aria-hidden="true">{entry.rank}</span>
                            <span className="sr-only">
                              {ordinal(entry.rank)} place
                              {isTied ? " (tied)" : ""}
                            </span>
                          </span>
                        </td>

                        <td className="min-w-0 py-3 pr-3 align-middle">
                          <div className="flex items-center gap-3">
                            <Avatar className="border-card size-10 flex-none border-2 shadow-(--sh-xs)">
                              <AvatarImage src={entry.avatar ?? undefined} />
                              <AvatarFallback className="bg-pink-100 text-xs font-bold text-pink-700">
                                {getInitials(entry.studentName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-ink truncate font-semibold">
                                  {entry.studentName}
                                </span>
                                {isTied && (
                                  <span className="text-ink-soft flex-none rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                                    tied
                                  </span>
                                )}
                              </div>
                              <TrendPill
                                entry={entry}
                                comparison={comparison}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="text-ink py-3 pr-3 text-right align-middle text-sm font-semibold tabular-nums">
                          {entry.completedCount}
                        </td>

                        <td className="text-ink py-3 pr-3 text-right align-middle text-sm font-semibold tabular-nums">
                          {entry.ratedCount} · {entry.ratedShare}%
                          {thinEvidence && (
                            <span
                              className="text-pink-700"
                              aria-hidden="true"
                              title="Fewer than 3 rated lessons — a single rating still moves this average a lot."
                            >
                              *
                            </span>
                          )}
                        </td>

                        <td className="text-ink py-3 pr-3 text-right align-middle text-sm font-semibold tabular-nums">
                          {entry.bestScore}
                        </td>

                        <td className="text-ink py-3 pr-3 text-right align-middle text-sm font-semibold tabular-nums">
                          {entry.lastRatedAt
                            ? format(entry.lastRatedAt, "MMM d, yyyy")
                            : "—"}
                        </td>

                        <td className="py-3 pr-3 align-middle">
                          <ScoreSpread counts={entry.scoreCounts} />
                        </td>

                        <td className="py-3 pr-5 text-right align-middle">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-sm font-bold text-pink-700 tabular-nums">
                            <Blossom size={13} className="text-bubblegum" />
                            {formatScore(entry.avgScore)}
                            <span className="sr-only">
                              {" "}
                              average from {entry.ratedCount} rated{" "}
                              {entry.ratedCount === 1 ? "lesson" : "lessons"}
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* The thin-evidence caveat each card spells out in full; the table
                marks it and explains it once, under the board. */}
            {visible.some((entry) => entry.ratedCount < THIN_EVIDENCE) && (
              <p className="text-ink-soft mt-3 hidden text-xs xl:block">
                <span className="font-semibold text-pink-700">*</span> Fewer
                than {THIN_EVIDENCE} rated lessons — a single rating still moves
                that average a lot.
              </p>
            )}

            {/* <xl: the cards, which stack the same eight values two-up. */}
            <ol className="grid grid-cols-1 gap-3 xl:hidden">
              {visible.map((entry, index) => {
                const isTied = (tieCounts[entry.rank] ?? 0) > 1;
                const thinEvidence = entry.ratedCount < THIN_EVIDENCE;

                return (
                  <li
                    key={entry.studentId}
                    className="rise bg-card rounded-3xl border border-pink-100 p-4 shadow-(--sh-sm) sm:p-5"
                    style={{ "--i": index } as CSSProperties}
                  >
                    {/* Identity row. Fixed-width rank badge and avatar so the
                      names start on one line down the whole list, and the
                      score pill hangs on a single right edge — nothing wraps
                      onto its own row at any width. */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span
                        className={cn(
                          "grid size-10 flex-none place-items-center rounded-2xl font-serif text-lg font-bold tabular-nums sm:size-11",
                          entry.rank === 1
                            ? "bg-pink-100 text-pink-700"
                            : entry.rank === 2
                              ? "bg-teal-100 text-teal-700"
                              : entry.rank === 3
                                ? "bg-sand-100 text-sand-700"
                                : "text-ink-soft bg-pink-50",
                        )}
                      >
                        <span aria-hidden="true">{entry.rank}</span>
                        <span className="sr-only">
                          {ordinal(entry.rank)} place{isTied ? " (tied)" : ""}
                        </span>
                      </span>

                      <Avatar className="border-card size-10 flex-none border-2 shadow-(--sh-xs) sm:size-11">
                        <AvatarImage src={entry.avatar ?? undefined} />
                        <AvatarFallback className="bg-pink-100 text-xs font-bold text-pink-700">
                          {getInitials(entry.studentName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-ink truncate font-semibold">
                            {entry.studentName}
                          </span>
                          {isTied && (
                            <span className="text-ink-soft flex-none rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                              tied
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5">
                          <TrendPill entry={entry} comparison={comparison} />
                        </div>
                      </div>

                      {/* Score only — the rated count lives in the stat grid, so
                        this pill stays a constant width and the column of
                        averages reads straight down the page. */}
                      <span className="flex flex-none items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-sm font-bold text-pink-700 tabular-nums">
                        <Blossom size={13} className="text-bubblegum" />
                        {formatScore(entry.avgScore)}
                        <span className="sr-only">
                          {" "}
                          average from {entry.ratedCount} rated{" "}
                          {entry.ratedCount === 1 ? "lesson" : "lessons"}
                        </span>
                      </span>
                    </div>

                    {/* Four short, tabular values so the columns line up across
                      every row. Coverage rides along inside "Rated" rather
                      than taking a tile of its own — it is the same fact as
                      rated-over-lessons, just easier to compare between
                      students with different lesson counts. */}
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                      <Stat label="Lessons" value={entry.completedCount} />
                      <Stat
                        label="Rated"
                        value={`${entry.ratedCount} · ${entry.ratedShare}%`}
                      />
                      <Stat label="Best" value={entry.bestScore} />
                      <Stat
                        label="Last rated"
                        value={
                          entry.lastRatedAt
                            ? format(entry.lastRatedAt, "MMM d, yyyy")
                            : "—"
                        }
                      />
                    </dl>

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold tracking-[0.08em] text-pink-700 uppercase">
                          Score spread
                        </span>
                        <span
                          className="text-ink-soft text-[10px] font-semibold"
                          aria-hidden="true"
                        >
                          5 → 1
                        </span>
                      </div>
                      <ScoreSpread counts={entry.scoreCounts} />
                    </div>

                    {thinEvidence && (
                      <p className="text-ink-soft mt-3 text-xs">
                        Based on {entry.ratedCount} rated lesson
                        {entry.ratedCount === 1 ? "" : "s"} — a single rating
                        still moves this average a lot.
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </section>

      {/* ── Students with no ratings ───────────────────────────────────── */}
      {unrated.length > 0 && (
        <section>
          <h2 className="text-ink flex items-center gap-2 font-serif text-xl font-normal sm:text-2xl">
            <Blossom size={17} className="text-bubblegum" />
            Not Rated Yet
          </h2>
          <p className="text-ink-soft mt-1 mb-4 text-sm">
            {scopeLabel
              ? `No scored lesson in ${scopeLabel}, so there is no average to rank — they are listed here rather than placed last.`
              : "No scored lesson yet, so there is no average to rank — they are listed here rather than placed last."}
          </p>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {unrated.map((student) => (
              <li
                key={student.studentId}
                className="bg-card/70 flex items-center gap-3 rounded-2xl border border-dashed border-pink-200 p-3.5"
              >
                <Avatar className="border-card size-10 flex-none border-2 shadow-(--sh-xs)">
                  <AvatarImage src={student.avatar ?? undefined} />
                  <AvatarFallback className="bg-pink-50 text-xs font-bold text-pink-700">
                    {getInitials(student.studentName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-ink truncate font-semibold">
                    {student.studentName}
                  </div>
                  <div className="text-ink-soft text-xs">
                    {student.completedCount === 0
                      ? scopeLabel
                        ? "No lessons that month"
                        : "No completed lessons yet"
                      : `${student.completedCount} completed lesson${student.completedCount === 1 ? "" : "s"} · none rated`}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * Label above control — keeps the three filters on one grid, with matching
 * label baselines and a shared 44px control height.
 *
 * Only the search box is a real form control, so only it gets a `<label>`; the
 * two Radix triggers carry their own `aria-label` and take a plain caption
 * here, because a `<label for>` pointing at a button id that never renders is
 * worse for a screen reader than no label at all.
 */
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const Caption = htmlFor ? "label" : "span";

  return (
    <div className="min-w-0 space-y-1.5">
      <Caption
        htmlFor={htmlFor}
        className="block text-xs font-medium text-pink-700"
      >
        {label}
      </Caption>
      {children}
    </div>
  );
}

/** Column header for the >=xl ranking table — matches the Stat caption. */
function RankTh({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "py-2.5 pr-3 text-[10px] font-semibold tracking-[0.08em] text-pink-700 uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold tracking-[0.08em] whitespace-nowrap text-pink-700 uppercase">
        {label}
      </dt>
      <dd className="text-ink mt-0.5 truncate text-sm font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  );
}
