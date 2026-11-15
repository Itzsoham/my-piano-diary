import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";
import { PortalHeader } from "./_components/portal-header";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/login");
  }

  // Teachers who land in portal bounce back to studio dashboard
  if (session.user.role === "TEACHER") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-app flex flex-col">
      <PortalHeader user={session.user} />
      <main className="flex-1 pb-16">{children}</main>
    </div>
  );
}
