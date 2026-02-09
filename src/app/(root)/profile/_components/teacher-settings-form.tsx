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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currencyOptions, useCurrency } from "@/lib/currency";

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
  const { currency, setCurrency } = useCurrency();

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
        <Card className="border-slate-100 bg-slate-50/50 shadow-none">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100/50">
              <Users className="h-6 w-6 text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Students
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {stats.students}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-slate-50/50 shadow-none">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100/50">
              <BookOpen className="h-6 w-6 text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Lessons
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {stats.lessons}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Rate Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Hourly Rate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="200000"
                      {...field}
                      className="rounded-lg border-slate-200 placeholder:text-slate-400 focus-visible:ring-rose-500 focus-visible:ring-offset-0"
                    />
                  </FormControl>
                  <FormDescription className="text-slate-500">
                    Used to calculate your monthly earnings
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel className="text-slate-700">Currency</FormLabel>
              <FormControl>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="rounded-lg border-slate-200 focus-visible:ring-rose-500 focus-visible:ring-offset-0">
                    <SelectValue placeholder="VND" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription className="text-slate-500">
                Used to format currency across the system
              </FormDescription>
            </FormItem>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="submit"
              disabled={updateHourlyRate.isPending}
              className="rounded-lg bg-rose-500 px-6 text-white hover:bg-rose-600"
            >
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
