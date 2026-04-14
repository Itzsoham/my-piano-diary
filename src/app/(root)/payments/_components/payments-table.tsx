"use client";

import { format } from "date-fns";
import { MoreHorizontal, WalletCards } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { type RouterOutputs } from "@/trpc/react";
import { useCurrency } from "@/lib/currency";

const statusClasses: Record<"UNPAID" | "PARTIAL" | "PAID", string> = {
  UNPAID: "bg-rose-100 text-rose-700 hover:bg-rose-100",
  PARTIAL: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  PAID: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
};

type PaymentRow = RouterOutputs["payment"]["getForMonth"][number];

interface PaymentsTableProps {
  payments: PaymentRow[];
  isLoading: boolean;
  onAddPayment: (studentId: string) => void;
  onViewHistory: (studentId: string) => void;
}

export function PaymentsTable({
  payments,
  isLoading,
  onAddPayment,
  onViewHistory,
}: PaymentsTableProps) {
  const { currency } = useCurrency();

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-pink-100 bg-white">
        <span className="text-sm text-pink-600">Loading payments...</span>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-pink-200 bg-white/70 py-12 text-center">
        <div className="mb-2 text-3xl">💸</div>
        <p className="text-base font-medium text-pink-700">
          No payment records
        </p>
        <p className="mt-1 text-sm text-pink-600/80">
          Try another month or select a specific student.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-pink-100 bg-white shadow-md md:block">
        <Table>
          <TableHeader className="bg-rose-50/60">
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-pink-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8 border border-pink-100">
                      <AvatarImage src={payment.student.avatar ?? ""} />
                      <AvatarFallback className="bg-pink-50 text-xs font-bold text-pink-600">
                        {payment.student.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{payment.student.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {formatCurrency(payment.expectedAmount, currency)}
                </TableCell>
                <TableCell>
                  {formatCurrency(payment.receivedAmount, currency)}
                </TableCell>
                <TableCell>
                  {formatCurrency(payment.remainingAmount, currency)}
                </TableCell>
                <TableCell>
                  <Badge className={statusClasses[payment.status]}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {payment.transactions[0]
                    ? format(
                        new Date(payment.transactions[0].date),
                        "MMM d, yyyy",
                      )
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => onAddPayment(payment.studentId)}
                      >
                        <WalletCards className="mr-2 h-4 w-4" />
                        Add payment
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onViewHistory(payment.studentId)}
                      >
                        View history
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-9 border border-pink-100">
                  <AvatarImage src={payment.student.avatar ?? ""} />
                  <AvatarFallback className="bg-pink-50 text-xs font-bold text-pink-600">
                    {payment.student.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold">{payment.student.name}</span>
              </div>
              <Badge className={statusClasses[payment.status]}>
                {payment.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-pink-50 p-2">
                <div className="text-pink-700/70">Expected</div>
                <div className="font-semibold text-pink-900">
                  {formatCurrency(payment.expectedAmount, currency)}
                </div>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2">
                <div className="text-emerald-700/70">Received</div>
                <div className="font-semibold text-emerald-900">
                  {formatCurrency(payment.receivedAmount, currency)}
                </div>
              </div>
              <div className="rounded-lg bg-amber-50 p-2">
                <div className="text-amber-700/70">Pending</div>
                <div className="font-semibold text-amber-900">
                  {formatCurrency(payment.remainingAmount, currency)}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                onClick={() => onAddPayment(payment.studentId)}
              >
                Add payment
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onViewHistory(payment.studentId)}
              >
                History
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
