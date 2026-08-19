import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";
import { AppSidebar } from "./_components/app-sidebar";
import { SiteHeader } from "./_components/site-header";
import { BottomTabBar } from "./_components/bottom-tab-bar";
import { BirthdayBackground } from "@/components/birthday/birthday-background";
import { FloatingElements } from "@/components/birthday/floating-elements";

/**
 * The whole authenticated studio is noindex/nofollow. Every route under this
 * layout redirects to /login without a session, so a crawler can only ever see
 * the redirect — but saying so explicitly keeps those URLs out of Search
 * Console entirely, and stops a shared screenshot URL from being indexed if the
 * auth guard is ever relaxed. The public landing page, login and register keep
 * the root layout's indexable defaults.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      {/* Atmospheric birthday blur orbs — behind everything */}
      <BirthdayBackground />
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--sidebar-width-icon": "4.75rem",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset className="bg-app pb-20 lg:pb-0">
          <SiteHeader />
          {children}
        </SidebarInset>
        <BottomTabBar />
      </SidebarProvider>
      {/* Ambient floating emojis — above content, pointer-events-none */}
      <FloatingElements />
    </>
  );
}
