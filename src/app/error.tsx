"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { logError } from "@/lib/error-handler";
import { Music, RotateCcw, Home } from "lucide-react";

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
    <div className="bg-background flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ErrorState
          icon={Music}
          title="That note didn't play right 🎵"
          description="We ran into an unexpected issue while loading this page. It's not your fault, and your data is safe."
          action={
            <>
              <Button onClick={() => reset()} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  // Hard navigation to clear client state if deeply broken
                  window.location.href = "/";
                }}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </>
          }
        />
        {/* Dev-only stack trace */}
        {process.env.NODE_ENV === "development" && error.stack && (
          <div className="animate-in fade-in slide-in-from-bottom-4 mt-8">
            <details className="bg-muted/30 text-muted-foreground rounded-lg border p-2 text-xs">
              <summary className="hover:text-foreground cursor-pointer font-medium">
                Developer Details
              </summary>
              <pre className="mt-2 max-h-50 overflow-auto text-xs whitespace-pre-wrap opacity-70">
                {error.stack}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
