"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { logError } from "@/lib/error-handler";

interface UseErrorHandlerOptions {
  showToast?: boolean;
  logToService?: boolean;
  onError?: (error: Error) => void;
}

/**
 * Hook for handling errors in client components
 */
export const useErrorHandler = (options?: UseErrorHandlerOptions) => {
  const handleError = useCallback(
    (error: unknown, context?: { component?: string }) => {
      const err = error instanceof Error ? error : new Error(String(error));

      // Log the error
      logError(err.message, err, {
        component: context?.component ?? "Unknown Component",
        severity: "error",
      });

      // Show toast notification if enabled
      if (options?.showToast !== false) {
        toast.error(
          process.env.NODE_ENV === "development"
            ? err.message
            : "An error occurred. Please try again.",
        );
      }

      // Call custom error handler if provided
      if (options?.onError) {
        options.onError(err);
      }
    },
    [options],
  );

  return { handleError };
};

/**
 * Hook for handling async operations with error handling
 */
export const useAsyncError = (options?: UseErrorHandlerOptions) => {
  const { handleError } = useErrorHandler(options);

  const executeAsync = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        return await fn();
      } catch (error) {
        handleError(error, { component: "Async Operation" });
        return null;
      }
    },
    [handleError],
  );

  return { executeAsync, handleError };
};
