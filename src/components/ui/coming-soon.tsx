import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { ArrowLeft } from "lucide-react";
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
      <Mochi mood="sleepy" bob size={128} className="mb-2" />
      <Blossom size={18} className="text-bubblegum mb-4" />

      <h2 className="text-ink mb-3 font-serif text-2xl font-normal">{title}</h2>

      <p className="text-ink-soft mb-8 max-w-md leading-relaxed text-balance">
        {description}
      </p>

      {showHomeButton && (
        <Button
          asChild
          variant="outline"
          className="border-border gap-2 rounded-full"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Go back to Dashboard
          </Link>
        </Button>
      )}
    </div>
  );
}
