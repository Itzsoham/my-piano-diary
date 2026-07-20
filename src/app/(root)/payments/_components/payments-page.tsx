"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Blossom } from "@/components/blossom/blossom";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useFilterParams } from "@/lib/use-filter-params";
import { RefreshOverlay } from "@/components/ui/refresh-overlay";
import { api } from "@/trpc/react";
import { BirthdayBanner } from "@/components/birthday/birthday-banner";
import { useBirthday } from "@/components/birthday/birthday-provider";
import { useCurrency } from "@/lib/currency";
import { PaymentHistoryDialog } from "./payment-history-dialog";
import { PaymentTransactionDialog } from "./payment-transaction-dialog";
import { PaymentsTable } from "./payments-table";

// Smooth count-up hook (mirrors section-cards)
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Snap straight to 0 when there's nothing to count up to. Scheduling via rAF
    // (like the animation frames below) keeps the state update out of the effect
    // body, which a synchronous setValue(0) would violate.
    if (target === 0) {
      rafRef.current = requestAnimationFrame(() => setValue(0));
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

interface PaymentsPageContentProps {
  students: { id: string; name: string; avatar: string | null }[];
  defaultMonth: number;
  defaultYear: number;
}

export function PaymentsPageContent({
  students,
  defaultMonth,
  defaultYear,
}: PaymentsPageContentProps) {
  const { currency } = useCurrency();
  const { searchParams, setParams } = useFilterParams();

  // Filters live in the URL (shareable + SSR-consistent). Defaults come from the
  // server so "current month/year" renders identically on server and client.
  const month = searchParams.get("month") ?? defaultMonth.toString();
  const year = searchParams.get("year") ?? defaultYear.toString();
  const studentId = searchParams.get("studentId") ?? "all";
  const statusParam = searchParams.get("status");
  const status: "all" | "UNPAID" | "PARTIAL" | "PAID" =
    statusParam === "UNPAID" ||
    statusParam === "PARTIAL" ||
    statusParam === "PAID"
      ? statusParam
      : "all";
  const currentYear = defaultYear;

  const setMonth = (value: string) => setParams({ month: value });
  const setYear = (value: string) => setParams({ year: value });
  const setStudentId = (value: string) =>
    setParams({ studentId: value === "all" ? null : value });
  const setStatus = (value: string) =>
    setParams({ status: value === "all" ? null : value });

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addStudentId, setAddStudentId] = useState<string | undefined>(
    undefined,
  );
  const [historyStudentId, setHistoryStudentId] = useState<string | null>(null);

  const queryInput = useMemo(
    () => ({
      month: Number.parseInt(month, 10),
      year: Number.parseInt(year, 10),
      studentId: studentId === "all" ? undefined : studentId,
      status: status === "all" ? undefined : status,
    }),
    [month, year, studentId, status],
  );

  const {
    data: payments = [],
    isPending,
    isFetching,
  } = api.payment.getForMonth.useQuery(queryInput, {
    placeholderData: keepPreviousData,
  });

  // keepPreviousData keeps the current month's rows visible during a filter
  // refetch, so isPending stays false; surface the in-flight fetch instead.
  const isRefreshing = isFetching && !isPending;
  const { data: overallSummary, isPending: isOverallSummaryPending } =
    api.payment.getOverallSummary.useQuery();

  const { isBirthdayMode } = useBirthday();

  const totalExpected = overallSummary?.totalExpected ?? 0;
  const totalReceived = overallSummary?.totalReceived ?? 0;
  const totalOutstanding = overallSummary?.totalOutstanding ?? 0;

  const animatedExpected = useCountUp(isBirthdayMode ? totalExpected : 0);
  const animatedReceived = useCountUp(isBirthdayMode ? totalReceived : 0);
  const animatedOutstanding = useCountUp(isBirthdayMode ? totalOutstanding : 0);

  // A candy tile per KPI — mirrors dashboard's SectionCards pattern exactly: the
  // frame blooms (corner blossom, wash background), the figure itself stays
  // sober — undecorated, tabular, in its family ink. Old rose/emerald/amber wash
  // maps onto pink / ok(teal) / wait(sand) token families respectively. Note this
  // is a DIFFERENT mapping than the per-row derived status pill below (which maps
  // UNPAID→no): these three tiles are all-time rollups, not individual dues, so
  // "Outstanding" here reads as a softer wait/sand tone rather than an alarm.
  const summaryCards: Array<{
    title: string;
    rawValue: number;
    animatedValue: number;
    subtitle: string;
    washBg: string;
    borderClass: string;
    labelClass: string;
    valueClass: string;
    bloomClass: string;
    ruleStyle: React.CSSProperties;
    glowDelay: string;
    bdaySubtitle: string;
  }> = [
    {
      title: "Total Expected",
      rawValue: totalExpected,
      animatedValue: animatedExpected,
      subtitle: "All completed lessons till now",
      washBg: "linear-gradient(160deg, var(--pink-100), var(--surface) 70%)",
      borderClass: "border-pink-200/70",
      labelClass: "text-pink-700",
      valueClass: "text-ink",
      bloomClass: "text-bubblegum opacity-50",
      ruleStyle: { background: "var(--grad-pink)" },
      glowDelay: "0s",
      bdaySubtitle: "Your hard work is blooming 🌸",
    },
    {
      title: "Total Received",
      rawValue: totalReceived,
      animatedValue: animatedReceived,
      subtitle: "All payment transactions till now",
      washBg: "linear-gradient(160deg, var(--teal-100), var(--surface) 70%)",
      borderClass: "border-teal-200/70",
      labelClass: "text-ok-fg",
      valueClass: "text-ok-fg",
      bloomClass: "text-ok-dot opacity-60",
      ruleStyle: {
        background: "linear-gradient(90deg, var(--wintergreen), var(--mint))",
      },
      glowDelay: "0.75s",
      bdaySubtitle: "Every penny counts 💚",
    },
    {
      title: "Total Outstanding",
      rawValue: totalOutstanding,
      animatedValue: animatedOutstanding,
      subtitle: "Remaining due across all students",
      washBg: "linear-gradient(160deg, var(--sand-100), var(--surface) 70%)",
      borderClass: "border-sand-300/60",
      labelClass: "text-wait-fg",
      valueClass: "text-wait-fg",
      bloomClass: "text-wait-dot opacity-70",
      ruleStyle: {
        background: "linear-gradient(90deg, var(--sand-300), var(--cotton))",
      },
      glowDelay: "1.5s",
      bdaySubtitle: "Almost there, keep going 🎹",
    },
  ];

  const yearOptions = Array.from(
    { length: 5 },
    (_, index) => currentYear - 2 + index,
  );

  const selectedHistoryStudent =
    students.find((student) => student.id === historyStudentId) ?? null;

  // Status-count badges below the filter bar — derived the same way the table's
  // own status pills are, just tallied across the current month's rows.
  const unpaidCount = payments.filter(
    (payment) => payment.status === "UNPAID",
  ).length;
  const partialCount = payments.filter(
    (payment) => payment.status === "PARTIAL",
  ).length;
  const paidCount = payments.filter(
    (payment) => payment.status === "PAID",
  ).length;

  return (
    <div className="flex flex-1 flex-col gap-6 md:gap-8">
      {/* Summary — the h1/subtitle header now lives in payments-hero.tsx; this
          screen starts straight at the three candy tiles. page.tsx already
          supplies the px-4 lg:px-6 gutter AND the pb-6/md:pb-10 bottom
          padding around this whole component (see the page-shell pattern in
          dashboard/page.tsx, where sibling sections like SectionCards carry
          no bottom padding of their own) — so nothing below re-applies its
          own horizontal padding or bottom padding. */}
      <div>
        <BirthdayBanner
          text="Your hard work deserves every penny 🌸"
          icon="🌸"
          storageKey="payments"
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {summaryCards.map((card, index) => {
            const displayValue = isOverallSummaryPending
              ? "Calculating..."
              : formatCurrency(
                  isBirthdayMode ? card.animatedValue : card.rawValue,
                  currency,
                );

            const cardStyle = {
              "--i": index,
              background: card.washBg,
              ...(isBirthdayMode
                ? {
                    animation: "bday-glow-pulse 3s ease-in-out infinite",
                    animationDelay: card.glowDelay,
                  }
                : {}),
            } as React.CSSProperties;

            return (
              <Card
                key={card.title}
                style={cardStyle}
                className={cn(
                  "rise relative flex min-h-42 flex-col overflow-hidden rounded-[calc(var(--radius)+8px)] border p-5 shadow-(--sh)",
                  card.borderClass,
                )}
              >
                {/* Corner blossom — the tile's single family ornament (decorative). */}
                <Blossom
                  size={58}
                  className={cn(
                    "absolute -top-2.5 -right-2.5 z-0",
                    card.bloomClass,
                  )}
                />

                <div className="relative z-10 flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "pr-11 text-[11px] font-semibold tracking-[0.08em] uppercase",
                      card.labelClass,
                    )}
                  >
                    {card.title}
                  </span>

                  {/* The data layer — sober, tabular, never ornamented. */}
                  <div className="mt-2.5 flex flex-1 flex-col">
                    <span
                      className={cn(
                        "text-[1.5rem] leading-tight font-semibold tracking-tight break-words tabular-nums",
                        card.valueClass,
                      )}
                    >
                      {displayValue}
                    </span>

                    <span className="text-ink-soft mt-1 text-xs">
                      {card.subtitle}
                    </span>

                    {isBirthdayMode && (
                      <span className="text-muted-foreground mt-1.5 text-[11px] italic">
                        {card.bdaySubtitle}
                      </span>
                    )}

                    <div className="mt-auto pt-4" aria-hidden="true">
                      <span
                        className="block h-0.75 rounded-full"
                        style={card.ruleStyle}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <p className="text-ink-soft mt-4 text-xs">
          Top cards show all-time totals. Filters below apply to the monthly
          table.
        </p>
      </div>

      {/* Filter bar */}
      <div
        className="rise rounded-2xl border border-pink-100 bg-[linear-gradient(160deg,var(--pink-50),var(--surface)_75%)] p-3 shadow-(--sh-sm) md:p-6"
        style={{ "--i": 3 } as React.CSSProperties}
      >
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-5 md:items-end md:gap-3">
          <div className="space-y-1 md:space-y-1.5">
            <label className="text-xs font-medium text-pink-700">Month</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-11 w-full rounded-full border-pink-200 bg-pink-50 text-sm hover:bg-pink-100 focus:ring-pink-400 md:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (value) => (
                    <SelectItem key={value} value={value.toString()}>
                      Month {value}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 md:space-y-1.5">
            <label className="text-xs font-medium text-pink-700">Year</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-11 w-full rounded-full border-pink-200 bg-pink-50 text-sm hover:bg-pink-100 focus:ring-pink-400 md:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 md:space-y-1.5">
            <label className="text-xs font-medium text-pink-700">Student</label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="h-11 w-full rounded-full border-pink-200 bg-pink-50 text-sm hover:bg-pink-100 focus:ring-pink-400 md:h-10">
                <SelectValue placeholder="All students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 md:space-y-1.5">
            <label className="text-xs font-medium text-pink-700">Status</label>
            <Select
              value={status}
              onValueChange={(value: "all" | "UNPAID" | "PARTIAL" | "PAID") =>
                setStatus(value)
              }
            >
              <SelectTrigger className="h-11 w-full rounded-full border-pink-200 bg-pink-50 text-sm hover:bg-pink-100 focus:ring-pink-400 md:h-10">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="UNPAID">UNPAID</SelectItem>
                <SelectItem value="PARTIAL">PARTIAL</SelectItem>
                <SelectItem value="PAID">PAID</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="bday-animate-button h-11 w-full rounded-full shadow-(--sh-pink) md:h-10"
            onClick={() => {
              if (studentId === "all") {
                setAddStudentId(undefined);
              } else {
                setAddStudentId(studentId);
              }
              setShowAddDialog(true);
            }}
          >
            <WalletCards className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Payment
          </Button>
        </div>

        {/* Status counts — informational tallies, not filter controls (the
              Status select above drives the actual filter). Mapped onto the
              same visual vocabulary as the table's derived status pills:
              UNPAID→no, PARTIAL→wait, PAID→ok. */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="bg-no-bg text-no-fg hover:bg-no-bg gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold">
            <span
              aria-hidden="true"
              className="bg-no-dot size-2 rounded-full"
            />
            <span className="tabular-nums">{unpaidCount}</span> unpaid
          </Badge>
          <Badge className="bg-wait-bg text-wait-fg hover:bg-wait-bg gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold">
            <span
              aria-hidden="true"
              className="bg-wait-dot size-2 rounded-full"
            />
            <span className="tabular-nums">{partialCount}</span> partial
          </Badge>
          <Badge className="bg-ok-bg text-ok-fg hover:bg-ok-bg gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold">
            <span
              aria-hidden="true"
              className="bg-ok-dot size-2 rounded-full"
            />
            <span className="tabular-nums">{paidCount}</span> paid
          </Badge>
        </div>
      </div>

      {/* Table — untouched beyond its wiring; strictly sober data layer. */}
      <div
        className="rise relative"
        style={{ "--i": 4 } as React.CSSProperties}
      >
        <RefreshOverlay active={isRefreshing} />
        <div
          className={cn(
            "transition-opacity",
            isRefreshing && "pointer-events-none opacity-60",
          )}
        >
          <PaymentsTable
            payments={payments}
            isLoading={isPending}
            onAddPayment={(nextStudentId) => {
              setAddStudentId(nextStudentId);
              setShowAddDialog(true);
            }}
            onViewHistory={(nextStudentId) =>
              setHistoryStudentId(nextStudentId)
            }
          />
        </div>
      </div>

      <PaymentTransactionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        month={queryInput.month}
        year={queryInput.year}
        students={students}
        payments={payments}
        initialStudentId={addStudentId}
      />

      <PaymentHistoryDialog
        open={!!historyStudentId}
        onOpenChange={(open) => {
          if (!open) {
            setHistoryStudentId(null);
          }
        }}
        studentId={historyStudentId ?? ""}
        studentName={selectedHistoryStudent?.name ?? "Student"}
      />
    </div>
  );
}
