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

const currencySettingsSchema = z.object({
  currency: z.string(),
});

type CurrencySettingsValues = z.infer<typeof currencySettingsSchema>;

interface TeacherSettingsFormProps {
  stats: {
    students: number;
    lessons: number;
  };
}

export function TeacherSettingsForm({ stats }: TeacherSettingsFormProps) {
  const { currency, setCurrency } = useCurrency();

  const form = useForm<CurrencySettingsValues>({
    resolver: zodResolver(currencySettingsSchema),
    defaultValues: {
      currency: currency,
    },
  });

  useEffect(() => {
    form.reset({ currency });
  }, [currency, form]);

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency as CurrencyCode);
    toast.success("Currency updated successfully");
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

      {/* Currency Settings Form */}
      <Form {...form}>
        <form className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
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
              )}
            />
          </div>
        </form>
      </Form>
    </div>
  );
}
