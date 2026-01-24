/**
 * Error handling utilities for the application
 */

export interface ErrorLog {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: Date;
  severity: "error" | "warning" | "info";
  component?: string;
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// Store error logs in memory (in production, send to monitoring service)
const errorLogs: ErrorLog[] = [];
const MAX_ERROR_LOGS = 100;

/**
 * Log errors for monitoring and debugging
 */
export const logError = (
  message: string,
  error?: unknown,
  context?: {
    component?: string;
    context?: Record<string, unknown>;
    severity?: "error" | "warning" | "info";
  },
): void => {
  const errorLog: ErrorLog = {
    message,
    stack: error instanceof Error ? error.stack : String(error),
    context: context?.context,
    timestamp: new Date(),
    severity: context?.severity ?? "error",
    component: context?.component,
  };

  errorLogs.push(errorLog);

  // Keep only recent logs
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs.shift();
  }

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("[Error Log]", errorLog);
  }

  // In production, you would send this to a service like Sentry, LogRocket, etc.
  if (process.env.NEXT_PUBLIC_ERROR_TRACKING_URL) {
    sendErrorToTrackingService(errorLog).catch((err) => {
      console.error("Failed to send error to tracking service:", err);
    });
  }
};

/**
 * Send error to external tracking service
 */
const sendErrorToTrackingService = async (
  errorLog: ErrorLog,
): Promise<void> => {
  try {
    await fetch(process.env.NEXT_PUBLIC_ERROR_TRACKING_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorLog),
    });
  } catch {
    // Silently fail to avoid infinite error loops
  }
};

/**
 * Get all logged errors
 */
export const getErrorLogs = (): ErrorLog[] => {
  return [...errorLogs];
};

/**
 * Clear error logs
 */
export const clearErrorLogs = (): void => {
  errorLogs.length = 0;
};

/**
 * Format error message for display
 */
export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("CORS")
    );
  }
  return false;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes("validation") ||
      error.message.includes("required") ||
      error.message.includes("invalid")
    );
  }
  return false;
};
