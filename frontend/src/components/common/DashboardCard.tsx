import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-lift",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="label-eyebrow">{label}</span>
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
      </div>
      <p className="mt-3 font-display text-2xl font-medium tracking-tight tabular-nums">
        {value}
      </p>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {delta && <span className="font-medium text-success">{delta}</span>}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
