"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth-schemas";
import { registerAction } from "@/server/actions/auth-actions";
import { useUserStore } from "@/store/use-user-store";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const setUser = useUserStore((state) => state.setUser);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // A plain 3-segment strength readout — decorative, but it's the field's own
  // status readout (the word is the accessible truth), same family as the
  // piano-key meters used elsewhere in the app.
  const passwordValue = form.watch("password");
  const strengthLevel = (() => {
    if (passwordValue.length < 6) return 0;
    let pts = 0;
    if (passwordValue.length >= 8) pts++;
    if (passwordValue.length >= 12) pts++;
    if (/[A-Z]/.test(passwordValue) && /[a-z]/.test(passwordValue)) pts++;
    if (/\d/.test(passwordValue)) pts++;
    if (/[^A-Za-z0-9]/.test(passwordValue)) pts++;
    return pts <= 1 ? 1 : pts <= 3 ? 2 : 3;
  })();
  const strengthWords = ["Too short", "Fair", "Good", "Strong"];
  const strengthColors = [
    "var(--danger-fg)",
    "var(--sand-700)",
    "var(--pink-700)",
    "var(--teal-700)",
  ];
  const strengthFills = [
    "",
    "var(--sand-300)",
    "var(--bubblegum)",
    "var(--wintergreen)",
  ];

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);

    try {
      // Create FormData from the validated data
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);

      // Call the server action
      const result = await registerAction(formData);

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink">Full Name</FormLabel>
              <FormControl>
                <Input
                  id="name"
                  type="text"
                  placeholder="Soham's Wife"
                  autoComplete="name"
                  className="h-12 rounded-full border-(--line-pink) px-4 focus-visible:ring-pink-500"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink">Email Address</FormLabel>
              <FormControl>
                <Input
                  id="email"
                  type="email"
                  placeholder="danthuy@iloveyou.com"
                  autoComplete="email"
                  className="h-12 rounded-full border-(--line-pink) px-4 focus-visible:ring-pink-500"
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
              <FormLabel className="text-ink">Password</FormLabel>
              <FormControl>
                <div className="relative flex">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-12 rounded-full border-(--line-pink) px-4 pr-12 focus-visible:ring-pink-500"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-pressed={showPassword}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="text-ink-soft hover:text-ink absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-full hover:bg-(--surface-2)"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4.5" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </FormControl>
              {passwordValue.length > 0 && (
                <div className="pt-0.5">
                  <div className="grid h-1.75 grid-cols-3 gap-1.5">
                    {[1, 2, 3].map((segment) => (
                      <span
                        key={segment}
                        aria-hidden="true"
                        className="rounded-full transition-colors"
                        style={{
                          background:
                            segment <= strengthLevel
                              ? strengthFills[strengthLevel]
                              : "var(--line-strong)",
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span
                      className="text-[11.5px] font-bold"
                      style={{ color: strengthColors[strengthLevel] }}
                    >
                      {strengthWords[strengthLevel]}
                    </span>
                    <span className="text-ink-soft text-[11px]">
                      Min. 6 characters
                    </span>
                  </div>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink">Confirm Password</FormLabel>
              <FormControl>
                <div className="relative flex">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-12 rounded-full border-(--line-pink) px-4 pr-12 focus-visible:ring-pink-500"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-pressed={showConfirm}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className="text-ink-soft hover:text-ink absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-full hover:bg-(--surface-2)"
                  >
                    {showConfirm ? (
                      <EyeOff className="size-4.5" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className="h-12 w-full rounded-full [background-image:var(--grad-pink)] text-white shadow-(--sh-pink) hover:brightness-105"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Register"}
        </Button>
      </form>
    </Form>
  );
}
