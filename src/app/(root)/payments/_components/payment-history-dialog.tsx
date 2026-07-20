"use client";

import { format } from "date-fns";
import { History } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mochi } from "@/components/blossom/mochi";
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

// Paid/Partial/Outstanding is derived (expected vs collected), never a stored
// enum — mapped onto the same ok/wait/no vocabulary as everywhere else, styled
// as a squared badge with a left rule so it never reads as the real
// LessonStatus pill.
const STATUS_META: Record<
  "UNPAID" | "PARTIAL" | "PAID",
  { label: string; className: string }
> = {
  PAID: { label: "Paid", className: "bg-ok-bg text-ok-fg" },
  PARTIAL: { label: "Partial", className: "bg-wait-bg text-wait-fg" },
  UNPAID: { label: "Outstanding", className: "bg-no-bg text-no-fg" },
};

function DerivedStatusBadge({
  status,
}: {
  status: "UNPAID" | "PARTIAL" | "PAID";
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border-l-[3px] border-current px-2.5 py-1 text-[11px] font-bold whitespace-nowrap",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

interface PaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
}

export function PaymentHistoryDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
}: PaymentHistoryDialogProps) {
  const { currency } = useCurrency();

  const { data: history = [], isLoading } =
    api.payment.getStudentHistory.useQuery(
      {
        studentId,
        limit: 12,
      },
      {
        enabled: open && !!studentId,
      },
    );

  const subtitle = isLoading
    ? "Loading…"
    : history.length === 0
      ? "No billing months with a recorded payment yet"
      : `${history.length} billing month${history.length === 1 ? "" : "s"} with a payment`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-3xl p-0 shadow-[var(--sh-xl)] sm:max-w-2xl">
        {/* Header — the screen's one permitted header touch: a grad-pink icon
            badge (never purple). Everything below it stays sober. */}
        <DialogHeader className="border-border flex-row items-start gap-3 space-y-0 border-b bg-[linear-gradient(150deg,var(--pink-50),var(--surface)_70%)] px-5 py-4 text-left sm:px-6 sm:py-5">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full [background-image:var(--grad-pink)] text-white shadow-[var(--sh-pink)]"
          >
            <History className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 pr-6">
            <DialogTitle className="text-ink font-serif text-lg leading-tight font-semibold">
              Payment history for {studentName}
            </DialogTitle>
            <DialogDescription className="text-ink-soft mt-0.5 text-xs">
              {subtitle}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {isLoading ? (
            <div className="text-ink-soft py-6 text-sm">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="grid justify-items-center gap-2 py-8 text-center">
              <Mochi mood="sleepy" size={104} />
              <p className="text-ink text-sm font-semibold">
                No payment history yet
              </p>
              <p className="text-ink-soft max-w-[32ch] text-xs">
                Once a payment is recorded for {studentName}, it will show up
                here — month by month, with the maths behind it.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {history.map((monthRecord, index) => {
                const pct =
                  monthRecord.expectedAmount > 0
                    ? Math.min(
                        Math.round(
                          (monthRecord.receivedAmount /
                            monthRecord.expectedAmount) *
                            100,
                        ),
                        100,
                      )
                    : monthRecord.receivedAmount > 0
                      ? 100
                      : 0;

                return (
                  <div
                    key={monthRecord.id}
                    className="rise bg-card rounded-2xl border border-pink-100 p-4 shadow-[var(--sh-sm)]"
                    style={{ "--i": index } as React.CSSProperties}
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-ink-soft text-[11px] font-semibold tracking-[0.08em] uppercase">
                          Billing Month
                        </p>
                        <p className="text-ink font-serif text-base font-semibold">
                          {MONTH_NAMES[monthRecord.month - 1]}{" "}
                          {monthRecord.year}
                        </p>
                      </div>
                      <DerivedStatusBadge status={monthRecord.status} />
                    </div>

                    {/* The derivation, always visible: expected vs collected
                        (with the bar showing the fraction) vs what's left. */}
                    <div className="border-border bg-floss grid gap-2 rounded-xl border p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-ink-soft text-xs font-medium">
                          Expected
                        </span>
                        <span className="text-ink text-sm font-bold tabular-nums">
                          {formatCurrency(monthRecord.expectedAmount, currency)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-ink-soft text-xs font-medium">
                          Collected
                        </span>
                        <span className="text-sm font-bold text-teal-700 tabular-nums">
                          {formatCurrency(monthRecord.receivedAmount, currency)}
                        </span>
                      </div>
                      <span
                        role="img"
                        aria-label={`${pct}% collected`}
                        className="block h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]"
                      >
                        <i
                          className="block h-full rounded-full [background-image:var(--grad-mint)]"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-ink-soft text-xs font-medium">
                          Outstanding
                        </span>
                        <span className="text-sm font-bold text-pink-700 tabular-nums">
                          {formatCurrency(
                            monthRecord.remainingAmount,
                            currency,
                          )}
                        </span>
                      </div>
                    </div>

                    {monthRecord.transactions.length === 0 ? (
                      <p className="text-ink-soft mt-3 text-xs">
                        No transactions
                      </p>
                    ) : (
                      <ul className="mt-3 ml-1.5 grid gap-2.5 border-l-2 border-dashed border-[var(--line-strong)] pl-4">
                        {monthRecord.transactions.map((transaction) => (
                          <li key={transaction.id} className="relative">
                            <span
                              aria-hidden="true"
                              className="bg-bubblegum absolute top-2 -left-[21px] size-2 rounded-full ring-2 ring-[var(--surface)]"
                            />
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-pink-100 bg-pink-50/60 px-3 py-2">
                              <div className="min-w-0">
                                <p className="text-ink text-xs font-semibold tabular-nums">
                                  {format(
                                    new Date(transaction.date),
                                    "d MMM yyyy",
                                  )}
                                </p>
                                <p className="text-ink-soft mt-0.5 truncate text-[11px]">
                                  <span className="font-semibold text-teal-700">
                                    {transaction.method ?? "Method not set"}
                                  </span>
                                  {transaction.note
                                    ? ` — ${transaction.note}`
                                    : ""}
                                </p>
                              </div>
                              <span className="text-ink shrink-0 text-sm font-bold tabular-nums">
                                {formatCurrency(transaction.amount, currency)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-border bg-floss border-t px-5 py-3 sm:px-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border bg-card text-ink hover:bg-floss rounded-full shadow-[var(--sh-xs)]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
