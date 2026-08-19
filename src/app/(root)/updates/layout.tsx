import { type Metadata } from "next";

/**
 * This route's page is a client component, and a client component cannot
 * export `metadata` — so the title lives in a colocated layout instead. The
 * layout renders nothing of its own; it exists purely to name the tab.
 */
export const metadata: Metadata = {
  title: "Updates",
  description: "What is new in My Piano Diary.",
};

export default function UpdatesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
