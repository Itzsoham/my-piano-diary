"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function PasswordForm() {
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updatePassword = api.user.updatePassword.useMutation({
    onSuccess: () => {
      toast.success("Password updated successfully");
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update password");
    },
  });

  const onSubmit = (data: PasswordFormValues) => {
    updatePassword.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  // A lightweight strength read-out for the new-password field — the ONE
  // decorative thing allowed near a form field, because it's the field's own
  // status readout, not decoration (matches the piano-key motif used for the
  // month-progress meters elsewhere in the app).
  const newPasswordValue = form.watch("newPassword");
  const strengthPct = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (Math.min(newPasswordValue.length, 12) / 12) * 70 +
          (/[0-9]/.test(newPasswordValue) ? 15 : 0) +
          (/[^a-zA-Z0-9]|[A-Z]/.test(newPasswordValue) ? 15 : 0),
      ),
    ),
  );
  const strengthLabel =
    newPasswordValue.length === 0
      ? ""
      : strengthPct < 40
        ? "Could be stronger"
        : strengthPct < 75
          ? "Good"
          : "Strong";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink">Current Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter current password"
                  {...field}
                  className="border-border placeholder:text-ink-soft rounded-lg focus-visible:ring-pink-500 focus-visible:ring-offset-0"
                />
              </FormControl>
              <FormDescription className="text-ink-soft">
                Enter your current password to verify your identity
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink">New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  {...field}
                  className="border-border placeholder:text-ink-soft rounded-lg focus-visible:ring-pink-500 focus-visible:ring-offset-0"
                />
              </FormControl>
              {newPasswordValue.length > 0 && (
                <div className="pt-0.5">
                  <span
                    className="relative block h-2.5 overflow-hidden rounded-full"
                    role="img"
                    aria-label={`Password strength: ${strengthLabel}`}
                    style={{
                      background: "var(--surface-2)",
                      boxShadow: "inset 0 0 0 1px var(--line-strong)",
                    }}
                  >
                    <i
                      className="absolute inset-y-0 left-0 block transition-[width] duration-300"
                      style={{
                        width: `${strengthPct}%`,
                        background:
                          strengthPct < 40
                            ? "var(--sand-300)"
                            : strengthPct < 75
                              ? "var(--wintergreen)"
                              : "var(--grad-mint)",
                      }}
                    />
                  </span>
                  <p className="text-ink-soft mt-1 text-xs font-semibold">
                    {strengthLabel}
                  </p>
                </div>
              )}
              <FormDescription className="text-ink-soft">
                Must be at least 6 characters long
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink">Confirm New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  {...field}
                  className="border-border placeholder:text-ink-soft rounded-lg focus-visible:ring-pink-500 focus-visible:ring-offset-0"
                />
              </FormControl>
              <FormDescription className="text-ink-soft">
                Re-enter your new password to confirm
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updatePassword.isPending || !form.formState.isValid}
            className="rounded-full [background-image:var(--grad-pink)] px-6 text-white shadow-(--sh-pink) hover:brightness-105"
          >
            {updatePassword.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
