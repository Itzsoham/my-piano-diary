"use client";

import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { api } from "@/trpc/react";
import { useCurrency } from "@/lib/currency";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment history for {studentName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-muted-foreground py-6 text-sm">
            Loading history...
          </div>
        ) : history.length === 0 ? (
          <div className="text-muted-foreground py-6 text-sm">
            No payment history found.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((monthRecord) => (
              <div
                key={monthRecord.id}
                className="rounded-xl border border-pink-100 bg-white p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-pink-900">
                    {monthRecord.month}/{monthRecord.year}
                  </div>
                  <Badge variant="outline">{monthRecord.status}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                  <div className="rounded-lg bg-pink-50 p-2">
                    <div className="text-pink-700/70">Expected</div>
                    <div className="font-semibold text-pink-900">
                      {formatCurrency(monthRecord.expectedAmount, currency)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <div className="text-emerald-700/70">Received</div>
                    <div className="font-semibold text-emerald-900">
                      {formatCurrency(monthRecord.receivedAmount, currency)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2">
                    <div className="text-amber-700/70">Pending</div>
                    <div className="font-semibold text-amber-900">
                      {formatCurrency(monthRecord.remainingAmount, currency)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {monthRecord.transactions.length === 0 ? (
                    <div className="text-muted-foreground text-xs">
                      No transactions
                    </div>
                  ) : (
                    monthRecord.transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between rounded-lg border border-pink-100 bg-pink-50/40 px-3 py-2 text-xs"
                      >
                        <div>
                          <div className="font-medium text-pink-900">
                            {format(new Date(transaction.date), "MMM d, yyyy")}
                          </div>
                          <div className="text-pink-700/70">
                            {transaction.method ?? "Method not set"}
                            {transaction.note ? ` - ${transaction.note}` : ""}
                          </div>
                        </div>
                        <div className="font-semibold text-pink-900">
                          {formatCurrency(transaction.amount, currency)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
