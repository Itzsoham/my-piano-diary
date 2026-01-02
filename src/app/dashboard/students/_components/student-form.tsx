"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const studentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatar: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  studentId: string;
}

export function StudentForm({ studentId }: StudentFormProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: student, isLoading } = api.student.getByGuid.useQuery({
    id: studentId,
  });

  const updateMutation = api.student.update.useMutation({
    onSuccess: () => {
      toast.success("Student updated successfully");
      void utils.student.getAll.invalidate();
      void utils.student.getByGuid.invalidate({ id: studentId });
      router.push("/dashboard/students");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update student");
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
        avatar: student.avatar || "",
        notes: student.notes || "",
      });
    }
  }, [student, form]);

  const onSubmit = (data: StudentFormValues) => {
    updateMutation.mutate({
      id: studentId,
      ...data,
      avatar: data.avatar || undefined,
      notes: data.notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Student not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Student</CardTitle>
          <CardDescription>
            Update student information and track their progress
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      Enter a URL to an image for the student's avatar
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
                        className="min-h-[100px]"
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

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/students")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>
            Additional details about {student.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="text-sm font-medium">Teacher</div>
            <div className="text-muted-foreground text-sm">
              {student.teacher.user.name || student.teacher.user.email}
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
        </CardContent>
      </Card>
    </div>
  );
}
