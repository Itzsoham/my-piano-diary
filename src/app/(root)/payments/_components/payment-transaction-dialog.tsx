"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { HandCoins, Info } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { useCurrency } from "@/lib/currency";

const MONTH_NAMES = [
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
] as const;

interface PaymentTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: number;
  year: number;
  students: { id: string; name: string; avatar: string | null }[];
  payments: {
    studentId: string;
    expectedAmount: number;
    remainingAmount: number;
  }[];
  initialStudentId?: string;
}

export function PaymentTransactionDialog({
  open,
  onOpenChange,
  month,
  year,
  students,
  payments,
  initialStudentId,
}: PaymentTransactionDialogProps) {
  const utils = api.useUtils();
  const { currency } = useCurrency();
  const [studentId, setStudentId] = useState(initialStudentId ?? "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (open) {
      setStudentId(initialStudentId ?? "");
    }
  }, [open, initialStudentId]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === studentId),
    [students, studentId],
  );

  const selectedPayment = useMemo(
    () => payments.find((p) => p.studentId === studentId),
    [payments, studentId],
  );

  const expectedAmount = selectedPayment?.expectedAmount ?? 0;
  const remainingAmount = selectedPayment?.remainingAmount ?? 0;
  // True only when this student's billing month actually came back from
  // getForMonth. That query is status-filtered, so a student chosen from the
  // full roster while e.g. the Paid filter is active can resolve to no match
  // here — guards the hint below from asserting "fully settled" on absent data.
  const hasPaymentData = Boolean(selectedPayment);

  // Live preview of the derived arithmetic only — the amount parsing and
  // validation used at submit time (handleSubmit below) is unchanged.
  const amountPreview = Number.parseInt(amount, 10);
  const outstandingAfter = Math.max(
    remainingAmount - (Number.isFinite(amountPreview) ? amountPreview : 0),
    0,
  );
  const isSettled = outstandingAfter <= 0;

  const addTransaction = api.payment.addTransaction.useMutation({
    onSuccess: async () => {
      toast.success("Payment recorded");
      setAmount("");
      setMethod("");
      setNote("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      onOpenChange(false);
      await utils.payment.getForMonth.invalidate();
      await utils.payment.getUnpaidSummary.invalidate();
      await utils.payment.getOverallSummary.invalidate();
      await utils.earnings.getDashboard.invalidate();
      if (studentId) {
        await utils.payment.getStudentHistory.invalidate({
          studentId,
          limit: 12,
        });
      }
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to record payment");
    },
  });

  const handleSubmit = () => {
    if (!studentId) {
      toast.error("Please select a student");
      return;
    }

    const parsedAmount = Number.parseInt(amount, 10);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    addTransaction.mutate({
      studentId,
      month,
      year,
      amount: parsedAmount,
      method: method || undefined,
      note: note || undefined,
      date: date || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card gap-0 overflow-hidden rounded-3xl p-0 shadow-(--sh-xl) sm:max-w-lg">
        {/* Header — the screen's one permitted header touch: a grad-pink icon
            badge (never purple). Everything below it stays sober. */}
        <DialogHeader className="border-border relative flex-row items-start gap-3 space-y-0 border-b bg-[linear-gradient(150deg,var(--pink-50),var(--surface)_70%)] px-5 py-4 text-left sm:px-6 sm:py-5">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full [background-image:var(--grad-pink)] text-white shadow-(--sh-pink)"
          >
            <HandCoins className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 pr-6">
            <DialogTitle className="text-ink font-serif text-lg leading-tight font-semibold">
              Record payment
            </DialogTitle>
            <DialogDescription className="text-ink-soft mt-0.5 text-xs">
              Creates a payment for {MONTH_NAMES[month - 1]} {year}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="grid gap-4 px-5 py-4 sm:px-6">
          <div className="space-y-1.5">
            <Label
              htmlFor="txn-student"
              className="text-ink text-xs font-semibold"
            >
              Student
            </Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger
                id="txn-student"
                className="w-full border-pink-200 bg-pink-50/60 focus-visible:border-pink-400 focus-visible:ring-pink-400/40"
              >
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStudent && (
            <div className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-pink-50/70 px-3 py-2.5">
              <Avatar className="size-9 border border-pink-200">
                <AvatarImage src={selectedStudent.avatar ?? ""} alt="" />
                <AvatarFallback className="bg-pink-100 text-xs font-bold text-pink-700">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-sm font-semibold">
                  {selectedStudent.name}
                </p>
                <p className="text-ink-soft text-xs">
                  Billing month · {MONTH_NAMES[month - 1]} {year}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-pink-700 tabular-nums">
                  {formatCurrency(expectedAmount, currency)}
                </p>
                <p className="text-ink-soft text-[11px]">expected</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="txn-amount"
              className="text-ink text-xs font-semibold"
            >
              Amount{" "}
              <span className="text-ink-soft font-normal">· {currency}</span>
            </Label>
            <Input
              id="txn-amount"
              inputMode="numeric"
              placeholder="Enter amount"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value.replace(/[^0-9]/g, ""))
              }
              className="border-pink-200 bg-pink-50/40 text-base font-bold tabular-nums focus-visible:border-pink-400 focus-visible:ring-pink-400/40"
            />
          </div>

          {/* The derived arithmetic, live: expected/remaining minus what's being
              entered — not just a status pill. aria-live only (not also wired
              to the input's aria-describedby, which would double-announce). */}
          {selectedStudent && (
            <p
              aria-live="polite"
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold",
                !hasPaymentData
                  ? "bg-floss text-ink-soft"
                  : isSettled
                    ? "bg-ok-bg text-ok-fg"
                    : "bg-wait-bg text-wait-fg",
              )}
            >
              <Info className="size-4 shrink-0" aria-hidden="true" />
              {hasPaymentData ? (
                <span>
                  Outstanding after this:{" "}
                  <b className="tabular-nums">
                    {formatCurrency(outstandingAfter, currency)}
                  </b>
                  {isSettled ? " — fully settled" : ""}
                </span>
              ) : (
                <span>
                  Billing figures are not available under the current filter —
                  this payment will still record correctly.
                </span>
              )}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="txn-date"
                className="text-ink text-xs font-semibold"
              >
                Date
              </Label>
              <Input
                id="txn-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="border-pink-200 bg-pink-50/40 tabular-nums focus-visible:border-pink-400 focus-visible:ring-pink-400/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="txn-method"
                className="text-ink text-xs font-semibold"
              >
                Method{" "}
                <span className="text-ink-soft font-normal">· optional</span>
              </Label>
              <Input
                id="txn-method"
                placeholder="Cash, transfer, etc."
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                className="border-pink-200 bg-pink-50/40 focus-visible:border-pink-400 focus-visible:ring-pink-400/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="txn-note"
              className="text-ink text-xs font-semibold"
            >
              Note <span className="text-ink-soft font-normal">· optional</span>
            </Label>
            <Textarea
              id="txn-note"
              placeholder="Add note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-20 border-pink-200 bg-pink-50/40 focus-visible:border-pink-400 focus-visible:ring-pink-400/40"
            />
          </div>
        </div>

        <DialogFooter className="border-border bg-floss border-t px-5 py-4 sm:px-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border bg-card text-ink hover:bg-floss rounded-full shadow-[var(--sh-xs)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={addTransaction.isPending}
            className="rounded-full [background-image:var(--grad-pink)] text-white shadow-[var(--sh-pink)] hover:brightness-105"
          >
            {addTransaction.isPending ? "Saving..." : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
