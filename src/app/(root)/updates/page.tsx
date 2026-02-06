"use client";

import { ComingSoon } from "@/components/ui/coming-soon";

export default function UpdatesPage() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center p-4">
      <ComingSoon
        title="New features are arriving soon 🎹"
        description="We're working on exciting updates to improve your teaching experience. Check back here for the latest release notes and improvements."
      />
    </div>
  );
}
