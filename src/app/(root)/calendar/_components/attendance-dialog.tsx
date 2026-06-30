"use client";

import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { Check, X, Clock, Music2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumberWithSeparators } from "@/lib/format";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";

const AttendanceFormSchema = z
  .object({
    status: z.enum(["PENDING", "COMPLETE", "CANCELLED"]),
    isOnline: z.boolean(),
    rate: z
      .number()
      .int("Rate must be an integer")
      .min(0, "Rate must be 0 or greater")
      .max(10000000, "Rate seems unreasonably high"),
    cancelReason: z.string().optional(),
    note: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "CANCELLED" && !data.cancelReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cancelReason"],
        message: "Reason is required when cancelling a lesson",
      });
    }
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
    isOnline: boolean;
    rate: number;
    actualMin: number | null;
    cancelReason: string | null;
    note: string | null;
    date: Date;
  };
  /** The exact { start, end } range the Calendar is currently viewing.
   * Pass this from calendar/page.tsx so week/day view is patched correctly. */
  dateRange?: { start: Date; end: Date };
  onSuccess?: () => void;
}

export function AttendanceDialog({
  open,
  onOpenChange,
  lesson,
  dateRange,
  onSuccess,
}: AttendanceDialogProps) {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const queryClient = useQueryClient();
  const markAttendance = api.lesson.markAttendance.useMutation({
    mutationKey: ["lesson-write"],
    // Step 1: Before request fires — patch ALL caches that show lesson data
    onMutate: async (input) => {
      // Cancel any in-flight refetches across all queries that show lessons
      await utils.lesson.getAll.cancel({});
      await utils.lesson.getInRange.cancel();
      await utils.earnings.getTodayLessons.cancel();

      // Helper: apply the status patch to any list of lessons
      const applyPatch = <
        T extends {
          id: string;
          status: string;
          actualMin: number | null;
          cancelReason: string | null;
          note: string | null;
        },
      >(
        list: T[] | undefined,
      ): T[] | undefined => {
        if (!list) return list;
        return list.map((l) =>
          l.id === input.lessonId
            ? {
                ...l,
                status: input.status,
                actualMin: input.actualMin ?? l.actualMin,
                cancelReason: input.cancelReason ?? l.cancelReason,
                note: input.note ?? l.note,
              }
            : l,
        );
      };

      // 1. Patch lesson.getAll (Lessons page) — no-filter variant
      utils.lesson.getAll.setData({}, (old) => applyPatch(old));

      // 2. Patch lesson.getInRange (Calendar page)
      // Use the exact dateRange from the Calendar if provided (correct for week/day/month view).
      // Otherwise fall back to deriving the lesson's month range.
      const lessonDate = new Date(lesson.date);
      const rangeKey = dateRange ?? {
        start: new Date(lessonDate.getFullYear(), lessonDate.getMonth(), 1),
        end: new Date(lessonDate.getFullYear(), lessonDate.getMonth() + 1, 0),
      };
      utils.lesson.getInRange.setData(rangeKey, (old) => applyPatch(old));

      // 3. Patch earnings.getTodayLessons (Dashboard)
      // Key is the startOfDay of the lesson's date (matches Dashboard's useState)
      const todayKey = {
        date: new Date(
          lessonDate.getFullYear(),
          lessonDate.getMonth(),
          lessonDate.getDate(),
        ),
      };
      utils.earnings.getTodayLessons.setData(todayKey, (old) => {
        if (!old) return old;
        return old.map((l) => {
          if (l.id !== input.lessonId) return l;
          const newStatus = input.status;
          return {
            ...l,
            status: newStatus,
            actualMin: input.actualMin ?? l.actualMin,
            cancelReason: input.cancelReason ?? l.cancelReason,
            note: input.note ?? l.note,
            rate: input.rate ?? l.rate,
            // Recalculate earnings: cancelled lessons earn 0 (uses the
            // override if provided, else the lesson's frozen rate; the
            // server reconciles on refetch).
            earnings: newStatus === "CANCELLED" ? 0 : (input.rate ?? l.rate),
          };
        });
      });
      // ✅ Close modal and show success toast IMMEDIATELY — don't wait for server
      toast.success("Attendance marked successfully! 💗", { id: "attendance" });
      onOpenChange(false);
    },

    onSuccess: () => {
      // Modal already closed, actual sync callback runs when all in-flight writes settle.
    },

    onError: (error) => {
      // Server failed — replace the optimistic toast with an error
      toast.error(error.message ?? "Failed to mark attendance", {
        id: "attendance",
      });
      // Re-open the dialog so the user can try again
      onOpenChange(true);
    },

    // Re-sync once after the final in-flight lesson write settles to avoid stale overwrite flicker.
    onSettled: async () => {
      const inFlight = queryClient.isMutating({
        mutationKey: ["lesson-write"],
      });

      if (inFlight !== 1) {
        return;
      }

      await Promise.all([
        utils.lesson.invalidate(),
        utils.earnings.getTodayLessons.invalidate(),
      ]);
      onSuccess?.();
    },
  });

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(AttendanceFormSchema),
    defaultValues: {
      status: lesson.status,
      isOnline: lesson.isOnline,
      rate: lesson.rate,
      cancelReason: lesson.cancelReason ?? "",
      note: lesson.note ?? "",
    },
  });

  // Whether the inline rate editor is open, and whether the teacher actually
  // changed the rate (so we only send an override when they did).
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateEdited, setRateEdited] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      status: lesson.status,
      isOnline: lesson.isOnline,
      rate: lesson.rate,
      cancelReason: lesson.cancelReason ?? "",
      note: lesson.note ?? "",
    });
    setIsEditingRate(false);
    setRateEdited(false);
  }, [open, lesson, form]);

  const selectedStatus = form.watch("status");
  const rateValue = form.watch("rate");

  const onSubmit = async (data: AttendanceFormValues) => {
    const cancelReason = data.cancelReason?.trim();
    const note = data.note?.trim();

    markAttendance.mutate({
      lessonId: lesson.id,
      status: data.status,
      isOnline: data.isOnline,
      // Only send a rate when the teacher edited it — otherwise the server
      // keeps the lesson's existing/derived rate.
      rate: rateEdited ? data.rate : undefined,
      cancelReason: cancelReason === "" ? undefined : cancelReason,
      note: note === "" ? undefined : note,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-106.25">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-pink-100 to-purple-100 shadow-lg shadow-pink-100/40 sm:h-12 sm:w-12">
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
            <div className="space-y-3 rounded-xl bg-linear-to-br from-pink-50/50 to-purple-50/50 p-3 sm:space-y-4 sm:p-4">
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
                            "group flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2 transition-all duration-200 sm:min-h-0 sm:gap-2 sm:p-3",
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
                            "group flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2 transition-all duration-200 sm:min-h-0 sm:gap-2 sm:p-3",
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
                            "group flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2 transition-all duration-200 sm:min-h-0 sm:gap-2 sm:p-3",
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

              <FormField
                control={form.control}
                name="isOnline"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-pink-100 bg-white/70 p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold text-pink-900/70">
                        Online lesson 💻
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Charged at the student&apos;s online rate
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem className="rounded-xl border border-pink-100 bg-white/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-semibold text-pink-900/70">
                          Lesson rate
                        </FormLabel>
                        <FormDescription className="text-xs">
                          {lesson.studentName}&apos;s rate for this lesson
                        </FormDescription>
                      </div>
                      {isEditingRate ? (
                        <FormControl>
                          <div className="relative w-32">
                            <span className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2 text-sm">
                              đ
                            </span>
                            <Input
                              type="text"
                              inputMode="numeric"
                              autoFocus
                              className="h-9 rounded-lg bg-pink-50 pl-6 text-right text-sm font-semibold focus-visible:ring-pink-400"
                              value={
                                field.value
                                  ? formatNumberWithSeparators(field.value)
                                  : ""
                              }
                              onChange={(e) => {
                                const numValue =
                                  parseInt(
                                    e.target.value.replace(/\./g, "") || "0",
                                  ) || 0;
                                field.onChange(numValue);
                                setRateEdited(true);
                              }}
                            />
                          </div>
                        </FormControl>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditingRate(true)}
                          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-bold text-pink-900 transition hover:bg-pink-50"
                        >
                          <span>
                            đ {formatNumberWithSeparators(rateValue ?? 0)}
                          </span>
                          <Pencil className="h-3.5 w-3.5 text-pink-400" />
                        </button>
                      )}
                    </div>
                    {rateEdited && (
                      <p className="mt-1 text-xs text-pink-500">
                        Custom rate for this lesson only — totals update
                        accordingly.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                            required
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
                className="h-10 flex-1 rounded-xl bg-linear-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-200 transition-all hover:from-pink-600 hover:to-purple-600 hover:shadow-lg active:scale-[0.98] sm:h-auto"
              >
                {selectedStatus === "COMPLETE"
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
