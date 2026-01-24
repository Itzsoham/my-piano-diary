"use client";

import { useEffect } from "react";
import { logError } from "@/lib/error-handler";

export default function NotFound() {
  useEffect(() => {
    logError("404 - Page not found", new Error("404"), {
      component: "Not Found Page",
      severity: "warning",
    });
  }, []);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-yellow-600/20 bg-yellow-50 p-6 dark:bg-yellow-950/20">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
            Page Not Found
          </h1>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => window.history.back()}
            className="flex-1 rounded bg-yellow-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-700"
          >
            Go Back
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="flex-1 rounded bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-800 transition-colors hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
