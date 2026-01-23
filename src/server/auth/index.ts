import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

/**
 * Helper function to get the server-side auth session
 * Use this in server components and API routes
 */
export const getServerAuthSession = () => auth();

export { auth, handlers, signIn, signOut };
