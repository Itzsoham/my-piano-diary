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
import { Switch } from "@/components/ui/switch";
import { api } from "@/trpc/react";
import { format } from "date-fns";

const LessonFormSchema = z.object({
  studentId: z.string().min(1, { message: "Student is required." }),
  date: z.string().min(1, { message: "Date is required." }),
  time: z.string().min(1, { message: "Time is required." }),
  duration: z.string().min(1, { message: "Duration is required." }),
  isRecurring: z.boolean(),
  dayOfWeek: z.string().optional(),
  recurrenceMonths: z.string().optional(),
});

type LessonFormValues = z.infer<typeof LessonFormSchema>;

interface LessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: { id: string; name: string }[];
  initialDate: Date | null;
  onSuccess?: () => void;
}

export function LessonDialog({
  open,
  onOpenChange,
  students,
  initialDate,
  onSuccess,
}: LessonDialogProps) {
  const utils = api.useUtils();
  const createLesson = api.lesson.create.useMutation({
    onSuccess: () => {
      toast.success("Lesson created successfully!");
      void utils.lesson.invalidate();
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to create lesson");
    },
  });

  const createRecurring = api.lesson.createRecurring.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} lessons created successfully!`);
      void utils.lesson.invalidate();
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to create recurring lessons");
    },
  });

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(LessonFormSchema),
    defaultValues: {
      studentId: "",
      date: initialDate
        ? format(initialDate, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      time: "10:00",
      duration: "60",
      isRecurring: false,
      dayOfWeek: "0", // Sunday
      recurrenceMonths: "1",
    },
  });

  const isRecurring = form.watch("isRecurring");

  const onSubmit = async (data: LessonFormValues) => {
    try {
      if (data.isRecurring) {
        // Create recurring lessons
        const startDate = new Date(`${data.date}T${data.time}`);

        createRecurring.mutate({
          studentId: data.studentId,
          startDate,
          dayOfWeek: parseInt(data.dayOfWeek ?? "0"),
          time: data.time,
          duration: parseInt(data.duration),
          recurrenceMonths: parseInt(data.recurrenceMonths ?? "1"),
        });
      } else {
        // Create single lesson
        const dateTime = new Date(`${data.date}T${data.time}`);

        createLesson.mutate({
          studentId: data.studentId,
          date: dateTime,
          duration: parseInt(data.duration),
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Schedule Lesson</DialogTitle>
          <DialogDescription>
            Create a new lesson for a student
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" min="15" step="15" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Recurring Lesson
                    </FormLabel>
                    <FormDescription>
                      Create multiple lessons on a weekly schedule
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

            {isRecurring && (
              <>
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurrenceMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence Length</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 Month (4 lessons)</SelectItem>
                          <SelectItem value="2">
                            2 Months (8-9 lessons)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Maximum 2 months allowed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

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
                disabled={createLesson.isPending}
                className="flex-1"
              >
                {createLesson.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
