"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { TRPCReactProvider } from "@/trpc/react";
import { UserStoreProvider } from "./user-store-provider";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { BirthdayProvider } from "@/components/birthday/birthday-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldBypassBirthdayProvider = pathname?.startsWith("/birthday-room");

  const content = shouldBypassBirthdayProvider ? (
    <>
      {children}
      <Toaster />
    </>
  ) : (
    <BirthdayProvider>
      {children}
      <Toaster />
    </BirthdayProvider>
  );

  return (
    <ErrorBoundary componentName="RootProviders">
      <SessionProvider>
        <TRPCReactProvider>
          <UserStoreProvider>{content}</UserStoreProvider>
        </TRPCReactProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
