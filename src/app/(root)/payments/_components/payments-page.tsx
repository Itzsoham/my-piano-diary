"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { useCurrency } from "@/lib/currency";
import { PaymentHistoryDialog } from "./payment-history-dialog";
import { PaymentTransactionDialog } from "./payment-transaction-dialog";
import { PaymentsTable } from "./payments-table";

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
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Track expected dues, partial payments, and full monthly settlements.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-pink-200 bg-linear-to-br from-rose-50 via-white to-pink-50 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-pink-700/80 uppercase">
            Total Expected
          </p>
          <p className="mt-2 text-2xl font-semibold text-pink-900">
            {isOverallSummaryPending
              ? "Calculating..."
              : formatCurrency(overallSummary?.totalExpected ?? 0, currency)}
          </p>
          <p className="mt-1 text-xs text-pink-700/70">
            All completed lessons till now
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-teal-50 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-emerald-700/80 uppercase">
            Total Received
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {isOverallSummaryPending
              ? "Calculating..."
              : formatCurrency(overallSummary?.totalReceived ?? 0, currency)}
          </p>
          <p className="mt-1 text-xs text-emerald-700/70">
            All payment transactions till now
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 via-white to-orange-50 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-amber-700/80 uppercase">
            Total Outstanding
          </p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">
            {isOverallSummaryPending
              ? "Calculating..."
              : formatCurrency(overallSummary?.totalOutstanding ?? 0, currency)}
          </p>
          <p className="mt-1 text-xs text-amber-700/70">
            Remaining due across all students
          </p>
        </div>
      </div>

      <p className="text-muted-foreground -mt-1 text-xs">
        Top cards show all-time totals. Filters below apply to the monthly
        table.
      </p>

      <div className="rounded-2xl border border-pink-100 bg-white/80 p-3 shadow-sm md:p-6">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-5 md:items-end md:gap-3">
          <div className="space-y-1 md:space-y-1.5">
            <Label className="text-xs font-medium text-pink-700">Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-11 border-pink-200 bg-pink-50 text-sm md:h-10">
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
            <Label className="text-xs font-medium text-pink-700">Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-11 border-pink-200 bg-pink-50 text-sm md:h-10">
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
            <Label className="text-xs font-medium text-pink-700">Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="h-11 border-pink-200 bg-pink-50 text-sm md:h-10">
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
            <Label className="text-xs font-medium text-pink-700">Status</Label>
            <Select
              value={status}
              onValueChange={(value: "all" | "UNPAID" | "PARTIAL" | "PAID") =>
                setStatus(value)
              }
            >
              <SelectTrigger className="h-11 border-pink-200 bg-pink-50 text-sm md:h-10">
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
            className="h-11 md:h-10"
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
