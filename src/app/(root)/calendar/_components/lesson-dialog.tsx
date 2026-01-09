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
import { api } from "@/trpc/react";
import { format } from "date-fns";

const LessonFormSchema = z.object({
  studentId: z.string().min(1, { message: "Student is required." }),
  date: z.string().min(1, { message: "Date is required." }),
  time: z.string().min(1, { message: "Time is required." }),
  duration: z.string().min(1, { message: "Duration is required." }),
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
  const createLesson = api.lesson.create.useMutation();

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(LessonFormSchema),
    defaultValues: {
      studentId: "",
      date: initialDate
        ? format(initialDate, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      time: "10:00",
      duration: "60",
    },
  });

  const onSubmit = async (data: LessonFormValues) => {
    try {
      const dateTime = new Date(`${data.date}T${data.time}`);

      await createLesson.mutateAsync({
        studentId: data.studentId,
        date: dateTime,
        duration: parseInt(data.duration),
      });

      toast.success("Lesson created successfully!");
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
                disabled={form.formState.isSubmitting}
                className="flex-1"
              >
                {form.formState.isSubmitting ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
