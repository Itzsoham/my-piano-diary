import * as React from "react";

export function DashboardContainer({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <div className={
      `max-w-7xl mx-2 px-4 sm:px-6 lg:px-8 py-6 ${className ?? ""}`
    }>
      {children}
    </div>
  );
}

export default DashboardContainer;

