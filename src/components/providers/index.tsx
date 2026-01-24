"use client";

import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "@/trpc/react";
import { UserStoreProvider } from "./user-store-provider";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary componentName="RootProviders">
      <SessionProvider>
        <TRPCReactProvider>
          <UserStoreProvider>
            {children}
            <Toaster />
          </UserStoreProvider>
        </TRPCReactProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
