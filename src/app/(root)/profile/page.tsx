"use client";

import { AppLoader } from "@/components/ui/app-loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { ProfileForm } from "./_components/profile-form";
import { PasswordForm } from "./_components/password-form";
import { TeacherSettingsForm } from "./_components/teacher-settings-form";

export default function ProfilePage() {
  const { data: profile, isLoading } = api.user.getProfile.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-var(--header-height))] items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-[calc(100vh-var(--header-height))] items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Profile Settings
        </h1>
        <p className="text-lg text-slate-500">
          Your personal space and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-8 h-auto w-full justify-start gap-2 rounded-none border-b border-transparent bg-transparent p-0">
          <TabsTrigger
            value="profile"
            className="rounded-full border-0 px-6 py-2.5 font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 data-[state=active]:bg-rose-50 data-[state=active]:font-semibold data-[state=active]:text-rose-700 data-[state=active]:shadow-none"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="password"
            className="rounded-full border-0 px-6 py-2.5 font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 data-[state=active]:bg-rose-50 data-[state=active]:font-semibold data-[state=active]:text-rose-700 data-[state=active]:shadow-none"
          >
            Password
          </TabsTrigger>
          <TabsTrigger
            value="teacher"
            className="rounded-full border-0 px-6 py-2.5 font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 data-[state=active]:bg-rose-50 data-[state=active]:font-semibold data-[state=active]:text-rose-700 data-[state=active]:shadow-none"
          >
            Teacher Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <Card className="overflow-hidden rounded-2xl border-slate-100 p-0 shadow-xl ring-1 shadow-slate-200/40 ring-slate-900/5">
            <div className="border-b border-rose-100/50 bg-rose-50/50 p-8 pb-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
                  <AvatarImage
                    src={profile.image ?? ""}
                    alt={profile.name ?? ""}
                  />
                  <AvatarFallback className="bg-rose-100 text-2xl font-semibold text-rose-500">
                    {profile.name?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {profile.name}
                  </h2>
                  <p className="text-sm font-medium text-rose-500">
                    This is how students see you
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900">
                  Profile Information
                </h3>
                <p className="text-sm text-slate-500">
                  Update your personal information
                </p>
              </div>
              <ProfileForm profile={profile} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="mt-0">
          <Card className="overflow-hidden rounded-2xl border-slate-100 shadow-xl ring-1 shadow-slate-200/40 ring-slate-900/5">
            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900">
                  Keep your account safe
                </h3>
                <p className="text-sm text-slate-500">
                  A strong password keeps your piano diary safe.
                </p>
              </div>
              <PasswordForm />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="teacher" className="mt-0">
          <Card className="overflow-hidden rounded-2xl border-slate-100 shadow-xl ring-1 shadow-slate-200/40 ring-slate-900/5">
            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900">
                  Teacher Settings
                </h3>
                <p className="text-sm text-slate-500">
                  Manage your teaching profile and rates
                </p>
              </div>
              <TeacherSettingsForm
                hourlyRate={profile.teacher?.hourlyRate ?? 200000}
                stats={{
                  students: profile.teacher?._count.students ?? 0,
                  lessons: profile.teacher?._count.lessons ?? 0,
                }}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
