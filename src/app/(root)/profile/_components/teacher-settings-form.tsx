"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Users, BookOpen } from "lucide-react";
import { toast } from "sonner";

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
import { Card, CardContent } from "@/components/ui/card";

const teacherSettingsSchema = z.object({
  hourlyRate: z.coerce.number().min(0, "Hourly rate must be positive"),
});

type TeacherSettingsValues = z.infer<typeof teacherSettingsSchema>;

interface TeacherSettingsFormProps {
  hourlyRate: number;
  stats: {
    students: number;
    lessons: number;
  };
}

export function TeacherSettingsForm({
  hourlyRate,
  stats,
}: TeacherSettingsFormProps) {
  const utils = api.useUtils();

  const form = useForm<TeacherSettingsValues>({
    resolver: zodResolver(teacherSettingsSchema),
    defaultValues: {
      hourlyRate: hourlyRate,
    },
  });

  const updateHourlyRate = api.user.updateHourlyRate.useMutation({
    onSuccess: () => {
      toast.success("Hourly rate updated successfully");
      void utils.user.getProfile.invalidate();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update hourly rate");
    },
  });

  useEffect(() => {
    form.reset({ hourlyRate });
  }, [hourlyRate, form]);

  const onSubmit = (data: TeacherSettingsValues) => {
    updateHourlyRate.mutate({
      hourlyRate: data.hourlyRate,
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
              <Users className="text-primary h-6 w-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Total Students
              </p>
              <h3 className="text-2xl font-bold">{stats.students}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
              <BookOpen className="text-primary h-6 w-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Total Lessons
              </p>
              <h3 className="text-2xl font-bold">{stats.lessons}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Rate Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="hourlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hourly Rate (IDR)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="200000" {...field} />
                </FormControl>
                <FormDescription>
                  Your hourly teaching rate in Indonesian Rupiah
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={updateHourlyRate.isPending}>
              {updateHourlyRate.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
