"use client";

import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "@/trpc/react";
import { UserStoreProvider } from "./user-store-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCReactProvider>
        <UserStoreProvider>
          {children}
          <Toaster />
        </UserStoreProvider>
      </TRPCReactProvider>
    </SessionProvider>
  );
}
