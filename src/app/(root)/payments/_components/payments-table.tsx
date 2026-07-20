"use client";

import { type CSSProperties } from "react";
import { format } from "date-fns";
import { History, MoreHorizontal, WalletCards } from "lucide-react";

import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrency, type CurrencyCode } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/trpc/react";

type PaymentRow = RouterOutputs["payment"]["getForMonth"][number];
type PaymentStatus = PaymentRow["status"];

interface PaymentsTableProps {
  payments: PaymentRow[];
  isLoading: boolean;
  onAddPayment: (studentId: string) => void;
  onViewHistory: (studentId: string) => void;
}

// Status -> the shared ok/wait/no vocabulary (§Contract), never a 4th state.
// UNPAID reads "Outstanding" everywhere a teacher sees it on this screen — the
// same word the summary tile and filter chip above this table use. A Record
// (not a fallback) so a new status added to the enum fails typecheck here
// instead of silently rendering blank.
const STATUS_STYLES: Record<PaymentStatus, { label: string; badge: string }> = {
  PAID: { label: "Paid", badge: "bg-ok-bg text-ok-fg" },
  PARTIAL: { label: "Partial", badge: "bg-wait-bg text-wait-fg" },
  UNPAID: { label: "Outstanding", badge: "bg-no-bg text-no-fg" },
};

const plural = (count: number) => (count === 1 ? "" : "s");

// Percent of `expected` that `received` covers — a display-only derivation for
// the progress bar and its caption. The authoritative figures (expectedAmount,
// receivedAmount, remainingAmount, status) always come straight off the row,
// never recomputed here.
function collectedPercent(expected: number, received: number) {
  if (expected <= 0) return received > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, Math.round((received / expected) * 100)));
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Avatar + name — identical in the table row and the phone card. */
function StudentIdentity({ student }: { student: PaymentRow["student"] }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar className="border-card size-8 shrink-0 border-2 shadow-[var(--sh-sm)]">
        <AvatarImage src={student.avatar ?? ""} alt="" />
        <AvatarFallback className="text-mint-ink [background-image:var(--grad-brand)] text-[11px] font-bold">
          {initialsOf(student.name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-ink max-w-[150px] truncate text-[13.5px] font-semibold">
        {student.name}
      </span>
    </div>
  );
}

/** The collected/expected track. Purely decorative — the number beside it
    (and the caption under it) already say the same thing in text. */
function CollectedBar({ pct }: { pct: number }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none block h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]"
    >
      <span
        className="block h-full rounded-full [background:var(--grad-mint)]"
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}

/** The desktop "Collected" cell: money, bar, and the percent it represents —
    the derivation made legible instead of a bare figure. */
function CollectedFigure({
  expected,
  received,
  currency,
}: {
  expected: number;
  received: number;
  currency: CurrencyCode;
}) {
  const pct = collectedPercent(expected, received);
  return (
    <div className="ml-auto flex w-full max-w-36 flex-col items-end gap-1.5">
      <span
        className={cn(
          "text-[13.5px] font-semibold tabular-nums",
          received > 0 ? "text-ink" : "text-ink-soft",
        )}
      >
        {formatCurrency(received, currency)}
      </span>
      <CollectedBar pct={pct} />
      <span className="text-ink-soft text-[10.5px] font-semibold tabular-nums">
        {pct}% of expected
      </span>
    </div>
  );
}

/** A single Expected/Collected/Outstanding figure for the phone card grid. */
function MoneyPcell({
  label,
  amount,
  currency,
  due = false,
}: {
  label: string;
  amount: number;
  currency: CurrencyCode;
  due?: boolean;
}) {
  const isDue = due && amount > 0;
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl px-2.5 py-2",
        isDue ? "bg-no-bg" : "bg-[var(--surface-2)]",
      )}
    >
      <span
        className={cn(
          "text-[10px] font-semibold tracking-[0.1em] uppercase",
          isDue ? "text-no-fg" : "text-ink-soft",
        )}
      >
        {label}
      </span>
      <b
        className={cn(
          "text-[13px] font-bold tabular-nums",
          isDue ? "text-pink-700" : "text-ink",
        )}
      >
        {formatCurrency(amount, currency)}
      </b>
    </div>
  );
}

/** The squared, left-ruled derived badge — deliberately NOT the pill `Badge`
    shape reserved for the real LessonStatus enum elsewhere in the app. */
function DerivedStatusBadge({ status }: { status: PaymentStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] border-l-[3px] border-current px-2.5 py-1.5 text-[11.5px] font-bold whitespace-nowrap",
        style.badge,
      )}
    >
      {style.label}
    </span>
  );
}

function LastPaymentCell({
  transaction,
}: {
  transaction: PaymentRow["transactions"][number] | undefined;
}) {
  if (!transaction) {
    return (
      <div className="leading-tight">
        <div className="text-ink-soft text-[12.5px] font-semibold">
          No payments yet
        </div>
        <div className="text-ink-soft text-[11px]">—</div>
      </div>
    );
  }

  return (
    <div className="leading-tight">
      <div className="text-ink text-[12.5px] font-semibold tabular-nums">
        {format(new Date(transaction.date), "MMM d")}
      </div>
      <div className="text-ink-soft text-[11px]">
        {transaction.method ?? "—"}
      </div>
    </div>
  );
}

/** The caption that explains the derivation — ported near-verbatim from the
    mockup's `.derivation` box (public/design-mockups/payments.html), and kept
    word-for-word accurate to `derivePaymentStatus` in src/lib/payment.ts. */
function DerivationNote() {
  return (
    <div className="text-ink-soft rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3.5 text-[12.5px] leading-relaxed">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <code className="rounded-[8px] border border-[var(--line-strong)] bg-[var(--surface)] px-2 py-1 font-sans text-[11px] font-semibold text-teal-700 tabular-nums">
          expected = Σ Lesson.rate (COMPLETE)
        </code>
        <span aria-hidden="true">·</span>
        <code className="rounded-[8px] border border-[var(--line-strong)] bg-[var(--surface)] px-2 py-1 font-sans text-[11px] font-semibold text-teal-700 tabular-nums">
          collected = Σ PaymentTransaction.amount
        </code>
        <span aria-hidden="true">·</span>
        <code className="rounded-[8px] border border-[var(--line-strong)] bg-[var(--surface)] px-2 py-1 font-sans text-[11px] font-semibold text-teal-700 tabular-nums">
          outstanding = max(expected - collected, 0)
        </code>
      </p>
      <p className="mt-2.5">
        <b className="text-ink">
          Paid · Partial · Outstanding are derived, not stored.
        </b>{" "}
        There is no payment-status column in the database — every label here is
        recomputed live from the two sums above (Paid = collected ≥ expected ·
        Partial = some collected, less than expected · Outstanding = nothing
        collected yet).
      </p>
      <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <DerivedStatusBadge status="PAID" />
        <DerivedStatusBadge status="PARTIAL" />
        <DerivedStatusBadge status="UNPAID" />
      </p>
    </div>
  );
}

/**
 * The payments data table — Blossom Diary's "tuition sheet". Ported from
 * public/design-mockups/payments.html: a real table (thead/tbody/tfoot) at
 * md+ widths, the same rows as cards on phones, and a caption underneath
 * explaining that Paid/Partial/Outstanding are computed live from
 * expectedAmount vs Σ PaymentTransaction.amount — never stored.
 *
 * The data layer stays strictly sober (tabular-nums, no ornament, no emoji on
 * amounts). The only ornament here is the heading's small Blossom and Mochi in
 * the empty state.
 */
export function PaymentsTable({
  payments,
  isLoading,
  onAddPayment,
  onViewHistory,
}: PaymentsTableProps) {
  const { currency } = useCurrency();

  if (isLoading) {
    return (
      <Card
        role="status"
        aria-live="polite"
        className="flex flex-col gap-4 rounded-[calc(var(--radius)+8px)] px-4 py-5 shadow-[var(--sh)] sm:px-6 sm:py-6"
      >
        <span className="sr-only">Loading payments…</span>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex flex-col gap-3" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-2xl border border-[var(--line)] p-3"
            >
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-24 sm:w-32" />
              <Skeleton className="ml-auto hidden h-4 w-16 sm:block" />
              <Skeleton className="hidden h-4 w-16 md:block" />
              <Skeleton className="h-6 w-20 rounded-[8px]" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card
        className="border-bubblegum flex flex-col items-center gap-1.5 rounded-[calc(var(--radius)+8px)] border-2 border-dashed px-6 py-10 text-center shadow-none sm:py-14"
        style={{
          background: "color-mix(in srgb, var(--surface) 70%, transparent)",
        }}
      >
        <Mochi mood="sleepy" bob size={116} />
        <p className="text-ink mt-2 text-base font-semibold">
          No payment records
        </p>
        <p className="text-ink-soft max-w-[40ch] text-sm">
          Try another month, student, or status filter.
        </p>
      </Card>
    );
  }

  const totals = payments.reduce(
    (acc, payment) => {
      acc.expected += payment.expectedAmount;
      acc.received += payment.receivedAmount;
      acc.remaining += payment.remainingAmount;
      return acc;
    },
    { expected: 0, received: 0, remaining: 0 },
  );
  const paidCount = payments.filter(
    (payment) => payment.status === "PAID",
  ).length;

  return (
    <Card className="flex flex-col gap-4 rounded-[calc(var(--radius)+8px)] px-4 py-5 shadow-[var(--sh)] sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-ink flex items-center gap-2 font-serif text-xl font-normal sm:text-[1.35rem]">
            <Blossom size={16} className="text-bubblegum" />
            Tuition sheet
          </h2>
          <p className="text-ink-soft mt-1 text-[12.5px]">
            {payments.length} student{plural(payments.length)} billed this month
          </p>
        </div>
        <p className="text-ink-soft text-[12.5px]">
          Amounts in {currency} · frozen lesson rates
        </p>
      </div>

      {/* Tablet-landscape and up: the real sheet. */}
      <div className="hidden md:block">
        <Table className="min-w-[920px]">
          <TableCaption className="sr-only">
            Tuition for the selected month: expected, collected, and outstanding
            amounts per student, with the derived payment status.
          </TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                scope="col"
                className="text-ink-soft text-[11px] font-semibold tracking-[0.14em] uppercase"
              >
                Student
              </TableHead>
              <TableHead
                scope="col"
                className="text-ink-soft text-right text-[11px] font-semibold tracking-[0.14em] uppercase"
              >
                Expected
              </TableHead>
              <TableHead
                scope="col"
                className="text-ink-soft text-right text-[11px] font-semibold tracking-[0.14em] uppercase"
              >
                Collected
              </TableHead>
              <TableHead
                scope="col"
                className="text-ink-soft text-right text-[11px] font-semibold tracking-[0.14em] uppercase"
              >
                Outstanding
              </TableHead>
              <TableHead
                scope="col"
                className="text-ink-soft text-[11px] font-semibold tracking-[0.14em] uppercase"
              >
                Last payment
              </TableHead>
              <TableHead
                scope="col"
                className="text-ink-soft text-[11px] font-semibold tracking-[0.14em] uppercase"
              >
                Status
              </TableHead>
              <TableHead
                scope="col"
                className="text-ink-soft text-right text-[11px] font-semibold tracking-[0.14em] uppercase"
              >
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_td]:px-3 [&_td]:py-3">
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <StudentIdentity student={payment.student} />
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-ink text-[13.5px] font-semibold tabular-nums">
                    {formatCurrency(payment.expectedAmount, currency)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <CollectedFigure
                    expected={payment.expectedAmount}
                    received={payment.receivedAmount}
                    currency={currency}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "text-[13.5px] tabular-nums",
                      payment.remainingAmount > 0
                        ? "font-bold text-pink-700"
                        : "text-ink-soft font-semibold",
                    )}
                  >
                    {formatCurrency(payment.remainingAmount, currency)}
                  </span>
                </TableCell>
                <TableCell>
                  <LastPaymentCell transaction={payment.transactions[0]} />
                </TableCell>
                <TableCell>
                  <DerivedStatusBadge status={payment.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      className="h-11 rounded-full text-xs font-semibold"
                      aria-label={`Add payment for ${payment.student.name}`}
                      onClick={() => onAddPayment(payment.studentId)}
                    >
                      <WalletCards className="size-3.5" aria-hidden="true" />
                      Add payment
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-ink-soft hover:text-ink size-11 rounded-full"
                        >
                          <span className="sr-only">
                            More actions for {payment.student.name}
                          </span>
                          <MoreHorizontal
                            className="size-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => onViewHistory(payment.studentId)}
                        >
                          <History className="size-4" aria-hidden="true" />
                          Payment history
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow
              className="hover:bg-transparent"
              style={{ borderTop: "2px solid var(--line-strong)" }}
            >
              <TableCell className="py-3.5">
                <span className="text-ink-soft text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Subtotal · {payments.length} shown
                </span>
              </TableCell>
              <TableCell className="py-3.5 text-right">
                <span className="text-ink text-[13.5px] font-bold tabular-nums">
                  {formatCurrency(totals.expected, currency)}
                </span>
              </TableCell>
              <TableCell className="py-3.5 text-right">
                <span className="text-ink text-[13.5px] font-bold tabular-nums">
                  {formatCurrency(totals.received, currency)}
                </span>
              </TableCell>
              <TableCell className="py-3.5 text-right">
                <span className="text-[13.5px] font-bold text-pink-700 tabular-nums">
                  {formatCurrency(totals.remaining, currency)}
                </span>
              </TableCell>
              <TableCell colSpan={3} className="py-3.5">
                <span className="text-ink-soft text-xs">
                  {paidCount} of {payments.length} student
                  {plural(payments.length)} fully settled
                </span>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Phone and tablet-portrait: the same derivation, stacked as cards. */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {payments.map((payment, index) => {
          const pct = collectedPercent(
            payment.expectedAmount,
            payment.receivedAmount,
          );

          return (
            <div
              key={payment.id}
              className="rise border-border bg-card flex flex-col gap-3 rounded-2xl border p-4 shadow-[var(--sh-sm)]"
              style={{ "--i": index } as CSSProperties}
            >
              <div className="flex items-start justify-between gap-3">
                <StudentIdentity student={payment.student} />
                <DerivedStatusBadge status={payment.status} />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <MoneyPcell
                  label="Expected"
                  amount={payment.expectedAmount}
                  currency={currency}
                />
                <MoneyPcell
                  label="Collected"
                  amount={payment.receivedAmount}
                  currency={currency}
                />
                <MoneyPcell
                  label="Outstanding"
                  amount={payment.remainingAmount}
                  currency={currency}
                  due
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <CollectedBar pct={pct} />
                <span className="text-ink-soft text-[11px] font-medium tabular-nums">
                  {formatCurrency(payment.receivedAmount, currency)} of{" "}
                  {formatCurrency(payment.expectedAmount, currency)} collected ·{" "}
                  {pct}%
                </span>
              </div>

              <div className="border-border flex flex-col gap-2.5 border-t border-dashed pt-3">
                <LastPaymentCell transaction={payment.transactions[0]} />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-11 flex-1 rounded-full text-xs font-semibold"
                    aria-label={`Add payment for ${payment.student.name}`}
                    onClick={() => onAddPayment(payment.studentId)}
                  >
                    <WalletCards className="size-3.5" aria-hidden="true" />
                    Add payment
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-11 flex-1 rounded-full text-xs font-semibold"
                    aria-label={`View payment history for ${payment.student.name}`}
                    onClick={() => onViewHistory(payment.studentId)}
                  >
                    History
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <DerivationNote />
    </Card>
  );
}
