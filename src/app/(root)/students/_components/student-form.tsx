"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
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
const studentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatar: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
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

  // Fetch student data only if we have an ID (edit mode)
  const { data: student, isLoading } = api.student.getByGuid.useQuery(
    { id: studentId! },
    { enabled: !!studentId },
  );

  const createMutation = api.student.create.useMutation({
    onSuccess: () => {
      toast.success("Student created successfully");
      void utils.student.getAll.invalidate();
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
    },
  });

  React.useEffect(() => {
    if (student) {
      form.reset({
        name: student.name,
        avatar: student.avatar ?? "",
        notes: student.notes ?? "",
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
      });
    } else {
      createMutation.mutate({
        ...data,
        avatar: data.avatar ?? undefined,
        notes: data.notes ?? undefined,
      });
    }
  };

  const isPending = createMutation.isPending ?? updateMutation.isPending;

  if (studentId && isLoading) {
    return (
      <div className="flex h-50 items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter student name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/avatar.jpg"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter a URL to an image for the student avatar
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any notes about the student..."
                    className="min-h-25"
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

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSuccess?.()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {studentId ? "Saving..." : "Creating..."}
                </>
              ) : (
                <>{studentId ? "Save Changes" : "Add Student"}</>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {student && (
        <div className="space-y-4 rounded-lg border p-4">
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
