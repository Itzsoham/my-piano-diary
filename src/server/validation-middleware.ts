import { type NextRequest, NextResponse } from "next/server";
import { type z } from "zod";
import { ValidationError, logError } from "@/lib/error-handler";

/**
 * Validates request body against a schema
 */
export const validateBody = async <T>(
  req: NextRequest,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: string }> => {
  try {
    const body = (await req.json()) as unknown;
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return { success: false, error: `Validation failed: ${errors}` };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof SyntaxError
          ? "Invalid JSON in request body"
          : "Failed to parse request body",
    };
  }
};

/**
 * Validates query parameters against a schema
 */
export const validateQuery = <T>(
  req: NextRequest,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; error: string } => {
  try {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);
    const result = schema.safeParse(query);

    if (!result.success) {
      const errors = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return { success: false, error: `Query validation failed: ${errors}` };
    }

    return { success: true, data: result.data };
  } catch {
    return { success: false, error: "Failed to parse query parameters" };
  }
};

/**
 * Wraps API handler with validation
 */
export const withValidation = <T>(
  handler: (
    req: NextRequest,
    data: T,
    context?: { params?: Record<string, string> },
  ) => Promise<Response>,
  schema: z.ZodSchema<T>,
  validationType: "body" | "query" = "body",
) => {
  return async (
    req: NextRequest,
    context?: { params?: Record<string, string> },
  ): Promise<Response> => {
    try {
      let validationResult:
        | { success: true; data: T }
        | { success: false; error: string };

      if (validationType === "body") {
        validationResult = await validateBody(req, schema);
      } else {
        validationResult = validateQuery(req, schema);
      }

      if (!validationResult.success) {
        const errorMsg = validationResult.error.toString();
        logError(errorMsg, new Error(errorMsg), {
          component: `API ${req.method}`,
          context: { url: req.url, validationType },
          severity: "warning",
        });

        throw Object.assign(new Error(errorMsg), { name: "ValidationError" });
      }

      return await handler(req, validationResult.data, context);
    } catch (error) {
      if (error instanceof ValidationError) {
        const errorMsg =
          error instanceof Error ? error.message : "Validation failed";
        return NextResponse.json(
          {
            error: errorMsg,
            code: "VALIDATION_ERROR",
          },
          { status: 400 },
        );
      }

      throw error;
    }
  };
};
