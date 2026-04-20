"use client";

import { motion } from "framer-motion";
import { useCurrency } from "@/lib/currency";
import { api } from "@/trpc/react";
import { DashboardEarningsTrendCard } from "./dashboard-earnings-trend-card";
import { DashboardQuickInsightsCard } from "./dashboard-quick-insights-card";
import { DashboardTopStudentsCard } from "./dashboard-top-students-card";
import { TodayLessonsTable } from "./today-lessons-table";

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
  const { currency } = useCurrency();

  const { data: topStudents = [], isLoading: studentsLoading } =
    api.earnings.getTopStudentsThisMonth.useQuery({ limit: 3 });

  const { data: trendData = [], isLoading: trendLoading } =
    api.earnings.getEarningsTrendThisMonth.useQuery();

  const { data: insights } = api.earnings.getQuickInsights.useQuery();

  const defaultInsights = {
    completed: 0,
    cancelled: 0,
    bestDay: "No best day yet",
    inactiveCount: 0,
    completionRate: 0,
  };

  const quickInsights = insights ?? defaultInsights;

  const topThreeStudents: TopStudent[] = topStudents;

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
        <DashboardQuickInsightsCard
          insights={quickInsights}
          className="h-full"
        />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerAnimation}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="h-full lg:col-span-2"
      >
        <DashboardEarningsTrendCard
          trendLoading={trendLoading}
          trendData={trendData}
          insights={quickInsights}
          currency={currency}
          className="h-full"
        />
      </motion.div>
    </div>
  );
}
