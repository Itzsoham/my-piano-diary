import {
  defaultShouldDehydrateQuery,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import SuperJSON from "superjson";

export const createQueryClient = () =>
  new QueryClient({
    // Surface query failures with a toast instead of silently rendering empty
    // lists. Runs only in the browser — the per-request QueryClient created
    // during SSR skips it (toast is client-only).
    queryCache: new QueryCache({
      onError: (error) => {
        // Surface load failures to the user. Server-side errors are already
        // reported for monitoring by the tRPC errorFormatter; logging every
        // query error here (incl. expected 401/404/validation) would just add
        // noise, so keep this to the toast.
        if (typeof window === "undefined") return;
        toast.error(error.message ?? "Failed to load data");
      },
    }),
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 5 * 60 * 1000,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
