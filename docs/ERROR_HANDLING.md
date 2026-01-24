# Error Handling Implementation Guide

## Overview

This project now has comprehensive error handling implemented across the entire application to prevent unhandled errors from crashing the app. The implementation includes:

1. **React Error Boundaries** - Catch React component errors
2. **Global Error Pages** - Next.js error.tsx and not-found.tsx
3. **API Error Handling** - Error handling for tRPC and API routes
4. **Server Action Error Handling** - Error handling for server actions
5. **Error Logging Service** - Centralized error logging and monitoring
6. **Client-Side Error Hooks** - Utilities for handling errors in components

---

## Components & Files

### 1. Error Boundary Component

**Location**: `src/components/error-boundary.tsx`

A React class component that catches errors in child components and displays a fallback UI.

**Usage**:

```tsx
import { ErrorBoundary } from "@/components/error-boundary";

export default function MyPage() {
  return (
    <ErrorBoundary componentName="MyPage" fallback={<CustomErrorUI />}>
      <YourContent />
    </ErrorBoundary>
  );
}
```

**Features**:

- Catches React rendering errors
- Displays error details in development mode
- Provides "Try Again" and "Go Home" buttons
- Logs errors with context
- Optional custom fallback UI

---

### 2. Error Handler Service

**Location**: `src/lib/error-handler.ts`

Centralized error handling, logging, and utility functions.

**Key Functions**:

#### `logError(message, error, context)`

Logs errors with context information.

```tsx
import { logError } from "@/lib/error-handler";

try {
  // code
} catch (error) {
  logError("Operation failed", error, {
    component: "MyComponent",
    context: { userId: "123" },
    severity: "error",
  });
}
```

#### `getErrorLogs()`

Retrieve all logged errors (max 100).

```tsx
const logs = getErrorLogs();
console.log(logs);
```

#### `formatErrorMessage(error)`

Format error for display to users.

```tsx
const message = formatErrorMessage(error);
```

#### `isNetworkError(error)` & `isValidationError(error)`

Check error types.

```tsx
if (isNetworkError(error)) {
  // Handle network error
}
```

---

### 3. Global Error Pages

#### `src/app/error.tsx` - Global Error Handler

Catches errors from the entire application.

- Shows error message
- Displays stack trace in development
- Provides retry and home navigation

#### `src/app/(root)/error.tsx` - Dashboard Error Handler

Specific error handling for authenticated routes.

#### `src/app/(auth)/error.tsx` - Auth Error Handler

Specific error handling for authentication routes.

#### `src/app/not-found.tsx` - 404 Handler

Handles page not found errors.

---

### 4. API Error Handling

#### **tRPC Route** (`src/app/api/trpc/[trpc]/route.ts`)

- Wraps tRPC handler with try-catch
- Logs all tRPC errors with endpoint and method
- Provides detailed error info in development

#### **API Error Handler** (`src/server/api-error-handler.ts`)

Middleware for wrapping API route handlers.

**Usage**:

```tsx
import { withErrorHandling, ValidationError } from "@/server/api-error-handler";

export const GET = withErrorHandling(async (req) => {
  if (!validateInput(data)) {
    throw new ValidationError("Invalid input");
  }
  return Response.json({ data });
});
```

**Supported Error Classes**:

- `ValidationError` (400)
- `AuthenticationError` (401)
- `AuthorizationError` (403)
- `NotFoundError` (404)
- Generic errors (500)

---

### 5. Server Action Error Handling

#### **Server Action Error Handler** (`src/server/server-action-error-handler.ts`)

**`withServerActionErrorHandling(action, name)`**:

```tsx
import { withServerActionErrorHandling } from "@/server/server-action-error-handler";

export const myAction = withServerActionErrorHandling(async (data: MyData) => {
  // implementation
  return result;
}, "MyAction");
```

**`tryCatch(fn, context)`**:

```tsx
import { tryCatch } from "@/server/server-action-error-handler";

const result = await tryCatch(
  async () => {
    // operation
    return data;
  },
  { actionName: "GetUserData" },
);

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

#### **Enhanced Auth Actions** (`src/server/actions/auth-actions.ts`)

- Login and registration actions include error logging
- Distinguish between auth, validation, and unexpected errors
- Return consistent success/error responses

---

### 6. Client-Side Error Handling

#### **`useErrorHandler` Hook** (`src/hooks/use-error-handler.ts`)

Handle errors with automatic logging and toast notifications.

```tsx
"use client";

import { useErrorHandler } from "@/hooks/use-error-handler";

export default function MyComponent() {
  const { handleError } = useErrorHandler({
    showToast: true,
    onError: (error) => {
      // Custom error handling
    },
  });

  const handleClick = async () => {
    try {
      // operation
    } catch (error) {
      handleError(error, { component: "MyComponent" });
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

#### **`useAsyncError` Hook**

Simplified async error handling.

```tsx
import { useAsyncError } from "@/hooks/use-error-handler";

export default function MyComponent() {
  const { executeAsync } = useAsyncError({ showToast: true });

  const loadData = async () => {
    const result = await executeAsync(async () => {
      const response = await fetch("/api/data");
      return response.json();
    });

    if (result) {
      // Handle success
    }
  };

  return <button onClick={loadData}>Load Data</button>;
}
```

---

## Error Handling Scenarios

### Scenario 1: React Component Error

```tsx
// Error is caught by ErrorBoundary
<ErrorBoundary componentName="MyComponent">
  <ComponentThatThrows />
</ErrorBoundary>
```

**Result**: Error boundary catches it, logs it, displays fallback UI

---

### Scenario 2: Network Request Error

```tsx
"use client";

import { useErrorHandler } from "@/hooks/use-error-handler";

export default function MyComponent() {
  const { handleError } = useErrorHandler();

  const fetchData = async () => {
    try {
      const response = await fetch("/api/data");
      const data = await response.json();
    } catch (error) {
      handleError(error, { component: "MyComponent" });
    }
  };

  return <button onClick={fetchData}>Fetch</button>;
}
```

**Result**: Error is logged, toast notification shown, development console shows details

---

### Scenario 3: Server Action Error

```tsx
// In form component
"use client";

export default function MyForm() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    const result = await loginAction(formData);
    if (!result.success) {
      setError(result.message);
      // Error is logged in server action
    }
  };

  return (
    <form action={handleSubmit}>
      {error && <p className="text-red-600">{error}</p>}
      {/* form fields */}
    </form>
  );
}
```

**Result**: Error logged on server, message returned to client, user sees error message

---

### Scenario 4: API Route Error

```tsx
// src/app/api/users/route.ts
import { withErrorHandling, NotFoundError } from "@/server/api-error-handler";

export const GET = withErrorHandling(async (req) => {
  const user = await db.user.findUnique({ where: { id: "123" } });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return Response.json({ user });
});
```

**Result**: Returns 404 with proper error response, error logged

---

## Configuration

### Environment Variables

Add to `.env.local` (optional):

```
# Error tracking service endpoint
NEXT_PUBLIC_ERROR_TRACKING_URL=https://your-error-tracking-service.com/errors
```

### Enable Error Tracking in Production

The `logError` function will send errors to `NEXT_PUBLIC_ERROR_TRACKING_URL` if configured. You can integrate with:

- **Sentry**: https://sentry.io
- **LogRocket**: https://logrocket.com
- **DataDog**: https://datadoghq.com
- **Custom endpoint**: Implement your own error tracking backend

---

## Error Log Structure

Each logged error contains:

```typescript
interface ErrorLog {
  message: string; // Error message
  stack?: string; // Stack trace
  context?: Record<string, unknown>; // Additional context
  timestamp: Date; // When error occurred
  severity: "error" | "warning" | "info"; // Severity level
  component?: string; // Component/function where error occurred
}
```

---

## Best Practices

### 1. Always Use Error Boundaries

Wrap major route sections with `<ErrorBoundary>`.

```tsx
<ErrorBoundary componentName="Dashboard">
  <Dashboard />
</ErrorBoundary>
```

### 2. Log with Context

Always provide meaningful context when logging errors.

```tsx
logError("Failed to load user", error, {
  component: "UserProfile",
  context: { userId: "123" },
  severity: "error",
});
```

### 3. Use Type-Specific Errors in APIs

Use `ValidationError`, `AuthenticationError`, etc., for better error handling.

```tsx
if (!data.id) {
  throw new ValidationError("ID is required");
}
```

### 4. Show User-Friendly Messages

In production, don't expose technical error details to users.

```tsx
// Good
toast.error("Failed to load data. Please try again.");

// Bad
toast.error(error.stack);
```

### 5. Handle Errors at Component Boundaries

Use error boundaries at page and section levels.

### 6. Test Error Scenarios

Deliberately throw errors to test error handling.

```tsx
// Development only
if (process.env.NODE_ENV === "development" && searchParams.error) {
  throw new Error("Test error");
}
```

---

## Monitoring & Debugging

### View Error Logs

In browser console:

```tsx
// Import in DevTools console
import { getErrorLogs } from "@/lib/error-handler";

// Get all logs
const logs = getErrorLogs();
console.table(logs);
```

### Clear Error Logs

```tsx
import { clearErrorLogs } from "@/lib/error-handler";
clearErrorLogs();
```

### Development Mode

In development, error details are shown:

- In error boundaries
- In error pages
- In browser console
- In toast notifications

---

## Summary

The error handling system is now production-ready and prevents unhandled errors from crashing the application. All errors are caught, logged, and displayed to users appropriately.

### Key Files:

- `src/components/error-boundary.tsx` - React Error Boundary
- `src/lib/error-handler.ts` - Error logging service
- `src/app/error.tsx` - Global error page
- `src/app/*/error.tsx` - Section error pages
- `src/server/api-error-handler.ts` - API route wrapper
- `src/server/server-action-error-handler.ts` - Server action wrapper
- `src/hooks/use-error-handler.ts` - Client-side hooks

### Coverage:

- ✅ React component errors
- ✅ Global application errors
- ✅ API route errors
- ✅ tRPC errors
- ✅ Server action errors
- ✅ Network errors
- ✅ Client-side errors
- ✅ 404 errors
- ✅ Error logging and monitoring
