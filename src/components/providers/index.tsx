"use client";

import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "@/trpc/react";
import { UserStoreProvider } from "./user-store-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCReactProvider>
        <UserStoreProvider>{children}</UserStoreProvider>
      </TRPCReactProvider>
    </SessionProvider>
  );
}
