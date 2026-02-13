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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { Check, X, Clock, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

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
    date: Date;
  };
  onSuccess?: () => void;
}

export function AttendanceDialog({
  open,
  onOpenChange,
  lesson,
  onSuccess,
}: AttendanceDialogProps) {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const markAttendance = api.lesson.markAttendance.useMutation({
    onSuccess: () => {
      toast.success("Attendance marked successfully! 💗");
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
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100 shadow-lg shadow-pink-100/40 sm:h-12 sm:w-12">
            <Music2 className="h-5 w-5 text-pink-600 sm:h-6 sm:w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-pink-950 sm:text-2xl">
            Lesson with {session?.user?.name ?? "you"} 🎹
          </DialogTitle>
          <DialogDescription className="text-center text-sm font-medium text-pink-800/60 sm:text-base">
            {format(lesson.date, "EEEE · h:mm a")} · {lesson.duration} min
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-6"
          >
            <div className="space-y-3 rounded-xl bg-gradient-to-br from-pink-50/50 to-purple-50/50 p-3 sm:space-y-4 sm:p-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-semibold text-pink-900/70 sm:text-sm">
                      Attendance Status
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => field.onChange("COMPLETE")}
                          className={cn(
                            "group flex min-h-[80px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2 transition-all duration-200 sm:min-h-0 sm:gap-2 sm:p-3",
                            field.value === "COMPLETE"
                              ? "border-green-500 bg-green-50 shadow-sm ring-2 shadow-green-100 ring-green-500/10"
                              : "border-pink-100 bg-white/50 opacity-60 hover:border-pink-200 hover:opacity-100",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 group-active:scale-95 sm:h-10 sm:w-10",
                              field.value === "COMPLETE"
                                ? "scale-110 bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-400",
                            )}
                          >
                            <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-bold sm:text-xs",
                              field.value === "COMPLETE"
                                ? "text-green-700"
                                : "text-gray-500",
                            )}
                          >
                            Present
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => field.onChange("CANCELLED")}
                          className={cn(
                            "group flex min-h-[80px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2 transition-all duration-200 sm:min-h-0 sm:gap-2 sm:p-3",
                            field.value === "CANCELLED"
                              ? "border-rose-500 bg-rose-50 shadow-sm ring-2 shadow-rose-100 ring-rose-500/10"
                              : "border-pink-100 bg-white/50 opacity-60 hover:border-pink-200 hover:opacity-100",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 group-active:scale-95 sm:h-10 sm:w-10",
                              field.value === "CANCELLED"
                                ? "scale-110 bg-rose-100 text-rose-600"
                                : "bg-gray-100 text-gray-400",
                            )}
                          >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-bold sm:text-xs",
                              field.value === "CANCELLED"
                                ? "text-rose-700"
                                : "text-gray-500",
                            )}
                          >
                            Cancelled
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => field.onChange("PENDING")}
                          className={cn(
                            "group flex min-h-[80px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2 transition-all duration-200 sm:min-h-0 sm:gap-2 sm:p-3",
                            field.value === "PENDING"
                              ? "border-amber-500 bg-amber-50 shadow-sm ring-2 shadow-amber-100 ring-amber-500/10"
                              : "border-pink-100 bg-white/50 opacity-60 hover:border-pink-200 hover:opacity-100",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 group-active:scale-95 sm:h-10 sm:w-10",
                              field.value === "PENDING"
                                ? "scale-110 bg-amber-100 text-amber-600"
                                : "bg-gray-100 text-gray-400",
                            )}
                          >
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-bold sm:text-xs",
                              field.value === "PENDING"
                                ? "text-amber-700"
                                : "text-gray-500",
                            )}
                          >
                            Pending
                          </span>
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedStatus === "COMPLETE" && (
                <FormField
                  control={form.control}
                  name="actualMin"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <FormLabel className="text-sm font-semibold text-pink-900/70">
                        Actual Duration (minutes)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder={lesson.duration.toString()}
                          className="rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-pink-800/40">
                        Scheduled: {lesson.duration} minutes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedStatus === "CANCELLED" && (
                <>
                  <FormField
                    control={form.control}
                    name="cancelReason"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <FormLabel className="text-sm font-semibold text-pink-900/70">
                          Reason for Absence
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Sick, Family emergency"
                            className="rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <FormLabel className="text-sm font-semibold text-pink-900/70">
                          Additional Note 💭
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Optional note for yourself..."
                            className="min-h-20 rounded-xl border-pink-100 bg-white focus:border-pink-300 focus:ring-pink-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 flex-1 rounded-xl sm:h-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={markAttendance.isPending}
                className="h-10 flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-200 transition-all hover:from-pink-600 hover:to-purple-600 hover:shadow-lg active:scale-[0.98] sm:h-auto"
              >
                {markAttendance.isPending
                  ? "Saving..."
                  : selectedStatus === "COMPLETE"
                    ? "Mark Present"
                    : selectedStatus === "CANCELLED"
                      ? "Cancel Lesson"
                      : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
