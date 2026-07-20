import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";
import { AppSidebar } from "./_components/app-sidebar";
import { SiteHeader } from "./_components/site-header";
import { BottomTabBar } from "./_components/bottom-tab-bar";
import { BirthdayBackground } from "@/components/birthday/birthday-background";
import { FloatingElements } from "@/components/birthday/floating-elements";

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
