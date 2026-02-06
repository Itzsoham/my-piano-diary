import { cn } from "@/lib/utils";

interface AppLoaderProps {
  className?: string;
  text?: string;
}

export function AppLoader({
  className,
  text = "Loading your piano space...",
}: AppLoaderProps) {
  const keys = [0, 1, 2, 3, 4];

  return (
    <div
      className={cn(
        "flex min-h-[50vh] w-full flex-col items-center justify-center gap-6",
        className,
      )}
    >
      <div className="flex h-12 items-end gap-2" aria-label="Loading">
        {keys.map((i) => (
          <div
            key={i}
            // Keys look like piano keys: white (or muted) rectangles
            // We use rounded-b-sm to soften the edges like real keys
            className="bg-muted-foreground/30 animate-piano h-full w-3 rounded-b-sm shadow-sm md:w-4"
            style={{
              // Stagger the animation to create a wave/ripple effect
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      {text && (
        <p className="text-muted-foreground/80 animate-pulse text-xs font-medium tracking-widest uppercase md:text-sm">
          {text}
        </p>
      )}
    </div>
  );
}
