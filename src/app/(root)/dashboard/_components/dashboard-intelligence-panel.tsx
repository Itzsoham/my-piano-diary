"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { fromUTC, getEndOfMonthUTC, getStartOfMonthUTC } from "@/lib/timezone";
import { useCurrency } from "@/lib/currency";
import { api } from "@/trpc/react";
import { DashboardEarningsTrendCard } from "./dashboard-earnings-trend-card";
import { DashboardQuickInsightsCard } from "./dashboard-quick-insights-card";
import { DashboardTopStudentsCard } from "./dashboard-top-students-card";
import { TodayLessonsTable } from "./today-lessons-table";

type TrendPoint = {
  day: number;
  label: string;
  earned: number;
};

type TopStudent = {
  studentId: string | number;
  studentName: string;
  lessonCount: number;
  earnings: number;
  avatar: string | null;
};

const containerAnimation = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export function DashboardIntelligencePanel() {
  const { data: session } = useSession();
  const timezone = session?.user?.timezone ?? "UTC";
  const { currency } = useCurrency();

  const now = fromUTC(new Date(), timezone);
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStartUtc = useMemo(
    () => getStartOfMonthUTC(month, year, timezone),
    [month, year, timezone],
  );
  const monthEndUtc = useMemo(
    () => getEndOfMonthUTC(month, year, timezone),
    [month, year, timezone],
  );

  const { data: monthLessons = [], isLoading: lessonsLoading } =
    api.lesson.getAll.useQuery({
      from: monthStartUtc,
      to: monthEndUtc,
    });

  const recentFrom = useMemo(
    () => new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    [],
  );
  const recentTo = useMemo(() => new Date(), []);

  const { data: recentLessons = [] } = api.lesson.getAll.useQuery({
    from: recentFrom,
    to: recentTo,
  });

  const { data: topStudents = [], isLoading: studentsLoading } =
    api.earnings.getByStudent.useQuery();

  const { data: students = [] } = api.student.getAll.useQuery();

  const trendData = useMemo<TrendPoint[]>(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const points = Array.from({ length: daysInMonth }, (_, index) => ({
      day: index + 1,
      label: String(index + 1),
      earned: 0,
    }));

    for (const lesson of monthLessons) {
      if (lesson.status !== "COMPLETE") {
        continue;
      }

      const dayInTimezone = fromUTC(new Date(lesson.date), timezone).getDate();
      const idx = dayInTimezone - 1;
      if (!points[idx]) {
        continue;
      }

      points[idx].earned += lesson.student.lessonRate;
    }

    const currentDay = now.getDate();
    return points.filter((point) => point.day <= currentDay);
  }, [month, monthLessons, now, timezone, year]);

  const insights = useMemo(() => {
    const completed = monthLessons.filter(
      (lesson) => lesson.status === "COMPLETE",
    ).length;
    const cancelled = monthLessons.filter(
      (lesson) => lesson.status === "CANCELLED",
    ).length;
    const scheduled = monthLessons.length;

    const weekdayCounts = new Map<string, number>();
    for (const lesson of monthLessons) {
      if (lesson.status !== "COMPLETE") {
        continue;
      }

      const weekday = fromUTC(
        new Date(lesson.date),
        timezone,
      ).toLocaleDateString("en-US", { weekday: "long" });
      weekdayCounts.set(weekday, (weekdayCounts.get(weekday) ?? 0) + 1);
    }

    const bestDay =
      [...weekdayCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "No best day yet";

    const recentActiveIds = new Set(
      recentLessons
        .filter((lesson) => lesson.status === "COMPLETE")
        .map((lesson) => lesson.studentId),
    );
    const inactiveCount = Math.max(0, students.length - recentActiveIds.size);

    return {
      completed,
      cancelled,
      bestDay,
      inactiveCount,
      completionRate:
        scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
    };
  }, [monthLessons, recentLessons, students.length, timezone]);

  const topThreeStudents: TopStudent[] = topStudents.slice(0, 3);

  return (
    <div className="grid gap-4 px-4 lg:auto-rows-[28rem] lg:grid-cols-3 lg:px-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerAnimation}
        transition={{ duration: 0.35 }}
        className="h-full lg:col-span-2"
      >
        <TodayLessonsTable
          className="h-full"
          contentClassName="overflow-y-auto"
        />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerAnimation}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="h-full lg:col-span-1"
      >
        <DashboardTopStudentsCard
          studentsLoading={studentsLoading}
          topThreeStudents={topThreeStudents}
          currency={currency}
          className="h-full"
        />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerAnimation}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="h-full lg:col-span-1"
      >
        <DashboardQuickInsightsCard insights={insights} className="h-full" />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerAnimation}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="h-full lg:col-span-2"
      >
        <DashboardEarningsTrendCard
          lessonsLoading={lessonsLoading}
          trendData={trendData}
          insights={insights}
          currency={currency}
          className="h-full"
        />
      </motion.div>
    </div>
  );
}
