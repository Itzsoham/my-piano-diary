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
import { loginSchema, type LoginInput } from "@/lib/validations/auth-schemas";
import { loginAction } from "@/server/actions/auth-actions";
import { useUserStore } from "@/store/use-user-store";

const DEMO_CREDENTIALS = {
  email: "demo@pianodiary.dev",
  password: "demo1234",
} as const;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useUserStore((state) => state.setUser);

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

  // Fill the fields so the credentials are visible, then sign straight in.
  const handleDemoLogin = async () => {
    form.setValue("email", DEMO_CREDENTIALS.email);
    form.setValue("password", DEMO_CREDENTIALS.password);
    await onSubmit({ ...DEMO_CREDENTIALS, remember: false });
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
          Explore a sample studio — {DEMO_CREDENTIALS.email} /{" "}
          {DEMO_CREDENTIALS.password}
        </p>
      </form>
    </Form>
  );
}
