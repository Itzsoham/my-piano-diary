"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { api } from "@/trpc/react";
import { useCurrency } from "@/lib/currency";

interface PaymentTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: number;
  year: number;
  students: { id: string; name: string; avatar: string | null }[];
  initialStudentId?: string;
}

export function PaymentTransactionDialog({
  open,
  onOpenChange,
  month,
  year,
  students,
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

  const monthRecord = api.payment.getOrCreateMonthRecord.useQuery(
    {
      studentId,
      month,
      year,
    },
    {
      enabled: open && !!studentId,
    },
  );

  const addTransaction = api.payment.addTransaction.useMutation({
    onSuccess: async () => {
      toast.success("Payment recorded");
      setAmount("");
      setMethod("");
      setNote("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      onOpenChange(false);
      await utils.payment.getForMonth.invalidate({ month, year });
      await utils.payment.getUnpaidSummary.invalidate();
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

    if (!monthRecord.data?.id) {
      toast.error("Payment month record not ready yet");
      return;
    }

    addTransaction.mutate({
      paymentMonthId: monthRecord.data.id,
      studentId,
      amount: parsedAmount,
      method: method || undefined,
      note: note || undefined,
      date: date ? new Date(`${date}T00:00:00`) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add payment transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
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
            <div className="rounded-lg border border-pink-100 bg-pink-50/70 p-3 text-sm">
              <div className="font-medium text-pink-900">
                {selectedStudent.name}
              </div>
              <div className="text-pink-700/80">
                Month: {month}/{year}
              </div>
              {monthRecord.data && (
                <div className="mt-1 text-pink-700/80">
                  Expected:{" "}
                  {formatCurrency(monthRecord.data.expectedAmount, currency)}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              inputMode="numeric"
              placeholder="Enter amount"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value.replace(/[^0-9]/g, ""))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Method (optional)</Label>
            <Input
              placeholder="Cash, transfer, etc."
              value={method}
              onChange={(event) => setMethod(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea
              placeholder="Add note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={addTransaction.isPending || monthRecord.isLoading}
          >
            {addTransaction.isPending ? "Saving..." : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
