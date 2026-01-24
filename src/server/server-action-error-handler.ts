import { logError } from "@/lib/error-handler";

/**
 * Wrapper for server actions with built-in error handling
 */
export const withServerActionErrorHandling = <T, R>(
  action: (arg: T) => Promise<R>,
  actionName: string,
) => {
  return async (
    arg: T,
  ): Promise<
    { success: false; error: string } | { success: true; data: R }
  > => {
    try {
      const result = await action(arg);
      return { success: true, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logError(message, error, {
        component: `Server Action: ${actionName}`,
        context: {
          actionName,
          args: arg,
        },
        severity: "error",
      });

      return {
        success: false,
        error:
          process.env.NODE_ENV === "development"
            ? message
            : "An error occurred while processing your request",
      };
    }
  };
};

/**
 * Try-catch wrapper for server actions
 */
export const tryCatch = async <T>(
  fn: () => Promise<T>,
  context?: { actionName?: string },
): Promise<{ success: true; data: T } | { success: false; error: string }> => {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    logError(message, error, {
      component: `Server Action: ${context?.actionName ?? "Unknown"}`,
      severity: "error",
    });

    return {
      success: false,
      error:
        process.env.NODE_ENV === "development"
          ? message
          : "An error occurred while processing your request",
    };
  }
};
