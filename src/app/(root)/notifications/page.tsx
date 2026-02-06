"use client";

import { ComingSoon } from "@/components/ui/coming-soon";

export default function NotificationsPage() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center p-4">
      <ComingSoon
        title="Notifications are being composed 🔔"
        description="We're building a notification center to help you stay in tune with your students' progress and diary updates."
      />
    </div>
  );
}
