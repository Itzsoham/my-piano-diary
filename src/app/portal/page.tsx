"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  History,
  Music,
  Play,
  QrCode,
  Sparkles,
  User,
  Video,
  WalletCards,
  XCircle,
} from "lucide-react";

import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { AppLoader } from "@/components/ui/app-loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import { isMediaImage, parseVideoUrl } from "@/lib/practice-video";
import { api } from "@/trpc/react";

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export default function PortalOverviewPage() {
  const { currency } = useCurrency();
  const { data: overview, isLoading } = api.portal.overview.useQuery();
  const { data: qr } = api.portal.qr.useQuery();
  const { data: videos = [] } = api.portal.videos.useQuery();

  const [selectedChildId, setSelectedChildId] = React.useState<string | null>(
    null,
  );

  // Month navigation for the Lessons section
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());

  const activeChildId = selectedChildId ?? overview?.children[0]?.id ?? null;
  const activeChild =
    overview?.children.find((c) => c.id === activeChildId) ??
    overview?.children[0];

  // Fetch month-wise lessons for the selected month and student
  const { data: monthLessonsData, isLoading: isLessonsLoading } =
    api.portal.lessons.useQuery(
      {
        studentId: activeChild?.id,
        month: selectedMonth,
        year: selectedYear,
      },
      {
        enabled: !!activeChild?.id,
      },
    );

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <AppLoader size="md" text="Welcoming you to your piano diary..." />
      </div>
    );
  }

  if (!overview || overview.children.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Mochi mood="content" size={120} />
        <h2 className="mt-4 font-serif text-xl font-normal text-ink">
          Welcome to the Parent Portal
        </h2>
        <p className="mt-2 text-xs text-ink-soft leading-relaxed">
          No students are currently linked to your parent account. Please ask
          your piano teacher to link your account to your children.
        </p>
      </div>
    );
  }

  const statusBadgeConfig = {
    UNPAID: {
      label: "Unpaid",
      bg: "bg-no-bg",
      fg: "text-no-fg",
      dot: "bg-no-dot",
    },
    PARTIAL: {
      label: "Partial",
      bg: "bg-wait-bg",
      fg: "text-wait-fg",
      dot: "bg-wait-dot",
    },
    PAID: { label: "Paid", bg: "bg-ok-bg", fg: "text-ok-fg", dot: "bg-ok-dot" },
  };

  const statusToken = activeChild?.currentMonthPayment
    ? statusBadgeConfig[activeChild.currentMonthPayment.status]
    : statusBadgeConfig.UNPAID;

  const monthNames = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const isSelectedCurrentMonth =
    selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();

  const latestChildVideo = videos.find(
    (v) => v.student.id === activeChild?.id,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      {/* Studio Greeting Card */}
      <div className="relative overflow-hidden rounded-3xl border border-pink-200/80 bg-[linear-gradient(145deg,var(--pink-100),var(--surface)_70%)] p-6 shadow-(--sh)">
        <Blossom
          size={80}
          className="pointer-events-none absolute -top-4 -right-4 text-bubblegum opacity-30"
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          {/* Welcome Greeting with Parent Name and Teacher Badge */}
          <div className="flex items-center gap-4">
            <Avatar className="size-14 border-2 border-white shadow-xs">
              <AvatarImage src={overview.teacher.image ?? ""} />
              <AvatarFallback className="bg-pink-200 text-pink-800 font-bold text-sm">
                {getInitials(overview.teacher.name ?? "Teacher")}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold text-pink-700 shadow-2xs border border-pink-200/70">
                <Blossom size={12} className="text-bubblegum" />
                Piano Teacher: {overview.teacher.name}
              </div>

              <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-normal text-ink">
                Welcome back, {overview.parent.name}!
              </h1>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              size="sm"
              className="rounded-full [background-image:var(--grad-pink)] text-white text-xs shadow-(--sh-pink) hover:brightness-105"
            >
              <Link href="/portal/payments">
                <QrCode className="mr-1.5 size-3.5" />
                Pay Tuition
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-pink-200 bg-white/70 text-pink-700 text-xs hover:bg-pink-50"
            >
              <Link href="/portal/videos">
                <Video className="mr-1.5 size-3.5" />
                Practice Room ({overview.studioVideoCount})
              </Link>
            </Button>
          </div>
        </div>

        {/* Children Switcher Tabs (if multiple children) */}
        {overview.children.length > 1 && (
          <div className="mt-5 flex items-center gap-2 border-t border-pink-200/60 pt-4">
            <span className="text-xs font-semibold text-pink-700 flex items-center gap-1">
              <User className="size-3.5" />
              Viewing Child:
            </span>
            <div className="flex flex-wrap gap-2">
              {overview.children.map((child) => {
                const isSelected = child.id === activeChild?.id;
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelectedChildId(child.id)}
                    className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white text-pink-800 shadow-xs font-semibold border border-pink-300 ring-2 ring-pink-300/40"
                        : "bg-white/60 text-ink-soft hover:bg-white/80"
                    }`}
                  >
                    <Avatar className="size-5">
                      <AvatarImage src={child.avatar ?? ""} />
                      <AvatarFallback className="text-[9px]">
                        {getInitials(child.name)}
                      </AvatarFallback>
                    </Avatar>
                    {child.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left Column (Tuition & Dues) + Right Column (Monthly Lessons & Cancellations) */}
      {activeChild && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tuition & Financial Balance (4 columns) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Current Month Tuition Card */}
            <Card className="relative overflow-hidden rounded-3xl border-pink-200/70 p-5 shadow-(--sh) bg-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-pink-700 tracking-wider uppercase flex items-center gap-1.5">
                  <WalletCards className="size-3.5" />
                  This Month&apos;s Tuition
                </span>
                <Badge
                  className={`${statusToken.bg} ${statusToken.fg} gap-1.5 border-transparent text-[11px] font-semibold`}
                >
                  <span
                    className={`size-1.5 rounded-full ${statusToken.dot}`}
                  />
                  {statusToken.label}
                </Badge>
              </div>

              <div className="my-4">
                <div className="text-3xl font-bold tracking-tight text-ink tabular-nums">
                  {formatCurrency(
                    activeChild.currentMonthPayment.expected,
                    currency,
                  )}
                </div>
                <p className="text-xs text-ink-soft mt-1">
                  Month {activeChild.currentMonthPayment.month}/
                  {activeChild.currentMonthPayment.year} (
                  {activeChild.name})
                </p>

                {activeChild.currentMonthPayment.remaining > 0 ? (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-no-bg px-2.5 py-1 text-xs font-medium text-no-fg">
                    <AlertCircle className="size-3.5" />
                    Due this month:{" "}
                    {formatCurrency(
                      activeChild.currentMonthPayment.remaining,
                      currency,
                    )}
                  </div>
                ) : (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-ok-bg px-2.5 py-1 text-xs font-medium text-ok-fg">
                    <CheckCircle2 className="size-3.5" />
                    This month settled up!
                  </div>
                )}
              </div>

              {/* Previous Month(s) Pending Balance Alert */}
              {activeChild.previousUnpaidTotal > 0 ? (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-rose-800">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="size-4 text-rose-600" />
                      Previous Months Overdue
                    </span>
                    <span className="tabular-nums font-bold">
                      {formatCurrency(
                        activeChild.previousUnpaidTotal,
                        currency,
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-rose-700/80">
                    You have unpaid tuition from earlier months. Please review
                    with your teacher.
                  </p>
                </div>
              ) : (
                <div className="mb-4 rounded-2xl border border-teal-100 bg-teal-50/50 p-2.5 text-[11.5px] text-teal-800 flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-teal-600" />
                  <span>No outstanding balance from previous months.</span>
                </div>
              )}

              {/* History Dialog & Payment Link */}
              <div className="space-y-2">
                <Button
                  asChild
                  className="w-full rounded-full [background-image:var(--grad-pink)] text-xs text-white shadow-(--sh-pink)"
                >
                  <Link href="/portal/payments">
                    <QrCode className="mr-1.5 size-3.5" />
                    View Payment QR &amp; Details
                  </Link>
                </Button>

                {/* All Months Breakdown Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full border-pink-200 text-xs text-pink-700 hover:bg-pink-50"
                    >
                      <History className="mr-1.5 size-3.5" />
                      Check All Months History
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-3xl border-pink-200">
                    <DialogHeader>
                      <DialogTitle className="font-serif text-lg font-normal text-ink">
                        Tuition History: {activeChild.name}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-ink-soft">
                        Month-by-month record of billed tuition and payments.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 mt-2">
                      {activeChild.allMonthsSummary.map((m) => {
                        const token = statusBadgeConfig[m.status];
                        return (
                          <div
                            key={`${m.year}-${m.month}`}
                            className="flex items-center justify-between rounded-2xl border border-pink-100 bg-pink-50/30 p-3"
                          >
                            <div>
                              <div className="text-xs font-semibold text-ink">
                                {monthNames[m.month]} {m.year}
                              </div>
                              <div className="text-[11px] text-ink-soft mt-0.5">
                                Expected: {formatCurrency(m.expected, currency)}{" "}
                                · Paid: {formatCurrency(m.received, currency)}
                              </div>
                            </div>

                            <div className="text-right">
                              <Badge
                                className={`${token.bg} ${token.fg} text-[10px] border-transparent font-semibold`}
                              >
                                {token.label}
                              </Badge>
                              {m.remaining > 0 && (
                                <div className="text-[11px] font-semibold text-no-fg mt-0.5">
                                  Due: {formatCurrency(m.remaining, currency)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            {/* Quick Practice Teaser */}
            {latestChildVideo && (
              <Card className="rounded-3xl border-pink-200/70 p-4 shadow-(--sh) bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-pink-700 uppercase flex items-center gap-1.5">
                    <Video className="size-3.5" />
                    Latest Practice Post
                  </span>
                  <Link
                    href="/portal/videos"
                    className="text-[11px] font-semibold text-pink-700 hover:underline"
                  >
                    View All
                  </Link>
                </div>
                <div className="text-xs font-semibold text-ink truncate">
                  {latestChildVideo.title}
                </div>
                {latestChildVideo.teacherComment ? (
                  <div className="mt-2 rounded-xl bg-pink-50/70 p-2.5 text-xs text-pink-900 border border-pink-200/60">
                    <div className="flex items-center gap-1 text-[10.5px] font-bold text-pink-700">
                      <Sparkles className="size-3 text-pink-600" />
                      Teacher feedback:
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11.5px] text-ink-soft">
                      {latestChildVideo.teacherComment}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-ink-soft">
                    Waiting for teacher review
                  </p>
                )}
              </Card>
            )}
          </div>

          {/* Monthly Lessons & Attendance View (8 columns) */}
          <div className="lg:col-span-8">
            <Card className="rounded-3xl border-pink-200/70 p-5 shadow-(--sh) bg-card space-y-4">
              {/* Header with Month Navigation */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-pink-100 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-pink-800 uppercase tracking-wider flex items-center gap-2">
                    <CalendarDays className="size-4 text-pink-600" />
                    Lessons &amp; Attendance: {activeChild.name}
                  </h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Complete monthly history of completed, cancelled, and
                    scheduled lessons.
                  </p>
                </div>

                {/* Month Navigator Controls */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full hover:bg-pink-100 text-pink-700"
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  <div className="min-w-28 text-center text-xs font-semibold text-ink px-2 py-1 rounded-full bg-pink-50 border border-pink-200">
                    {monthNames[selectedMonth]} {selectedYear}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full hover:bg-pink-100 text-pink-700"
                    onClick={handleNextMonth}
                    aria-label="Next month"
                  >
                    <ChevronRight className="size-4" />
                  </Button>

                  {!isSelectedCurrentMonth && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCurrentMonth}
                      className="h-8 rounded-full border-pink-200 text-[11px] text-pink-700 hover:bg-pink-50 ml-1"
                    >
                      Today
                    </Button>
                  )}
                </div>
              </div>

              {/* Monthly Summary Statistics Strip */}
              {monthLessonsData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-2xl border border-teal-200/60 bg-teal-50/50 p-2.5 text-center">
                    <div className="text-xs text-teal-700 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="size-3" />
                      Completed
                    </div>
                    <div className="text-lg font-bold text-teal-900 mt-0.5">
                      {monthLessonsData.stats.completedCount}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-rose-200/60 bg-rose-50/50 p-2.5 text-center">
                    <div className="text-xs text-rose-700 font-semibold flex items-center justify-center gap-1">
                      <XCircle className="size-3" />
                      Cancelled
                    </div>
                    <div className="text-lg font-bold text-rose-900 mt-0.5">
                      {monthLessonsData.stats.cancelledCount}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-pink-200/60 bg-pink-50/50 p-2.5 text-center">
                    <div className="text-xs text-pink-700 font-semibold flex items-center justify-center gap-1">
                      <Clock className="size-3" />
                      Scheduled
                    </div>
                    <div className="text-lg font-bold text-pink-900 mt-0.5">
                      {monthLessonsData.stats.pendingCount}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-2.5 text-center">
                    <div className="text-xs text-amber-700 font-semibold flex items-center justify-center gap-1">
                      <Music className="size-3" />
                      Time Studied
                    </div>
                    <div className="text-lg font-bold text-amber-900 mt-0.5">
                      {monthLessonsData.stats.totalMinutes} min
                    </div>
                  </div>
                </div>
              )}

              {/* Lessons List */}
              <div className="space-y-3 pt-2">
                {isLessonsLoading ? (
                  <div className="py-12 flex justify-center">
                    <AppLoader size="sm" text="Loading monthly lessons..." />
                  </div>
                ) : !monthLessonsData ||
                  monthLessonsData.lessons.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl border border-dashed border-pink-200 bg-pink-50/30">
                    <Mochi mood="content" size={70} />
                    <p className="mt-3 text-xs font-semibold text-ink">
                      No lessons recorded for {monthNames[selectedMonth]}{" "}
                      {selectedYear}.
                    </p>
                    <p className="text-[11px] text-ink-soft mt-0.5">
                      Use the arrow buttons above to review previous months.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {monthLessonsData.lessons.map((lesson) => {
                      const isComplete = lesson.status === "COMPLETE";
                      const isCancelled = lesson.status === "CANCELLED";
                      const isPending = lesson.status === "PENDING";

                      return (
                        <div
                          key={lesson.id}
                          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border p-3.5 transition-colors ${
                            isComplete
                              ? "border-teal-200/80 bg-white hover:bg-teal-50/20"
                              : isCancelled
                                ? "border-rose-200/80 bg-rose-50/30"
                                : "border-pink-200/80 bg-pink-50/20"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`grid size-10 shrink-0 place-items-center rounded-xl shadow-2xs ${
                                isComplete
                                  ? "bg-teal-100 text-teal-700"
                                  : isCancelled
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-pink-100 text-pink-700"
                              }`}
                            >
                              {isComplete ? (
                                <CheckCircle2 className="size-5" />
                              ) : isCancelled ? (
                                <XCircle className="size-5" />
                              ) : (
                                <Music className="size-5" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-ink truncate">
                                  {lesson.piece?.title ?? "General Piano Lesson"}
                                </p>
                                {lesson.isOnline && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-teal-300 bg-teal-50 text-teal-700"
                                  >
                                    Online
                                  </Badge>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft mt-0.5">
                                <span>
                                  {new Date(lesson.date).toLocaleDateString(
                                    undefined,
                                    {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </span>
                                <span>·</span>
                                <span>
                                  {new Date(lesson.date).toLocaleTimeString(
                                    undefined,
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                                <span>·</span>
                                <span>
                                  {lesson.actualMin ?? lesson.duration} mins
                                </span>
                              </div>

                              {/* Show Cancel Reason if cancelled */}
                              {isCancelled && lesson.cancelReason && (
                                <p className="mt-1 text-xs text-rose-700 italic">
                                  Reason: &ldquo;{lesson.cancelReason}&rdquo;
                                </p>
                              )}

                              {/* Show Teacher lesson notes if complete */}
                              {isComplete && lesson.note && (
                                <p className="mt-1 text-xs text-ink-soft italic">
                                  Teacher note: &ldquo;{lesson.note}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="self-end sm:self-auto shrink-0 flex items-center gap-2">
                            {isComplete && (
                              <Badge className="rounded-full bg-teal-100 text-teal-800 border-transparent text-xs font-medium">
                                ✓ Completed
                              </Badge>
                            )}

                            {isCancelled && (
                              <Badge className="rounded-full bg-rose-100 text-rose-800 border-transparent text-xs font-medium">
                                ✕ Cancelled
                              </Badge>
                            )}

                            {isPending && (
                              <Badge className="rounded-full bg-pink-100 text-pink-700 border-transparent text-xs font-medium">
                                Scheduled
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
