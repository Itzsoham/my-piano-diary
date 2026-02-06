import { cn } from "@/lib/utils";

interface AppLoaderProps {
  className?: string;
  text?: string;
  size?: "sm" | "md";
}

export function AppLoader({
  className,
  text = "Loading your piano space...",
  size = "md",
}: AppLoaderProps) {
  const keys = [0, 1, 2, 3, 4];

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center py-12",
        size === "md" ? "min-h-[70vh] gap-6" : "gap-3",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-end gap-1.5",
          size === "md" ? "h-12 gap-2" : "h-6 gap-1",
        )}
        aria-label="Loading"
      >
        {keys.map((i) => (
          <div
            key={i}
            className={cn(
              "bg-muted-foreground/30 animate-piano rounded-b-sm shadow-sm",
              size === "md" ? "h-full w-3 md:w-4" : "h-full w-1.5",
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      {text && (
        <p
          className={cn(
            "text-muted-foreground/80 animate-pulse font-medium tracking-widest uppercase",
            size === "md" ? "text-xs md:text-sm" : "text-[10px]",
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
}
