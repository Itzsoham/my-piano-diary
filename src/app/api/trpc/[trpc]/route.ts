import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "@/env";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { logError } from "@/lib/error-handler";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = (req: NextRequest) => {
  try {
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: () => createContext(req),
      onError: ({ path, error }) => {
        logError(`tRPC failed on ${path ?? "<no-path>"}`, error, {
          component: "tRPC API",
          context: {
            path,
            endpoint: "/api/trpc",
          },
          severity: "error",
        });

        if (env.NODE_ENV === "development") {
          console.error(
            `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
          );
        }
      },
    });
  } catch (error) {
    logError("tRPC handler error", error, {
      component: "tRPC Handler",
      context: {
        url: req.nextUrl.href,
        method: req.method,
      },
      severity: "error",
    });

    throw error;
  }
};

export { handler as GET, handler as POST };
