"use client";

import { ComingSoon } from "@/components/ui/coming-soon";
import { useRouter } from "next/navigation";

export default function UpdatesPage() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center p-4">
      <ComingSoon
        title="New features are arriving soon 🎹"
        description="We're working on exciting updates to improve your teaching experience. Check back here for the latest release notes and improvements."
      />

      {/* Hidden Easter egg trigger — only visible to those who know where to look */}
      <button
        onClick={() => router.push("/forever")}
        className="mt-8 cursor-pointer text-[11px] text-pink-300/20 transition-colors hover:text-pink-300/60"
        aria-label="Special update"
      >
        🎹 special update available
      </button>
    </div>
  );
}
