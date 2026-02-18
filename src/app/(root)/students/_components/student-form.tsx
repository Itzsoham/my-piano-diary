"use client";

import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

const studentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatar: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
  lessonRate: z
    .number()
    .int("Lesson rate must be an integer")
    .min(0, "Lesson rate must be 0 or greater")
    .max(10000000, "Lesson rate seems unreasonably high"),
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

  // Fetch student data only if we have an ID (edit mode)
  const { data: student, isLoading } = api.student.getByGuid.useQuery(
    { id: studentId! },
    { enabled: !!studentId },
  );

  const createMutation = api.student.create.useMutation({
    onSuccess: () => {
      toast.success("Student created successfully");
      void utils.student.getAll.invalidate();
      router.refresh();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to create student");
    },
  });

  const updateMutation = api.student.update.useMutation({
    onSuccess: () => {
      toast.success("Student updated successfully");
      void utils.student.getAll.invalidate();
      router.refresh();
      if (studentId) {
        void utils.student.getByGuid.invalidate({ id: studentId });
      }
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update student");
    },
  });

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      avatar: "",
      notes: "",
      lessonRate: 0,
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
      });
    } else {
      createMutation.mutate({
        ...data,
        avatar: data.avatar ?? undefined,
        notes: data.notes ?? undefined,
        lessonRate: data.lessonRate,
      });
    }
  };

  const isPending = createMutation.isPending ?? updateMutation.isPending;

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
    <div className="space-y-4 sm:space-y-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 sm:space-y-10"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center gap-4 text-center md:col-span-1 md:items-start md:text-left">
              <div className="flex w-full items-center justify-center gap-4">
                <Avatar className="size-24 rounded-full shadow-md ring-4 ring-pink-200">
                  <AvatarImage src={avatarUrl} alt={nameValue || "Avatar"} />
                  <AvatarFallback>{getInitials(nameValue)}</AvatarFallback>
                </Avatar>
                {/* <div>
                  <p className="text-muted-foreground text-sm">Preview</p>
                </div> */}
              </div>

              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="mx-auto">Avatar URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/avatar.jpg"
                        className="h-11 rounded-2xl focus-visible:ring-pink-400"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Enter a URL for an image</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 md:col-span-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter student name"
                        className="h-11 rounded-2xl focus-visible:ring-pink-400"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lessonRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate Per Lesson</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                          đ
                        </span>
                        <Input
                          placeholder="0"
                          type="number"
                          className="h-11 rounded-2xl bg-pink-50 pl-8 text-base font-semibold focus-visible:ring-pink-400"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Charge amount per completed lesson
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-xl bg-pink-50/50 p-4 shadow-sm sm:space-y-6">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about the student..."
                      className="min-h-32 resize-none rounded-2xl focus-visible:ring-pink-400"
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

          <div className="flex flex-col justify-end gap-2 pt-4 sm:flex-row sm:gap-3 sm:pt-6">
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-full sm:h-auto"
              onClick={() => onSuccess?.()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-full bg-pink-500 px-6 font-medium text-white shadow-sm transition hover:scale-[1.02] hover:bg-pink-600 hover:shadow-lg sm:h-auto"
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
        <div className="space-y-3 rounded-lg border p-3 sm:space-y-4 sm:p-4">
          <h4 className="font-semibold">Student Information</h4>
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium">Teacher</div>
              <div className="text-muted-foreground text-sm">
                {student.teacher.user.name ?? student.teacher.user.email}
              </div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Total Lessons</div>
              <div className="text-muted-foreground text-sm">
                {student.lessons.length} lessons recorded
              </div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Joined</div>
              <div className="text-muted-foreground text-sm">
                {new Date(student.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
