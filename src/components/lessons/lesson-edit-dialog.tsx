"use client";

import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { format } from "date-fns";
import { PencilLine } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { api } from "@/trpc/react";

const LessonEditSchema = z.object({
  date: z.date({ required_error: "Date is required" }),
  time: z.string().min(1, "Time is required"),
  duration: z.string().min(1, "Duration is required"),
  status: z.enum(["PENDING", "COMPLETE", "CANCELLED"]),
  pieceId: z.string().optional(),
});

type LessonEditValues = z.infer<typeof LessonEditSchema>;

interface LessonEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: {
    id: string;
    studentName: string;
    date: Date;
    duration: number;
    status: "PENDING" | "COMPLETE" | "CANCELLED";
    pieceId: string | null;
  };
  onSuccess?: () => void;
}

export function LessonEditDialog({
  open,
  onOpenChange,
  lesson,
  onSuccess,
}: LessonEditDialogProps) {
  const utils = api.useUtils();
  const { data: pieces = [] } = api.piece.getAll.useQuery(undefined, {
    enabled: open,
  });

  const updateLesson = api.lesson.update.useMutation({
    onSuccess: () => {
      toast.success("Lesson updated successfully");
      void utils.lesson.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update lesson");
    },
  });

  const form = useForm<LessonEditValues>({
    resolver: zodResolver(LessonEditSchema),
    defaultValues: {
      date: lesson.date,
      time: format(lesson.date, "HH:mm"),
      duration: lesson.duration.toString(),
      status: lesson.status,
      pieceId: lesson.pieceId ?? "none",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      date: lesson.date,
      time: format(lesson.date, "HH:mm"),
      duration: lesson.duration.toString(),
      status: lesson.status,
      pieceId: lesson.pieceId ?? "none",
    });
  }, [open, lesson, form]);

  const onSubmit = (data: LessonEditValues) => {
    const [hours = "0", minutes = "0"] = data.time.split(":");
    const dateTime = new Date(data.date);
    dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    const pieceId = data.pieceId === "none" ? null : data.pieceId;

    updateLesson.mutate({
      id: lesson.id,
      date: dateTime,
      duration: parseInt(data.duration),
      status: data.status,
      pieceId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-115">
        <DialogHeader className="space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 sm:h-12 sm:w-12">
            <PencilLine className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <DialogTitle className="text-center text-xl sm:text-2xl">
            Edit lesson
          </DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base">
            Update lesson details for {lesson.studentName}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-5"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        onDateChange={field.onChange}
                        className="w-full"
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
                      <Input className="bg-card" type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min)</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-card"
                        type="number"
                        min={15}
                        max={480}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-card">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="COMPLETE">Complete</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pieceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Piece</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Choose a piece" />
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

            <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 sm:h-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateLesson.isPending}
                className="h-10 sm:h-auto"
              >
                {updateLesson.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
