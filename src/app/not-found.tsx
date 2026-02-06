"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { logError } from "@/lib/error-handler"; // Keeping existing logging
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Keep existing logging logic
    logError("404 - Page not found", new Error("404"), {
      component: "Not Found Page",
      severity: "warning",
    });
  }, []);

  return (
    <div className="bg-background flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <ErrorState
          icon={FileQuestion}
          title="Page Not Found"
          description="We searched the whole diary, but this page seems to be missing. It might have been moved or deleted."
          action={
            <>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button onClick={() => router.push("/")} className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </>
          }
        />
      </div>
    </div>
  );
}
