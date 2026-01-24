/\*\*

- Example Component: Error Boundary Usage
-
- This file demonstrates how to wrap components and pages with error boundaries
- Copy these patterns throughout your app.
  \*/

// ============================================
// EXAMPLE 1: Page with Error Boundary
// ============================================
/\*
"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { MyPageContent } from "./\_components/my-page-content";

export default function MyPage() {
return (
<ErrorBoundary
componentName="MyPage"
onError={(error, errorInfo) => {
console.error("Page error:", error);
}} >
<MyPageContent />
</ErrorBoundary>
);
}
\*/

// ============================================
// EXAMPLE 2: Component with Error Boundary
// ============================================
/\*
"use client";

import { ErrorBoundary } from "@/components/error-boundary";

export function DataTable({ data }: { data: User[] }) {
return (
<ErrorBoundary componentName="DataTable">
<table>
<tbody>
{data.map((user) => (
<tr key={user.id}>
<td>{user.name}</td>
</tr>
))}
</tbody>
</table>
</ErrorBoundary>
);
}
\*/

// ============================================
// EXAMPLE 3: Client Component with Error Hook
// ============================================
/\*
"use client";

import { useErrorHandler } from "@/hooks/use-error-handler";

export function UserForm() {
const { handleError } = useErrorHandler({ showToast: true });

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
e.preventDefault();
try {
const formData = new FormData(e.currentTarget);
const response = await fetch("/api/users", {
method: "POST",
body: formData,
});
if (!response.ok) throw new Error("Failed to create user");
const data = await response.json();
// Handle success
} catch (error) {
handleError(error, { component: "UserForm" });
}
};

return (
<form onSubmit={handleSubmit}>
<input type="text" name="name" required />
<button type="submit">Submit</button>
</form>
);
}
\*/

// ============================================
// EXAMPLE 4: Async Operations with useAsyncError
// ============================================
/\*
"use client";

import { useAsyncError } from "@/hooks/use-error-handler";

export function DataLoader() {
const { executeAsync } = useAsyncError({ showToast: true });
const [data, setData] = useState(null);

const loadData = async () => {
const result = await executeAsync(async () => {
const response = await fetch("/api/data");
if (!response.ok) throw new Error("Failed to load data");
return response.json();
});

    if (result) {
      setData(result);
    }

};

return (
<div>
<button onClick={loadData}>Load Data</button>
{data && <pre>{JSON.stringify(data, null, 2)}</pre>}
</div>
);
}
\*/

// ============================================
// EXAMPLE 5: Server Action with Error Handling
// ============================================
/\*
// In server actions file
"use server";

import { tryCatch } from "@/server/server-action-error-handler";
import { db } from "@/server/db";

export async function createUser(formData: FormData) {
return tryCatch(
async () => {
const name = formData.get("name")?.toString();
const email = formData.get("email")?.toString();

      if (!name || !email) {
        throw new Error("Name and email are required");
      }

      const user = await db.user.create({
        data: { name, email },
      });

      return { user };
    },
    { actionName: "CreateUser" }

);
}

// In client component
"use client";

export function CreateUserForm() {
const [result, setResult] = useState(null);

const handleSubmit = async (formData: FormData) => {
const result = await createUser(formData);
if (result.success) {
setResult(result.data);
} else {
console.error(result.error);
}
};

return (
<form action={handleSubmit}>
<input type="text" name="name" required />
<input type="email" name="email" required />
<button type="submit">Create User</button>
</form>
);
}
\*/

// ============================================
// EXAMPLE 6: API Route with Error Handler
// ============================================
/\*
// In src/app/api/users/route.ts
import {
withErrorHandling,
ValidationError,
NotFoundError
} from "@/server/api-error-handler";
import { db } from "@/server/db";

export const GET = withErrorHandling(async (req) => {
const { searchParams } = new URL(req.url);
const id = searchParams.get("id");

if (!id) {
throw new ValidationError("ID is required");
}

const user = await db.user.findUnique({
where: { id },
});

if (!user) {
throw new NotFoundError("User not found");
}

return Response.json({ user });
});

export const POST = withErrorHandling(async (req) => {
const body = await req.json();

// Validate input
if (!body.name || !body.email) {
throw new ValidationError("Name and email are required");
}

const user = await db.user.create({
data: { name: body.name, email: body.email },
});

return Response.json({ user }, { status: 201 });
});
\*/

// ============================================
// EXAMPLE 7: Section Layout with Error Boundary
// ============================================
/\*
// In src/app/(root)/layout.tsx or similar

import { ErrorBoundary } from "@/components/error-boundary";

export default async function SectionLayout({
children,
}: {
children: React.ReactNode;
}) {
return (
<ErrorBoundary componentName="SectionLayout">
<div className="section-layout">
{children}
</div>
</ErrorBoundary>
);
}
\*/

// ============================================
// EXAMPLE 8: Logging Errors with Context
// ============================================
/\*
import { logError } from "@/lib/error-handler";

try {
// Some operation
} catch (error) {
logError("Operation failed", error, {
component: "MyComponent",
context: {
userId: "123",
action: "deleteUser",
timestamp: new Date().toISOString(),
},
severity: "error",
});
}
\*/

// ============================================
// EXAMPLE 9: Checking Error Types
// ============================================
/\*
import {
isNetworkError,
isValidationError
} from "@/lib/error-handler";

try {
// API call
} catch (error) {
if (isNetworkError(error)) {
console.log("Network error - check internet connection");
} else if (isValidationError(error)) {
console.log("Validation error - check input");
} else {
console.log("Unknown error");
}
}
\*/

// ============================================
// EXAMPLE 10: Custom Error Boundary with Fallback
// ============================================
/\*
"use client";

import { ErrorBoundary } from "@/components/error-boundary";

function CustomErrorFallback({ error, reset }: any) {
return (
<div className="p-4 bg-red-50 border border-red-200 rounded">
<h2 className="text-lg font-semibold text-red-900">Error in Dashboard</h2>
<p className="text-red-700 mt-2">{error?.message}</p>
<button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
Try Again
</button>
</div>
);
}

export default function Dashboard() {
return (
<ErrorBoundary
componentName="Dashboard"
fallback={<CustomErrorFallback />} >
<DashboardContent />
</ErrorBoundary>
);
}
\*/

export const EXAMPLES_PLACEHOLDER = true;
