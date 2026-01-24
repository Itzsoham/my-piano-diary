"use client";

import React from "react";

/**
 * Component that throws an error (for testing error boundaries)
 * Add as query param to any page: ?testError=true
 */
export function ErrorTestComponent() {
  throw new Error("This is a test error from ErrorTestComponent");
}

/**
 * Component that throws an async error
 */
export function AsyncErrorComponent() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    // Simulate async error
    const timer = setTimeout(() => {
      setError(new Error("Async error after 2 seconds"));
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (error) throw error;

  return <div>This will error in 2 seconds...</div>;
}

/**
 * Test error boundary with a button
 */
export function ErrorTestButton() {
  const [shouldError, setShouldError] = React.useState(false);

  if (shouldError) {
    throw new Error("Error triggered by test button");
  }

  return (
    <button
      onClick={() => setShouldError(true)}
      className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      Trigger Test Error
    </button>
  );
}

/**
 * Test network error
 */
export function NetworkErrorTest() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const triggerNetworkError = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch from non-existent endpoint
      const response = await fetch("/api/non-existent-endpoint");
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={triggerNetworkError}
        disabled={loading}
        className="rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700 disabled:opacity-50"
      >
        {loading ? "Loading..." : "Trigger Network Error"}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Component to test error logging
 */
export function ErrorLogTest() {
  const [logs, setLogs] = React.useState<unknown[]>([]);

  const triggerAndViewLogs = async () => {
    const { logError, getErrorLogs } = await import("@/lib/error-handler");

    try {
      throw new Error("Test error for logging");
    } catch (error) {
      logError("Test error logged", error, {
        component: "ErrorLogTest",
        context: { testId: "123" },
        severity: "error",
      });
    }

    const allLogs = getErrorLogs();
    setLogs(allLogs);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={triggerAndViewLogs}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Trigger & View Error Logs
      </button>
      {logs.length > 0 && (
        <pre className="max-h-48 overflow-auto rounded bg-gray-100 p-2 text-xs">
          {JSON.stringify(logs, null, 2)}
        </pre>
      )}
    </div>
  );
}

/**
 * Test Component - Add to page with query param
 * Example: /dashboard?testErrors=true
 */
export function ErrorTestPanel() {
  const [view, setView] = React.useState<"sync" | "async" | "network" | "logs">(
    "sync",
  );

  return (
    <div className="fixed right-4 bottom-4 z-50 max-w-sm rounded border border-gray-300 bg-white p-4 shadow-lg">
      <h3 className="mb-2 font-bold">Error Testing Panel</h3>

      <div className="mb-4 space-y-2">
        <button
          onClick={() => setView("sync")}
          className={`w-full rounded px-2 py-1 text-sm ${
            view === "sync"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Sync Error
        </button>
        <button
          onClick={() => setView("async")}
          className={`w-full rounded px-2 py-1 text-sm ${
            view === "async"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Async Error
        </button>
        <button
          onClick={() => setView("network")}
          className={`w-full rounded px-2 py-1 text-sm ${
            view === "network"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Network Error
        </button>
        <button
          onClick={() => setView("logs")}
          className={`w-full rounded px-2 py-1 text-sm ${
            view === "logs"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          View Logs
        </button>
      </div>

      <div className="border-t pt-2">
        {view === "sync" && <ErrorTestButton />}
        {view === "async" && <AsyncErrorComponent />}
        {view === "network" && <NetworkErrorTest />}
        {view === "logs" && <ErrorLogTest />}
      </div>
    </div>
  );
}

export default ErrorTestPanel;
