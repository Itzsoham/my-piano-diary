"use client";

import { motion } from "framer-motion";
import { useBirthday } from "@/components/birthday/birthday-provider";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { DashboardEarningsTrendCard } from "./dashboard-earnings-trend-card";
import { useDashboardMonth } from "./dashboard-month-provider";
import { DashboardQuickInsightsCard } from "./dashboard-quick-insights-card";
import { DashboardTopStudentsCard } from "./dashboard-top-students-card";
import { TodayLessonsTable } from "./today-lessons-table";

const containerAnimation = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

const birthdayCardStyles = {
  todayLessons: {
    shell:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(253,244,255,0.95),rgba(255,247,251,0.98))]",
    border: "border-fuchsia-200/80",
    hover: "hover:shadow-[0_15px_30px_-12px_rgba(192,38,211,0.15)]",
    delay: "0s",
  },
  topStudents: {
    shell:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,238,243,0.94),rgba(255,247,248,0.98))]",
    border: "border-rose-200/80",
    hover: "hover:shadow-[0_15px_30px_-12px_rgba(225,29,72,0.15)]",
    delay: "0.75s",
  },
  quickInsights: {
    shell:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(236,253,245,0.95),rgba(248,255,252,0.98))]",
    border: "border-emerald-200/80",
    hover: "hover:shadow-[0_15px_30px_-12px_rgba(5,150,105,0.15)]",
    delay: "1.5s",
  },
  trend: {
    shell:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,251,235,0.96),rgba(255,247,237,0.98))]",
    border: "border-amber-200/80",
    hover: "hover:shadow-[0_15px_30px_-12px_rgba(217,119,6,0.15)]",
    delay: "2.25s",
  },
} as const;

export function DashboardIntelligencePanel() {
  const { currency } = useCurrency();
  const { isBirthdayMode } = useBirthday();
  const { scope, isCurrentMonth, label, shortLabel } = useDashboardMonth();

  const { data: topStudents = [], isLoading: studentsLoading } =
    api.earnings.getTopStudentsForMonth.useQuery({ limit: 5, ...scope });

  const { data: trendData = [], isLoading: trendLoading } =
    api.earnings.getEarningsTrendForMonth.useQuery(scope);

  const { data: insights, isLoading: insightsLoading } =
    api.earnings.getQuickInsights.useQuery(scope);

  const defaultInsights = {
    completed: 0,
    cancelled: 0,
    bestDay: "No best day yet",
    inactiveCount: 0,
    inactiveLabel: "in the last 14 days",
    completionRate: 0,
  };

  const quickInsights = insights ?? defaultInsights;

  return (
    // Row 1 (today + ranking) gets a definite height at >=lg. The two cards
    // sit side by side, and a content-sized row is as tall as whichever is
    // taller — a busy teaching day stretched the ranking card to match and
    // left a screen of dead space under it. 36rem clears the podium plus its
    // runners-up, and the lessons table scrolls inside its own card past that.
    // A minmax() here would not work: with no free space to distribute the
    // row would just sit at the floor. Row 2 stays auto — the trend chart
    // should never scroll.
    <div className="grid gap-4 px-4 lg:auto-rows-[minmax(28rem,auto)] lg:grid-cols-3 lg:grid-rows-[36rem] lg:px-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerAnimation}
        transition={{ duration: 0.35 }}
        className="h-full min-w-0 rounded-[2rem] lg:col-span-2"
        style={
          isBirthdayMode
            ? {
                animation: "bday-glow-pulse 3s ease-in-out infinite",
                animationDelay: birthdayCardStyles.todayLessons.delay,
              }
            : undefined
        }
      >
        <TodayLessonsTable
          className={cn(
            "h-full transition-all duration-300 ease-out",
            isBirthdayMode &&
              `${birthdayCardStyles.todayLessons.shell} ${birthdayCardStyles.todayLessons.border} ${birthdayCardStyles.todayLessons.hover}`,
          )}
          contentClassName="overflow-y-auto"
        />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerAnimation}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="h-full min-w-0 rounded-[2rem] lg:col-span-1"
        style={
          isBirthdayMode
            ? {
                animation: "bday-glow-pulse 3s ease-in-out infinite",
                animationDelay: birthdayCardStyles.topStudents.delay,
              }
            : undefined
        }
      >
        <DashboardTopStudentsCard
          studentsLoading={studentsLoading}
          topFiveStudents={topStudents}
          monthLabel={label}
          isCurrentMonth={isCurrentMonth}
          // Carries the month across, so the full board opens on the same
          // month the card is showing rather than snapping back to all-time.
          rankingHref={`/leaderboard?month=${scope.month}&year=${scope.year}`}
          className={cn(
            "h-full transition-all duration-300 ease-out",
            isBirthdayMode &&
              `${birthdayCardStyles.topStudents.shell} ${birthdayCardStyles.topStudents.border} ${birthdayCardStyles.topStudents.hover}`,
          )}
        />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerAnimation}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="h-full min-w-0 rounded-[2rem] lg:col-span-1"
        style={
          isBirthdayMode
            ? {
                animation: "bday-glow-pulse 3s ease-in-out infinite",
                animationDelay: birthdayCardStyles.quickInsights.delay,
              }
            : undefined
        }
      >
        <DashboardQuickInsightsCard
          insights={quickInsights}
          insightsLoading={insightsLoading}
          monthLabel={shortLabel}
          isCurrentMonth={isCurrentMonth}
          className={cn(
            "h-full transition-all duration-300 ease-out",
            isBirthdayMode &&
              `${birthdayCardStyles.quickInsights.shell} ${birthdayCardStyles.quickInsights.border} ${birthdayCardStyles.quickInsights.hover}`,
          )}
        />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerAnimation}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="h-full min-w-0 rounded-[2rem] lg:col-span-2"
        style={
          isBirthdayMode
            ? {
                animation: "bday-glow-pulse 3s ease-in-out infinite",
                animationDelay: birthdayCardStyles.trend.delay,
              }
            : undefined
        }
      >
        <DashboardEarningsTrendCard
          trendLoading={trendLoading}
          trendData={trendData}
          insights={quickInsights}
          currency={currency}
          monthLabel={label}
          isCurrentMonth={isCurrentMonth}
          className={cn(
            "h-full transition-all duration-300 ease-out",
            isBirthdayMode &&
              `${birthdayCardStyles.trend.shell} ${birthdayCardStyles.trend.border} ${birthdayCardStyles.trend.hover}`,
          )}
        />
      </motion.div>
    </div>
  );
}
