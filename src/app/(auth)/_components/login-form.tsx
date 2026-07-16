"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { setStoredCurrency } from "@/lib/currency";
import { loginSchema, type LoginInput } from "@/lib/validations/auth-schemas";
import { loginAction } from "@/server/actions/auth-actions";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  DEMO_STEPS,
  type DemoStepKey,
} from "@/server/demo/demo-data";
import { useUserStore } from "@/store/use-user-store";
import { api } from "@/trpc/react";

import { DemoSeedProgress, type StepState } from "./demo-seed-progress";

const initialStepStates = () =>
  Object.fromEntries(DEMO_STEPS.map((s) => [s.key, "pending"])) as Record<
    DemoStepKey,
    StepState
  >;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useUserStore((state) => state.setUser);

  const [isSeeding, setIsSeeding] = useState(false);
  const [stepStates, setStepStates] = useState(initialStepStates);
  const [stepResults, setStepResults] = useState<
    Partial<Record<DemoStepKey, string>>
  >({});
  const [seedError, setSeedError] = useState<string | null>(null);

  const utils = api.useUtils();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);

    try {
      // Create FormData from the validated data
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("remember", String(data.remember ?? false));

      // Call the server action
      const result = await loginAction(formData);

      if (result.success && result.user) {
        toast.success(result.message);
        setUser(result.user);
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Build the demo studio, then sign in. Each step is its own mutation, so the
   * checklist reflects work that actually happened rather than a fake timer.
   */
  const handleDemoLogin = async () => {
    setIsSeeding(true);
    setSeedError(null);
    setStepStates(initialStepStates());
    setStepResults({});

    const mark = (key: DemoStepKey, state: StepState) =>
      setStepStates((prev) => ({ ...prev, [key]: state }));

    // Keyed by step so the UI and the server can't drift apart.
    const runners: Record<DemoStepKey, () => Promise<string>> = {
      setup: async () => {
        const r = await utils.client.demo.setup.mutate();
        return `${r.pieces} pieces`;
      },
      students: async () => {
        const r = await utils.client.demo.students.mutate();
        return `${r.students} students`;
      },
      families: async () => {
        const r = await utils.client.demo.families.mutate();
        return `${r.families} families`;
      },
      lessons: async () => {
        const r = await utils.client.demo.lessons.mutate();
        return `${r.lessons} lessons`;
      },
      attendance: async () => {
        const r = await utils.client.demo.attendance.mutate();
        return `${r.complete} complete · ${r.cancelled} cancelled`;
      },
      reports: async () => {
        const r = await utils.client.demo.reports.mutate();
        return `${r.reports} reports`;
      },
      payments: async () => {
        const r = await utils.client.demo.payments.mutate();
        return `${r.transactions} payments`;
      },
    };

    try {
      for (const step of DEMO_STEPS) {
        mark(step.key, "running");
        const summary = await runners[step.key]();
        setStepResults((prev) => ({ ...prev, [step.key]: summary }));
        mark(step.key, "done");
      }
    } catch (err) {
      const current = DEMO_STEPS.find((s) => stepStates[s.key] === "running");
      if (current) mark(current.key, "error");
      setSeedError(
        err instanceof Error
          ? err.message
          : "Could not build the demo studio. Please try again.",
      );
      setIsSeeding(false);
      return;
    }

    // The demo teacher bills in INR; currency lives in localStorage, not the DB.
    setStoredCurrency("INR");

    form.setValue("email", DEMO_EMAIL);
    form.setValue("password", DEMO_PASSWORD);
    await onSubmit({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      remember: false,
    });
    setIsSeeding(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  id="email"
                  type="email"
                  placeholder="thuyisbest@luv.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center">
              <FormControl>
                <Checkbox
                  id="login-remember"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="size-4"
                />
              </FormControl>
              <FormLabel
                htmlFor="login-remember"
                className="text-muted-foreground ml-1 text-sm font-medium"
              >
                Remember me for 30 days
              </FormLabel>
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>

        <div className="flex items-center gap-3">
          <span className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-xs">or</span>
          <span className="bg-border h-px flex-1" />
        </div>

        {isSeeding || seedError ? (
          <div className="rounded-lg border p-4">
            <DemoSeedProgress
              states={stepStates}
              results={stepResults}
              error={seedError}
            />
            {seedError && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={handleDemoLogin}
              >
                Try again
              </Button>
            )}
          </div>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading}
              onClick={handleDemoLogin}
            >
              🎹 Try the demo
            </Button>
            <p className="text-muted-foreground text-center text-xs">
              Builds a sample studio on the spot — no sign-up needed.
            </p>
          </>
        )}
      </form>
    </Form>
  );
}
