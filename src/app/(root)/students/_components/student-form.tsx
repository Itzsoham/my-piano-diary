"use client";

import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, CalendarDays, MapPin, User, Wifi } from "lucide-react";

import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppLoader } from "@/components/ui/app-loader";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useCurrency } from "@/lib/currency";
import { formatCurrency, formatNumberWithSeparators } from "@/lib/format";

const studentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatar: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
  lessonRate: z
    .number()
    .int("Lesson rate must be an integer")
    .min(0, "Lesson rate must be 0 or greater")
    .max(10000000, "Lesson rate seems unreasonably high"),
  onlineLessonRate: z
    .number()
    .int("Online lesson rate must be an integer")
    .min(0, "Online lesson rate must be 0 or greater")
    .max(10000000, "Online lesson rate seems unreasonably high"),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

export function StudentForm({
  studentId,
  onSuccess,
}: {
  studentId?: string;
  onSuccess?: () => void;
}) {
  const utils = api.useUtils();
  const router = useRouter();
  const { currency } = useCurrency();

  // The bare currency symbol (no digits), derived from the teacher's chosen
  // currency so the rate fields never hardcode one — VND, IDR, USD and INR
  // all format differently (e.g. "₫" trails the number in vi-VN).
  const currencySymbol = formatCurrency(0, currency)
    .replace(/[\d.,\s ]/g, "")
    .trim();

  // Fetch student data only if we have an ID (edit mode)
  const { data: student, isLoading } = api.student.getByGuid.useQuery(
    { id: studentId! },
    { enabled: !!studentId },
  );

  const createMutation = api.student.create.useMutation({
    onSuccess: () => {
      // Close only after the server confirms, so a failed submit keeps the
      // form open with the entered values intact.
      toast.success("Student created successfully", { id: "student-create" });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to create student", {
        id: "student-create",
      });
    },
    onSettled: () => {
      void utils.student.getAll.invalidate();
      router.refresh();
    },
  });

  const updateMutation = api.student.update.useMutation({
    onSuccess: () => {
      toast.success("Student updated successfully", { id: "student-update" });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update student", {
        id: "student-update",
      });
    },
    onSettled: () => {
      void utils.student.getAll.invalidate();
      if (studentId) {
        void utils.student.getByGuid.invalidate({ id: studentId });
      }
      router.refresh();
    },
  });

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      avatar: "",
      notes: "",
      lessonRate: 0,
      onlineLessonRate: 0,
    },
  });

  const avatarUrl = form.watch("avatar");
  const nameValue = form.watch("name");

  const getInitials = (value: string) =>
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  React.useEffect(() => {
    if (student) {
      form.reset({
        name: student.name,
        avatar: student.avatar ?? "",
        notes: student.notes ?? "",
        lessonRate: student.lessonRate ?? 0,
        onlineLessonRate: student.onlineLessonRate ?? 0,
      });
    }
  }, [student, form]);

  const onSubmit = (data: StudentFormValues) => {
    if (studentId) {
      updateMutation.mutate({
        id: studentId,
        ...data,
        avatar: data.avatar ?? undefined,
        notes: data.notes ?? undefined,
        lessonRate: data.lessonRate,
        onlineLessonRate: data.onlineLessonRate,
      });
    } else {
      createMutation.mutate({
        ...data,
        avatar: data.avatar ?? undefined,
        notes: data.notes ?? undefined,
        lessonRate: data.lessonRate,
        onlineLessonRate: data.onlineLessonRate,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (studentId && isLoading) {
    return (
      <AppLoader
        size="sm"
        className="min-h-48"
        text="Fetching student details..."
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 sm:space-y-8"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center gap-4 text-center md:col-span-1 md:items-start md:text-left">
              <Avatar className="size-24 rounded-full shadow-(--sh-sm) ring-4 ring-pink-200">
                <AvatarImage src={avatarUrl} alt={nameValue || "Avatar"} />
                <AvatarFallback className="text-mint-ink [background-image:var(--grad-brand)] text-3xl font-bold">
                  {getInitials(nameValue)}
                </AvatarFallback>
              </Avatar>

              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-pink-700">Avatar URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/avatar.jpg"
                        className="h-11 rounded-2xl border-(--line-pink) focus-visible:ring-pink-400"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Enter a URL for an image</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-5 md:col-span-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-pink-700">Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter student name"
                        className="h-11 rounded-2xl border-(--line-pink) focus-visible:ring-pink-400"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* The two real rates, side by side and colour-coded so they
                  never get mistaken for one another: pink = in-person (this
                  form's default identity), teal = online (matches the
                  "Online" tag used elsewhere in the app). */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="lessonRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] text-pink-700 uppercase">
                        <MapPin
                          className="size-3.5"
                          aria-hidden="true"
                          focusable="false"
                        />
                        In-Person Rate
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold">
                            {currencySymbol}
                          </span>
                          <Input
                            placeholder="0"
                            type="text"
                            inputMode="numeric"
                            className="text-ink h-11 rounded-2xl border-(--line-pink) bg-pink-50 pl-10 text-base font-semibold tabular-nums focus-visible:ring-pink-400"
                            {...field}
                            onChange={(e) => {
                              const numValue =
                                parseInt(
                                  e.target.value.replace(/\./g, "") || "0",
                                ) || 0;
                              field.onChange(numValue);
                            }}
                            value={
                              field.value
                                ? formatNumberWithSeparators(field.value)
                                : ""
                            }
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Charge amount per completed in-person lesson
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="onlineLessonRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] text-teal-700 uppercase">
                        <Wifi
                          className="size-3.5"
                          aria-hidden="true"
                          focusable="false"
                        />
                        Online Rate
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold">
                            {currencySymbol}
                          </span>
                          <Input
                            placeholder="0"
                            type="text"
                            inputMode="numeric"
                            className="text-ink h-11 rounded-2xl border-teal-200 bg-teal-50 pl-10 text-base font-semibold tabular-nums focus-visible:ring-teal-400"
                            {...field}
                            onChange={(e) => {
                              const numValue =
                                parseInt(
                                  e.target.value.replace(/\./g, "") || "0",
                                ) || 0;
                              field.onChange(numValue);
                            }}
                            value={
                              field.value
                                ? formatNumberWithSeparators(field.value)
                                : ""
                            }
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Charge amount per completed online lesson
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-(--line-pink) bg-pink-50/40 p-4 shadow-(--sh-sm) sm:space-y-5 sm:p-5">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-pink-700">
                    Additional Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about the student..."
                      className="bg-card min-h-32 resize-none rounded-2xl focus-visible:ring-pink-400"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Track important information about the student
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col justify-end gap-2 pt-2 sm:flex-row sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-full sm:h-auto"
              onClick={() => onSuccess?.()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-full [background-image:var(--grad-pink)] px-6 font-semibold text-white shadow-(--sh-pink) transition hover:scale-[1.02] hover:shadow-lg hover:brightness-110 sm:h-auto"
            >
              {isPending
                ? studentId
                  ? "Saving..."
                  : "Creating..."
                : studentId
                  ? "Save Changes"
                  : "Add to Roster"}
            </Button>
          </div>
        </form>
      </Form>

      {student && (
        <div className="space-y-4 rounded-2xl border border-(--line-strong) p-4 sm:p-5">
          <h4 className="text-ink font-serif text-base font-normal">
            Student Information
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-pink-700"
              >
                <User className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="text-ink-soft text-xs font-semibold">
                  Teacher
                </div>
                <div className="text-ink truncate text-sm">
                  {student.teacher.user.name ?? student.teacher.user.email}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700"
              >
                <BookOpen className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="text-ink-soft text-xs font-semibold">
                  Total Lessons
                </div>
                <div className="text-ink text-sm">
                  {student.lessons.length} lessons recorded
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="bg-sand-100 text-sand-700 flex size-8 shrink-0 items-center justify-center rounded-lg"
              >
                <CalendarDays className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="text-ink-soft text-xs font-semibold">
                  Joined
                </div>
                <div className="text-ink text-sm">
                  {new Date(student.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
