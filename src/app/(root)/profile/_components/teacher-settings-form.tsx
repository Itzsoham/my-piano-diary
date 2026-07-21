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
import { LogoPicker } from "./logo-picker";

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
        <Card className="border-border bg-(--surface-2) shadow-none">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100">
              <Users className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <p className="text-ink-soft text-sm font-medium">
                Total Students
              </p>
              <h3 className="text-ink text-2xl font-bold tabular-nums">
                {stats.students}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-(--surface-2) shadow-none">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100">
              <BookOpen className="h-6 w-6 text-teal-700" />
            </div>
            <div>
              <p className="text-ink-soft text-sm font-medium">Total Lessons</p>
              <h3 className="text-ink text-2xl font-bold tabular-nums">
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
                  <FormLabel className="text-ink">Currency</FormLabel>
                  <FormControl>
                    <Select
                      value={currency}
                      onValueChange={handleCurrencyChange}
                    >
                      <SelectTrigger className="border-border rounded-lg focus-visible:ring-pink-500 focus-visible:ring-offset-0">
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
                  <FormDescription className="text-ink-soft">
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
                  <FormLabel className="text-ink">Timezone</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={onTimezoneChange}
                      disabled={updateTimezone.isPending}
                    >
                      <SelectTrigger className="border-border rounded-lg focus-visible:ring-pink-500 focus-visible:ring-offset-0">
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
                  <FormDescription className="text-ink-soft">
                    Your single timezone setting for all scheduling
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>

      <div className="border-border border-t pt-6">
        <LogoPicker />
      </div>
    </div>
  );
}
