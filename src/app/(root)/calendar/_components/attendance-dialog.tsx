"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";

const AttendanceFormSchema = z.object({
  status: z.enum(["PENDING", "COMPLETE", "CANCELLED"]),
  actualMin: z.string().optional(),
  cancelReason: z.string().optional(),
  note: z.string().optional(),
});

type AttendanceFormValues = z.infer<typeof AttendanceFormSchema>;

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: {
    id: string;
    studentName: string;
    duration: number;
    status: "PENDING" | "COMPLETE" | "CANCELLED";
    actualMin: number | null;
    cancelReason: string | null;
    note: string | null;
  };
  onSuccess?: () => void;
}

export function AttendanceDialog({
  open,
  onOpenChange,
  lesson,
  onSuccess,
}: AttendanceDialogProps) {
  const utils = api.useUtils();
  const markAttendance = api.lesson.markAttendance.useMutation({
    onSuccess: () => {
      toast.success("Attendance marked successfully!");
      void utils.lesson.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to mark attendance");
    },
  });

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(AttendanceFormSchema),
    defaultValues: {
      status: lesson.status,
      actualMin: lesson.actualMin?.toString() ?? lesson.duration.toString(),
      cancelReason: lesson.cancelReason ?? "",
      note: lesson.note ?? "",
    },
  });

  const selectedStatus = form.watch("status");

  const onSubmit = async (data: AttendanceFormValues) => {
    markAttendance.mutate({
      lessonId: lesson.id,
      status: data.status,
      actualMin: data.actualMin ? parseInt(data.actualMin) : undefined,
      cancelReason: data.cancelReason,
      note: data.note,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogDescription>
            Mark attendance for {lesson.studentName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDING">⏳ Pending</SelectItem>
                      <SelectItem value="COMPLETE">✓ Complete</SelectItem>
                      <SelectItem value="CANCELLED">✗ Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedStatus === "COMPLETE" && (
              <FormField
                control={form.control}
                name="actualMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder={lesson.duration.toString()}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Scheduled: {lesson.duration} minutes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedStatus === "CANCELLED" && (
              <FormField
                control={form.control}
                name="cancelReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Absence</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Sick, Family emergency"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={markAttendance.isPending}
                className="flex-1"
              >
                {markAttendance.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
