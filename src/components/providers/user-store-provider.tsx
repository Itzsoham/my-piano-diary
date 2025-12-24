"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/use-user-store";

export function UserStoreProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const setUser = useUserStore((state) => state.setUser);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration to prevent mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUser({
        id: (session.user as any).id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      });
    } else if (status === "unauthenticated") {
      // We don't necessarily want to clear here if we want to keep some data
      // but usually if session is gone, user should be null
      // Use it carefully if you have public info
    }
  }, [session, status, setUser]);

  if (!isHydrated) return null;

  return <>{children}</>;
}
