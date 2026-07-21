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
import { Blossom } from "@/components/blossom/blossom";
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
    // How well the lesson went, 1-5. Nullable so the teacher can leave a
    // lesson unrated (or explicitly clear a previous rating).
    score: z.number().int().min(1).max(5).nullable(),
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

const SCORE_VALUES = [1, 2, 3, 4, 5] as const;
// Index 0 is the "not rated yet" caption for a null/0 field value.
const SCORE_LABELS = [
  "Tap a blossom to rate",
  "Needs practice",
  "Okay",
  "Good",
  "Great",
  "Brilliant! 🌸",
] as const;

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
    score: number | null;
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
          score?: number | null;
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
                score: input.score === undefined ? l.score : input.score,
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
      score: lesson.score,
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
      score: lesson.score,
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
      score: data.status === "COMPLETE" ? data.score : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-106.25">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full [background-image:var(--grad-pink)] shadow-(--sh-pink) sm:h-12 sm:w-12">
            <Music2 className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </div>
          <DialogTitle className="text-ink text-center text-xl font-bold sm:text-2xl">
            Lesson with {session?.user?.name ?? "you"} 🎹
          </DialogTitle>
          <DialogDescription className="text-ink-soft text-center text-sm font-medium sm:text-base">
            {format(lesson.date, "EEEE · h:mm a")} · {lesson.duration} min
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Compact top bar — rate (shown as text since it rarely changes)
                + online toggle, kept slim so the modal stays short */}
            <div className="border-border bg-card flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-2xl border px-3 py-2.5">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-ink-soft text-xs font-semibold whitespace-nowrap">
                      {lesson.studentName}&apos;s rate
                    </FormLabel>
                    {isEditingRate ? (
                      <FormControl>
                        <div className="relative w-28">
                          <span className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2 text-sm">
                            đ
                          </span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            autoFocus
                            className="h-8 rounded-lg bg-pink-50 pl-6 text-right text-sm font-semibold focus-visible:ring-pink-400"
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
                        className="text-ink flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 text-sm font-bold transition hover:bg-pink-50"
                      >
                        <span className="tabular-nums">
                          đ {formatNumberWithSeparators(rateValue ?? 0)}
                        </span>
                        <Pencil className="h-3.5 w-3.5 text-pink-400" />
                      </button>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isOnline"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-ink-soft text-xs font-semibold whitespace-nowrap">
                      Online 💻
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {rateEdited && (
                <p className="w-full text-xs text-pink-600">
                  Custom rate for this lesson only — totals update accordingly.
                </p>
              )}
            </div>

            <div className="space-y-3 rounded-2xl bg-[linear-gradient(160deg,var(--pink-50),var(--surface)_70%)] p-3 sm:space-y-4 sm:p-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-ink-soft text-xs font-semibold sm:text-sm">
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
                              ? "bg-ok-bg border-teal-600 shadow-sm ring-2 ring-teal-600/15"
                              : "border-border bg-card/50 opacity-60 hover:border-(--line-pink) hover:opacity-100",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 group-active:scale-95 sm:h-10 sm:w-10",
                              field.value === "COMPLETE"
                                ? "bg-card text-ok-fg scale-110"
                                : "bg-muted text-ink-soft",
                            )}
                          >
                            <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-bold sm:text-xs",
                              field.value === "COMPLETE"
                                ? "text-ok-fg"
                                : "text-ink-soft",
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
                              ? "bg-no-bg border-pink-600 shadow-sm ring-2 ring-pink-600/15"
                              : "border-border bg-card/50 opacity-60 hover:border-(--line-pink) hover:opacity-100",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 group-active:scale-95 sm:h-10 sm:w-10",
                              field.value === "CANCELLED"
                                ? "bg-card text-no-fg scale-110"
                                : "bg-muted text-ink-soft",
                            )}
                          >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-bold sm:text-xs",
                              field.value === "CANCELLED"
                                ? "text-no-fg"
                                : "text-ink-soft",
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
                              ? "border-sand-700 bg-wait-bg ring-sand-700/15 shadow-sm ring-2"
                              : "border-border bg-card/50 opacity-60 hover:border-(--line-pink) hover:opacity-100",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 group-active:scale-95 sm:h-10 sm:w-10",
                              field.value === "PENDING"
                                ? "bg-card text-wait-fg scale-110"
                                : "bg-muted text-ink-soft",
                            )}
                          >
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-bold sm:text-xs",
                              field.value === "PENDING"
                                ? "text-wait-fg"
                                : "text-ink-soft",
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
                  name="score"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-top-2 space-y-2 duration-300">
                      <FormLabel className="text-ink-soft text-xs font-semibold sm:text-sm">
                        How did it go? (optional)
                      </FormLabel>
                      <FormControl>
                        <div className="border-border bg-card flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            {SCORE_VALUES.map((value) => {
                              const filled = (field.value ?? 0) >= value;
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  aria-label={`Rate ${value} out of 5`}
                                  aria-pressed={field.value === value}
                                  onClick={() =>
                                    field.onChange(
                                      field.value === value ? null : value,
                                    )
                                  }
                                  className="rounded-full p-0.5 transition-transform active:scale-90"
                                >
                                  <Blossom
                                    size={22}
                                    className={cn(
                                      "transition-colors",
                                      filled
                                        ? "text-bubblegum"
                                        : "text-pink-100",
                                    )}
                                  />
                                </button>
                              );
                            })}
                          </div>
                          <span className="text-ink-soft text-xs font-semibold whitespace-nowrap">
                            {SCORE_LABELS[field.value ?? 0]}
                          </span>
                        </div>
                      </FormControl>
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
                        <FormLabel className="text-ink-soft text-sm font-semibold">
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
                        <FormLabel className="text-ink-soft text-sm font-semibold">
                          Additional Note 💭
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Optional note for yourself..."
                            className="bg-card min-h-20 rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
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
                className="h-10 flex-1 rounded-xl [background-image:var(--grad-pink)] text-white shadow-(--sh-pink) transition-[filter] hover:brightness-105 sm:h-auto"
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
