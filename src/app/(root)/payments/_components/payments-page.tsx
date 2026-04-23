"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  TrendingUp,
  Wallet,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

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
import { formatCurrency } from "@/lib/format";
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
    if (target === 0) {
      setValue(0);
      return;
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
}

const STORAGE_KEY = "payments-filters";

export function PaymentsPageContent({ students }: PaymentsPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency } = useCurrency();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const [month, setMonth] = useState((currentDate.getMonth() + 1).toString());
  const [year, setYear] = useState(currentYear.toString());
  const [studentId, setStudentId] = useState("all");
  const [status, setStatus] = useState<"all" | "UNPAID" | "PARTIAL" | "PAID">(
    "all",
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addStudentId, setAddStudentId] = useState<string | undefined>(
    undefined,
  );
  const [historyStudentId, setHistoryStudentId] = useState<string | null>(null);

  useEffect(() => {
    const urlMonth = searchParams.get("month");
    const urlYear = searchParams.get("year");
    const urlStudentId = searchParams.get("studentId");
    const urlStatus = searchParams.get("status");

    if (urlMonth && Number(urlMonth) >= 1 && Number(urlMonth) <= 12) {
      setMonth(urlMonth);
    }
    if (urlYear && Number(urlYear) >= 2000 && Number(urlYear) <= 2100) {
      setYear(urlYear);
    }
    if (urlStudentId) {
      setStudentId(urlStudentId);
    }
    if (urlStatus && ["UNPAID", "PARTIAL", "PAID"].includes(urlStatus)) {
      setStatus(urlStatus as "UNPAID" | "PARTIAL" | "PAID");
    }

    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!urlMonth && !urlYear && saved) {
      try {
        const parsed = JSON.parse(saved) as {
          month?: string;
          year?: string;
          studentId?: string;
          status?: "all" | "UNPAID" | "PARTIAL" | "PAID";
        };
        if (parsed.month) setMonth(parsed.month);
        if (parsed.year) setYear(parsed.year);
        if (parsed.studentId) setStudentId(parsed.studentId);
        if (parsed.status) setStatus(parsed.status);
      } catch (error) {
        console.error("Failed to parse saved payment filters", error);
      }
    }

    setIsLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        month,
        year,
        studentId,
        status,
      }),
    );

    const query = new URLSearchParams();
    query.set("month", month);
    query.set("year", year);
    if (studentId !== "all") {
      query.set("studentId", studentId);
    }
    if (status !== "all") {
      query.set("status", status);
    }

    router.replace(`?${query.toString()}`);
  }, [isLoaded, month, year, studentId, status, router]);

  const queryInput = useMemo(
    () => ({
      month: Number.parseInt(month, 10),
      year: Number.parseInt(year, 10),
      studentId: studentId === "all" ? undefined : studentId,
      status: status === "all" ? undefined : status,
    }),
    [month, year, studentId, status],
  );

  const { data: payments = [], isPending } = api.payment.getForMonth.useQuery(
    queryInput,
    {
      placeholderData: keepPreviousData,
    },
  );
  const { data: overallSummary, isPending: isOverallSummaryPending } =
    api.payment.getOverallSummary.useQuery();

  const { isBirthdayMode } = useBirthday();

  const totalExpected = overallSummary?.totalExpected ?? 0;
  const totalReceived = overallSummary?.totalReceived ?? 0;
  const totalOutstanding = overallSummary?.totalOutstanding ?? 0;

  const animatedExpected = useCountUp(isBirthdayMode ? totalExpected : 0);
  const animatedReceived = useCountUp(isBirthdayMode ? totalReceived : 0);
  const animatedOutstanding = useCountUp(isBirthdayMode ? totalOutstanding : 0);

  const summaryCards: Array<{
    title: string;
    rawValue: number;
    animatedValue: number;
    subtitle: string;
    shell: string;
    hoverShadow: string;
    borderClass: string;
    titleClass: string;
    valueClass: string;
    icon: LucideIcon;
    glowDelay: string;
    bdaySubtitle: string;
  }> = [
    {
      title: "Total Expected",
      rawValue: totalExpected,
      animatedValue: animatedExpected,
      subtitle: "All completed lessons till now",
      shell:
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,238,243,0.94),rgba(255,247,251,0.98))]",
      hoverShadow: "hover:shadow-[0_15px_30px_-12px_rgba(225,29,72,0.15)]",
      borderClass: "border-rose-200/80",
      titleClass: "text-rose-500",
      valueClass: "text-rose-600",
      icon: Wallet,
      glowDelay: "0s",
      bdaySubtitle: "Your hard work is blooming 🌸",
    },
    {
      title: "Total Received",
      rawValue: totalReceived,
      animatedValue: animatedReceived,
      subtitle: "All payment transactions till now",
      shell:
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(236,253,245,0.95),rgba(248,255,252,0.98))]",
      hoverShadow: "hover:shadow-[0_15px_30px_-12px_rgba(5,150,105,0.15)]",
      borderClass: "border-emerald-200/80",
      titleClass: "text-emerald-600",
      valueClass: "text-emerald-600",
      icon: TrendingUp,
      glowDelay: "0.75s",
      bdaySubtitle: "Every penny counts 💚",
    },
    {
      title: "Total Outstanding",
      rawValue: totalOutstanding,
      animatedValue: animatedOutstanding,
      subtitle: "Remaining due across all students",
      shell:
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,251,235,0.96),rgba(255,247,237,0.98))]",
      hoverShadow: "hover:shadow-[0_15px_30px_-12px_rgba(217,119,6,0.15)]",
      borderClass: "border-amber-200/80",
      titleClass: "text-amber-600",
      valueClass: "text-amber-500",
      icon: Clock,
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

  return (
    <div className="flex flex-1 flex-col gap-6">
      <BirthdayBanner
        text="Your hard work deserves every penny 🌸"
        icon="🌸"
        storageKey="payments"
      />
      <div>
        <h1 className="bday-animate-title text-3xl font-bold tracking-tight">
          Payments
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Track expected dues, partial payments, and full monthly settlements.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const displayValue = isOverallSummaryPending
            ? "Calculating..."
            : formatCurrency(
                isBirthdayMode ? card.animatedValue : card.rawValue,
                currency,
              );

          return (
            <Card
              key={card.title}
              className={`overflow-hidden rounded-[2rem] border ${card.borderClass} backdrop-blur-xl transition-all duration-300 ease-out hover:shadow-xs ${card.hoverShadow} ${card.shell}`}
              style={
                isBirthdayMode
                  ? {
                      animation: `bday-glow-pulse 3s ease-in-out infinite`,
                      animationDelay: card.glowDelay,
                    }
                  : undefined
              }
            >
              <div className="flex h-full flex-col items-start justify-start p-8">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-5 shrink-0 items-center justify-center ${card.titleClass}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <p
                    className={`text-xs font-medium tracking-wide uppercase opacity-70 ${card.titleClass}`}
                  >
                    {card.title}
                  </p>
                </div>
                <p
                  className={`mt-3 text-[2rem] font-semibold tracking-tight tabular-nums ${card.valueClass}`}
                >
                  {displayValue}
                </p>
                <p className={`mt-1 text-xs opacity-60 ${card.titleClass}`}>
                  {card.subtitle}
                </p>
                {isBirthdayMode && (
                  <p className="text-muted-foreground/70 mt-1.5 text-[11px] italic">
                    {card.bdaySubtitle}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-muted-foreground -mt-1 text-xs">
        Top cards show all-time totals. Filters below apply to the monthly
        table.
      </p>

      <div className="rounded-2xl border border-pink-100 bg-white/80 p-3 shadow-sm md:p-6">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-5 md:items-end md:gap-3">
          <div className="space-y-1 md:space-y-1.5">
            <label className="text-xs font-medium text-pink-700">Month</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-11 w-full border-pink-200 bg-pink-50 text-sm focus:ring-pink-400 md:h-10">
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
              <SelectTrigger className="h-11 w-full border-pink-200 bg-pink-50 text-sm focus:ring-pink-400 md:h-10">
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
              <SelectTrigger className="h-11 w-full border-pink-200 bg-pink-50 text-sm focus:ring-pink-400 md:h-10">
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
              <SelectTrigger className="h-11 w-full border-pink-200 bg-pink-50 text-sm focus:ring-pink-400 md:h-10">
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
            variant="outline"
            className="bday-animate-button h-11 w-full rounded-xl border-pink-200 text-pink-600 hover:bg-pink-100 md:h-10 md:w-full"
            onClick={() => {
              if (studentId === "all") {
                setAddStudentId(undefined);
              } else {
                setAddStudentId(studentId);
              }
              setShowAddDialog(true);
            }}
          >
            <WalletCards className="mr-2 h-4 w-4" />
            Add Payment
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
            {payments.filter((payment) => payment.status === "UNPAID").length}{" "}
            unpaid
          </Badge>
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            {payments.filter((payment) => payment.status === "PARTIAL").length}{" "}
            partial
          </Badge>
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            {payments.filter((payment) => payment.status === "PAID").length}{" "}
            paid
          </Badge>
        </div>
      </div>

      <PaymentsTable
        payments={payments}
        isLoading={isPending}
        onAddPayment={(nextStudentId) => {
          setAddStudentId(nextStudentId);
          setShowAddDialog(true);
        }}
        onViewHistory={(nextStudentId) => setHistoryStudentId(nextStudentId)}
      />

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
