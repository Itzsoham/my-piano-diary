"use client";

import { useEffect } from "react";
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

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  profile: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const utils = api.useUtils();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile.name ?? "",
      email: profile.email ?? "",
      image: profile.image ?? "",
    },
  });

  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      void utils.user.getProfile.invalidate();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update profile");
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name ?? "",
        email: profile.email ?? "",
        image: profile.image ?? "",
      });
    }
  }, [profile, form]);

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate({
      name: data.name,
      email: data.email,
      image: data.image,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700">Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your name"
                  {...field}
                  className="rounded-lg border-slate-200 placeholder:text-slate-400 focus-visible:ring-rose-500 focus-visible:ring-offset-0"
                />
              </FormControl>
              <FormDescription className="text-slate-500">
                Shown to your students and in lessons
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  {...field}
                  className="rounded-lg border-slate-200 placeholder:text-slate-400 focus-visible:ring-rose-500 focus-visible:ring-offset-0"
                />
              </FormControl>
              <FormDescription className="text-slate-500">
                Your email address for login and notifications
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700">Profile picture</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/avatar.jpg"
                  {...field}
                  className="rounded-lg border-slate-200 placeholder:text-slate-400 focus-visible:ring-rose-500 focus-visible:ring-offset-0"
                />
              </FormControl>
              <FormDescription className="text-slate-500">
                Enter a URL to an image for your profile picture
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateProfile.isPending}
            className="rounded-lg bg-rose-500 px-6 text-white hover:bg-rose-600"
          >
            {updateProfile.isPending ? (
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
  );
}
