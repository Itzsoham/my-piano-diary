"use client";

import React, { type ReactNode } from "react";
import { logError } from "@/lib/error-handler";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches React errors
 * Prevents app crashes and shows fallback UI
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error
    logError(error.message, error, {
      component: this.props.componentName ?? "Unknown",
      context: {
        componentStack: errorInfo.componentStack,
      },
      severity: "error",
    });

    // Call optional callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error);
      console.error("Component stack:", errorInfo.componentStack);
    }
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="bg-background flex min-h-screen items-center justify-center p-4">
            <div className="border-destructive/20 bg-destructive/5 w-full max-w-md space-y-4 rounded-lg border p-6">
              <div className="space-y-2">
                <h1 className="text-destructive text-lg font-semibold">
                  Something went wrong
                </h1>
                <p className="text-muted-foreground text-sm">
                  {this.state.error?.message ??
                    "An unexpected error occurred. Please try again."}
                </p>
              </div>

              {process.env.NODE_ENV === "development" && (
                <details className="bg-background border-muted text-muted-foreground max-h-48 overflow-auto rounded border p-2 text-xs">
                  <summary className="cursor-pointer font-mono font-semibold">
                    Error Details
                  </summary>
                  <pre className="mt-2 wrap-break-word whitespace-pre-wrap">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={this.resetError}
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
        )
      );
    }

    return this.props.children;
  }
}
