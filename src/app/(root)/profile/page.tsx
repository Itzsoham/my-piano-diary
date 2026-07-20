"use client";

import { AppLoader } from "@/components/ui/app-loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { ProfileForm } from "./_components/profile-form";
import { PasswordForm } from "./_components/password-form";
import { TeacherSettingsForm } from "./_components/teacher-settings-form";
import { ProfileHero } from "./_components/profile-hero";

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
        <p className="text-ink-soft">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-5 pb-6 md:gap-6 md:pb-10">
        <ProfileHero name={profile.name} />

        <div className="mx-auto w-full max-w-4xl px-4 lg:px-6">
          <Tabs defaultValue="profile" className="w-full">
            {/* Scrollable container for mobile tabs */}
            <div className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
              <TabsList className="mb-2 h-auto w-auto min-w-full justify-start gap-2 rounded-none border-b border-transparent bg-transparent p-0 sm:mb-8">
                <TabsTrigger
                  value="profile"
                  className="text-ink-soft hover:text-ink shrink-0 rounded-full border-0 px-4 py-2 text-sm font-medium whitespace-nowrap transition-all hover:bg-(--surface-2) data-[state=active]:bg-pink-100 data-[state=active]:font-semibold data-[state=active]:text-pink-700 data-[state=active]:shadow-none sm:px-6 sm:py-2.5 sm:text-base"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="password"
                  className="text-ink-soft hover:text-ink shrink-0 rounded-full border-0 px-4 py-2 text-sm font-medium whitespace-nowrap transition-all hover:bg-(--surface-2) data-[state=active]:bg-pink-100 data-[state=active]:font-semibold data-[state=active]:text-pink-700 data-[state=active]:shadow-none sm:px-6 sm:py-2.5 sm:text-base"
                >
                  Password
                </TabsTrigger>
                <TabsTrigger
                  value="teacher"
                  className="text-ink-soft hover:text-ink shrink-0 rounded-full border-0 px-4 py-2 text-sm font-medium whitespace-nowrap transition-all hover:bg-(--surface-2) data-[state=active]:bg-pink-100 data-[state=active]:font-semibold data-[state=active]:text-pink-700 data-[state=active]:shadow-none sm:px-6 sm:py-2.5 sm:text-base"
                >
                  <span className="sm:hidden">Teacher</span>
                  <span className="hidden sm:inline">Teacher Settings</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile" className="mt-0">
              <Card className="border-border overflow-hidden rounded-[1.75rem] p-0 shadow-(--sh-lg)">
                <div className="border-b border-(--line-pink) bg-[linear-gradient(160deg,var(--pink-50),var(--surface)_80%)] p-6 pb-6 sm:p-8">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <Avatar className="border-card h-24 w-24 border-4 shadow-(--sh-sm)">
                      <AvatarImage
                        src={profile.image ?? ""}
                        alt={profile.name ?? ""}
                      />
                      <AvatarFallback className="text-mint-ink [background-image:var(--grad-brand)] text-2xl font-semibold">
                        {profile.name?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h2 className="text-ink font-serif text-xl font-normal">
                        {profile.name}
                      </h2>
                      <p className="text-sm font-medium text-pink-700">
                        This is how students see you
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="mb-6">
                    <h3 className="text-ink text-lg font-semibold">
                      Profile Information
                    </h3>
                    <p className="text-ink-soft text-sm">
                      Update your personal information
                    </p>
                  </div>
                  <ProfileForm profile={profile} />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="password" className="mt-0">
              <Card className="border-border overflow-hidden rounded-[1.75rem] shadow-(--sh-lg)">
                <div className="p-6 sm:p-8">
                  <div className="mb-6">
                    <h3 className="text-ink text-lg font-semibold">
                      Keep your account safe
                    </h3>
                    <p className="text-ink-soft text-sm">
                      A strong password keeps your piano diary safe.
                    </p>
                  </div>
                  <PasswordForm />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="teacher" className="mt-0">
              <Card className="border-border overflow-hidden rounded-[1.75rem] shadow-(--sh-lg)">
                <div className="p-6 sm:p-8">
                  <div className="mb-6">
                    <h3 className="text-ink text-lg font-semibold">
                      Teacher Settings
                    </h3>
                    <p className="text-ink-soft text-sm">
                      Manage your teaching profile and rates
                    </p>
                  </div>
                  <TeacherSettingsForm
                    stats={{
                      students: profile.teacher?._count.students ?? 0,
                      lessons: profile.teacher?._count.lessons ?? 0,
                    }}
                    initialTimezone={profile.timezone}
                  />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
