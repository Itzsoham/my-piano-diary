"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  currencyOptions,
  useCurrency,
  type CurrencyCode,
} from "@/lib/currency";
import { COMMON_TIMEZONES, getBrowserTimezone } from "@/lib/timezone";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";

const teacherSettingsSchema = z.object({
  currency: z.string(),
  timezone: z.string().min(1, "Timezone is required"),
});

type TeacherSettingsValues = z.infer<typeof teacherSettingsSchema>;

interface TeacherSettingsFormProps {
  stats: {
    students: number;
    lessons: number;
  };
  initialTimezone: string;
}

export function TeacherSettingsForm({
  stats,
  initialTimezone,
}: TeacherSettingsFormProps) {
  const { currency, setCurrency } = useCurrency();
  const utils = api.useUtils();

  const form = useForm<TeacherSettingsValues>({
    resolver: zodResolver(teacherSettingsSchema),
    defaultValues: {
      currency: currency,
      timezone: initialTimezone || "UTC",
    },
  });

  const updateTimezone = api.user.updateTimezone.useMutation({
    onSuccess: () => {
      void utils.user.getProfile.invalidate();
      toast.success("Settings updated successfully");
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update timezone");
    },
  });

  useEffect(() => {
    form.reset({
      currency,
      timezone: initialTimezone || getBrowserTimezone() || "UTC",
    });
  }, [currency, initialTimezone, form]);

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency as CurrencyCode);
    toast.success("Currency updated successfully");
  };

  const onTimezoneChange = async (newTimezone: string) => {
    form.setValue("timezone", newTimezone);
    try {
      await updateTimezone.mutateAsync({
        timezone: newTimezone,
      });
    } catch {
      // Error handled by mutation
    }
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

      {/* Settings Form */}
      <Form {...form}>
        <form className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="currency"
              render={() => (
                <FormItem>
                  <FormLabel className="text-slate-700">Currency</FormLabel>
                  <FormControl>
                    <Select
                      value={currency}
                      onValueChange={handleCurrencyChange}
                    >
                      <SelectTrigger className="rounded-lg border-slate-200 focus-visible:ring-rose-500 focus-visible:ring-offset-0">
                        <SelectValue placeholder="VND" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map(
                          (option: { code: string; label: string }) => (
                            <SelectItem key={option.code} value={option.code}>
                              {option.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription className="text-slate-500">
                    Used to format currency across the system
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Timezone</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={onTimezoneChange}
                      disabled={updateTimezone.isPending}
                    >
                      <SelectTrigger className="rounded-lg border-slate-200 focus-visible:ring-rose-500 focus-visible:ring-offset-0">
                        {updateTimezone.isPending ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Updating...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Select your timezone" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_TIMEZONES.map(
                          (timezone: { label: string; value: string }) => (
                            <SelectItem
                              key={timezone.value}
                              value={timezone.value}
                            >
                              {timezone.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription className="text-slate-500">
                    Your single timezone setting for all scheduling
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </div>
  );
}
