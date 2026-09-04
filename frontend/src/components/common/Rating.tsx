import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = "sm",
  showStars = true,
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  showStars?: boolean;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      aria-label={`Rated ${value.toFixed(2)} out of 5`}
    >
      {showStars && (
        <span className="flex items-center gap-0.5" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                size === "sm" ? "size-3" : "size-4",
                i < rounded ? "fill-accent text-accent" : "text-border",
              )}
            />
          ))}
        </span>
      )}
      <span
        className={cn(
          "font-medium tabular-nums",
          size === "sm" ? "text-xs" : "text-sm",
        )}
      >
        {value.toFixed(2)}
      </span>
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
