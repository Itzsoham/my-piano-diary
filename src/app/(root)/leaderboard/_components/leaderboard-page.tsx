"use client";

import { useMemo, useState, type CSSProperties } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatScore, ordinal, takeWithTies } from "@/lib/ranking";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";

type LeaderboardData = RouterOutputs["earnings"]["getStudentLeaderboard"];
type LeaderboardEntry = LeaderboardData["ranked"][number];

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

function TrendPill({ entry }: { entry: LeaderboardEntry }) {
  if (entry.trend === null) {
    return (
      <span className="text-ink-soft inline-flex items-center gap-1 text-xs">
        <Minus className="size-3.5" aria-hidden="true" />
        No rating this month
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
        ? "Holding steady this month"
        : `${rounded > 0 ? "+" : "−"}${formatScore(Math.abs(rounded))} this month`}
    </span>
  );
}

export function LeaderboardPage({
  initialData,
}: {
  initialData: LeaderboardData;
}) {
  const { data, isPending } = api.earnings.getStudentLeaderboard.useQuery(
    undefined,
    { initialData },
  );
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");

  const ranked = useMemo(() => data?.ranked ?? [], [data]);
  const unrated = data?.unrated ?? [];
  const summary = data?.summary;

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

  if (isPending) {
    return (
      <div className="flex h-60 items-center justify-center">
        <AppLoader size="sm" />
      </div>
    );
  }

  if (ranked.length === 0) {
    return (
      <div className="bg-card/60 flex flex-col items-center justify-center rounded-3xl border border-dashed border-pink-200 px-6 py-14 text-center">
        <Mochi mood="sleepy" bob size={112} />
        <div className="text-ink mt-4 text-lg font-medium">
          No rated lessons yet
        </div>
        <div className="text-ink-soft mt-1 max-w-sm text-sm">
          Mark a lesson complete and give it a score from the attendance dialog
          — the ranking builds itself from there.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {/* ── Podium ─────────────────────────────────────────────────────── */}
      <section>
        <Card className="border-border bg-card rounded-[2rem] py-6 shadow-(--sh)">
          <CardHeader className="gap-1 pb-0">
            <CardTitle className="text-ink flex items-center gap-2 font-serif text-[1.35rem] leading-tight font-normal">
              <Blossom className="text-bubblegum" size={17} />
              All-Time Podium
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
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-ink flex items-center gap-2 font-serif text-xl font-normal sm:text-2xl">
              <Blossom size={17} className="text-bubblegum" />
              Full Ranking
            </h2>
            <p className="text-ink-soft mt-1 text-sm">
              {summary?.firstRatedAt
                ? `Every rated lesson since ${format(summary.firstRatedAt, "MMMM yyyy")}.`
                : "Every rated lesson so far."}
            </p>
          </div>
          <Badge className="rounded-full bg-pink-100 px-3 py-1 font-semibold text-pink-700 tabular-nums hover:bg-pink-100">
            {ranked.length} ranked
          </Badge>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_16rem]">
          <div className="relative">
            <Search
              className="text-ink-soft pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students"
              aria-label="Search students"
              className="bg-card h-11 rounded-full border-pink-200 pl-10 shadow-(--sh-xs) focus-visible:ring-pink-400"
            />
          </div>
          <Select
            value={sortKey}
            onValueChange={(value) => setSortKey(value as SortKey)}
          >
            <SelectTrigger className={selectTriggerClass} aria-label="Sort by">
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
        </div>

        {visible.length === 0 ? (
          <div className="bg-card/60 rounded-3xl border border-dashed border-pink-200 px-6 py-10 text-center">
            <p className="text-ink font-medium">
              No student matches “{search}”
            </p>
          </div>
        ) : (
          <ol className="grid grid-cols-1 gap-3">
            {visible.map((entry, index) => {
              const isTied = (tieCounts[entry.rank] ?? 0) > 1;
              const thinEvidence = entry.ratedCount < THIN_EVIDENCE;

              return (
                <li
                  key={entry.studentId}
                  className="rise bg-card rounded-3xl border border-pink-100 p-4 shadow-(--sh-sm) sm:p-5"
                  style={{ "--i": index } as CSSProperties}
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className={cn(
                          "grid size-11 flex-none place-items-center rounded-2xl font-serif text-lg font-bold tabular-nums",
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

                      <Avatar className="border-card size-11 flex-none border-2 shadow-(--sh-xs)">
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
                        <div className="mt-0.5">
                          <TrendPill entry={entry} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-none items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-sm font-bold text-pink-700 tabular-nums">
                      <Blossom size={13} className="text-bubblegum" />
                      {formatScore(entry.avgScore)}
                      <span className="font-semibold text-pink-400">
                        · {entry.ratedCount} rated
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                    <Stat label="Lessons done" value={entry.completedCount} />
                    <Stat label="Best score" value={entry.bestScore} />
                    <Stat label="Rated" value={`${entry.ratedShare}%`} />
                    <Stat
                      label="Last rated"
                      value={
                        entry.lastRatedAt
                          ? format(entry.lastRatedAt, "MMM d, yyyy")
                          : "—"
                      }
                    />
                  </div>

                  <div className="mt-3.5">
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
            No scored lesson yet, so there is no average to rank — they are
            listed here rather than placed last.
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
                      ? "No completed lessons yet"
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.08em] text-pink-700 uppercase">
        {label}
      </div>
      <div className="text-ink mt-0.5 text-sm font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}
