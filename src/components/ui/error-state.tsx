import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function ErrorState({
  className,
  icon: Icon,
  title,
  description,
  action,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in-50 zoom-in-95 flex min-h-[50vh] flex-col items-center justify-center p-8 text-center duration-500",
        className,
      )}
      {...props}
    >
      {Icon && (
        <div className="bg-primary/5 ring-primary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-sm ring-1">
          <Icon className="text-primary h-10 w-10" strokeWidth={1.5} />
        </div>
      )}
      <h2 className="text-foreground mb-3 text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md leading-relaxed text-balance">
        {description}
      </p>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
