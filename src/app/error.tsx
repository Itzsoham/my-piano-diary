"use client";

import { useEffect } from "react";
import { logError } from "@/lib/error-handler";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to monitoring service
    logError(error.message, error, {
      component: "Global Error Handler",
      context: {
        digest: error.digest,
      },
      severity: "error",
    });
  }, [error]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="border-destructive/20 bg-destructive/5 w-full max-w-md space-y-4 rounded-lg border p-6">
        <div className="space-y-2">
          <h1 className="text-destructive text-lg font-semibold">
            Application Error
          </h1>
          <p className="text-muted-foreground text-sm">
            {error?.message ||
              "An unexpected error occurred in the application."}
          </p>
        </div>

        {process.env.NODE_ENV === "development" && error?.stack && (
          <details className="bg-background border-muted text-muted-foreground max-h-48 overflow-auto rounded border p-2 text-xs">
            <summary className="cursor-pointer font-mono font-semibold">
              Error Details
            </summary>
            <pre className="mt-2 text-xs wrap-break-word whitespace-pre-wrap">
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded px-3 py-2 text-sm font-medium transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex-1 rounded px-3 py-2 text-sm font-medium transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
