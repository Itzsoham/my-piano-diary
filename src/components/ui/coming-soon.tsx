import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, Music } from "lucide-react";
import Link from "next/link";

interface ComingSoonProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  showHomeButton?: boolean;
}

export function ComingSoon({
  className,
  title = "This page is still being composed 🎼",
  description = "We’re currently tuning this feature to make it perfect for you. Please check back later.",
  showHomeButton = true,
  ...props
}: ComingSoonProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in-50 zoom-in-95 flex min-h-[50vh] flex-col items-center justify-center p-8 text-center duration-700",
        className,
      )}
      {...props}
    >
      <div className="relative mb-6">
        {/* Abstract sheet music / piano vibe background circle */}
        <div className="bg-secondary/30 ring-secondary/50 flex h-24 w-24 items-center justify-center rounded-full shadow-sm ring-1">
          <Construction
            className="text-secondary-foreground/70 h-10 w-10"
            strokeWidth={1.5}
          />
        </div>

        {/* Floating music note decoration */}
        <div className="bg-background ring-border absolute -top-1 -right-1 flex h-8 w-8 animate-bounce items-center justify-center rounded-full shadow-sm ring-1 duration-[3000ms]">
          <Music className="text-primary h-4 w-4" />
        </div>
      </div>

      <h2 className="text-foreground mb-3 text-2xl font-semibold tracking-tight">
        {title}
      </h2>

      <p className="text-muted-foreground mb-8 max-w-md leading-relaxed text-balance">
        {description}
      </p>

      {showHomeButton && (
        <Button asChild variant="outline" className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Go back to Dashboard
          </Link>
        </Button>
      )}
    </div>
  );
}
