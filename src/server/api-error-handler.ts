import { type NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/error-handler";

/**
 * Wrapper for API route handlers with built-in error handling
 */
export type ApiHandler = (
  req: NextRequest,
  context?: { params: Record<string, string> },
) => Promise<Response>;

export const withErrorHandling = (handler: ApiHandler): ApiHandler => {
  return async (
    req: NextRequest,
    context?: { params: Record<string, string> },
  ) => {
    try {
      return await handler(req, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logError(message, error, {
        component: `API ${req.method} ${req.nextUrl.pathname}`,
        context: {
          method: req.method,
          pathname: req.nextUrl.pathname,
          url: req.url,
        },
        severity: "error",
      });

      // Return appropriate error response
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: error.message, code: "VALIDATION_ERROR" },
          { status: 400 },
        );
      }

      if (error instanceof AuthenticationError) {
        return NextResponse.json(
          { error: error.message, code: "AUTHENTICATION_ERROR" },
          { status: 401 },
        );
      }

      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { error: error.message, code: "AUTHORIZATION_ERROR" },
          { status: 403 },
        );
      }

      if (error instanceof NotFoundError) {
        return NextResponse.json(
          { error: error.message, code: "NOT_FOUND" },
          { status: 404 },
        );
      }

      // Generic server error
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === "development"
              ? message
              : "An internal server error occurred",
          code: "INTERNAL_SERVER_ERROR",
        },
        { status: 500 },
      );
    }
  };
};

/**
 * Custom error classes for different error types
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized access") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}
