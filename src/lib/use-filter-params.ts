"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Makes the URL query string the single source of truth for page filters.
 *
 * Filters read their values from `searchParams` during render (shareable,
 * bookmarkable, and consistent with what the server rendered) instead of local
 * state restored from sessionStorage in a mount effect — which is what tripped
 * `react-hooks/set-state-in-effect`. `setParams` merges updates into the current
 * query; pass `null`/`""` to drop a key so defaults produce a clean URL.
 */
export function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  return { searchParams, setParams };
}
