"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/use-user-store";

/**
 * Mirrors the NextAuth session into the user store.
 *
 * It renders `children` unconditionally, and that is load-bearing. This
 * provider sits inside the root layout, so it wraps every route including the
 * public landing page at "/" — an earlier `if (!isHydrated) return null` meant
 * the server shipped an empty <body> and the whole site only existed after
 * React hydrated: no content for crawlers or link-preview bots, and a blank
 * first paint for everyone. There is nothing here that needs to wait for
 * hydration anyway; the only write happens in an effect.
 */
export function UserStoreProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUser({
        id: (session.user as { id: string }).id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      });
    }
    // Deliberately no `else` for "unauthenticated": signing out clears the
    // store explicitly, and blanking it here would also wipe cached profile
    // data during the moment the session is still being fetched.
  }, [session, status, setUser]);

  return <>{children}</>;
}
