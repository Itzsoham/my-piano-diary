"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Music2, Sparkles } from "lucide-react";
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
  pieceId: z.string().optional(),
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

  // Fetch pieces for dropdown
  const { data: pieces = [] } = api.piece.getAll.useQuery(undefined, {
    enabled: open,
  });

  const createLesson = api.lesson.create.useMutation({
    onSuccess: () => {
      toast.success("Lesson created successfully! 💗");
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
      toast.success(`${data.count} lessons scheduled beautifully! ✨`);
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
      pieceId: "none",
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

  useEffect(() => {
    if (open) {
      form.reset({
        studentId: "",
        pieceId: "none",
        date: initialDate
          ? format(initialDate, "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
        time: "10:00",
        duration: "60",
        isRecurring: false,
        dayOfWeek: "0",
        recurrenceMonths: "1",
      });
    }
  }, [open, initialDate, form]);

  const isRecurring = form.watch("isRecurring");

  const onSubmit = async (data: LessonFormValues) => {
    try {
      // Convert "none" to undefined for pieceId
      const pieceId = data.pieceId === "none" ? undefined : data.pieceId;

      if (data.isRecurring) {
        // Create recurring lessons
        const startDate = new Date(`${data.date}T${data.time}`);

        createRecurring.mutate({
          studentId: data.studentId,
          pieceId,
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
          pieceId,
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
      <DialogContent className="sm:max-w-[450px]">
        {/* Header with icon */}
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100 shadow-lg shadow-pink-100/40">
            <Music2 className="h-6 w-6 text-pink-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Schedule a lesson 💗
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable form content */}
        <div className="max-h-[calc(85vh-180px)] overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Basic lesson details section */}
              <div className="space-y-4 rounded-xl bg-gradient-to-br from-pink-50/50 to-purple-50/50 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Which student?" />
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
                    name="pieceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Piece</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Any piece?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {pieces.map((piece) => (
                              <SelectItem key={piece.id} value={piece.id}>
                                {piece.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="rounded-xl"
                            {...field}
                          />
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
                          <Input
                            type="time"
                            className="rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="15"
                          step="15"
                          className="rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Recurring toggle */}
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-pink-200/60 bg-white p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">
                        Recurring lesson
                      </FormLabel>
                      <FormDescription className="text-sm">
                        We'll take care of scheduling for you ✨
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

              {/* Progressive disclosure - recurring fields */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isRecurring ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-4 rounded-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-purple-700">
                    <Sparkles className="h-4 w-4" />
                    <span>Recurring schedule</span>
                  </div>

                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of week</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Choose a day" />
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
                        <FormLabel>How long?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">
                              1 Month (4 lessons)
                            </SelectItem>
                            <SelectItem value="2">
                              2 Months (8-9 lessons)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Maximum 2 months to keep things flexible
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createLesson.isPending || createRecurring.isPending}
                  className="flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  {createLesson.isPending || createRecurring.isPending
                    ? "Creating..."
                    : "Create lesson"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
