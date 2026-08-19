import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/server/auth";

/**
 * The real guard for the hidden rooms.
 *
 * These routes sit outside `(root)`, so they never inherited its session
 * check, and src/proxy.ts alone was not enough to protect them: it tests
 * whether a cookie *named* like a session token is present, never that the
 * token is valid or signed. Anyone could set `authjs.session-token=anything`
 * and walk straight in. That check is deliberately cheap so it never blocks
 * the edge runtime — it is a redirect for signed-out visitors, not a security
 * boundary. The boundary is here, in a server component that decodes the JWT
 * for real.
 *
 * A route group is used rather than three copies of the same check so a new
 * hidden room added under `(secret)/` is protected by construction instead of
 * by remembering.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function SecretLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <>{children}</>;
}
