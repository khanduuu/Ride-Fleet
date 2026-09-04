import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import type { PricingBreakdown } from "@/types";

export function PriceBreakdown({
  pricing,
  isLoading,
  nights,
}: {
  pricing?: PricingBreakdown;
  isLoading?: boolean;
  nights?: number;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  }

  if (!pricing) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="label-eyebrow">Price breakdown</p>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">
            Rental cost{nights ? ` (${nights} days)` : ""}
          </dt>

          <dd className="font-medium tabular-nums">
            {formatCurrency(pricing.basePrice, pricing.currency)}
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">
            {pricing.demandLabel ?? "Demand adjustment"}
          </dt>

          <dd className="font-medium tabular-nums">
            {formatCurrency(pricing.demandAdjustment, pricing.currency)}
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">
            {pricing.discountLabel ?? "Discount"}
          </dt>

          <dd className="font-medium tabular-nums">
            {formatCurrency(pricing.discount, pricing.currency)}
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Taxes & fees</dt>

          <dd className="font-medium tabular-nums">
            {formatCurrency(pricing.taxesAndFees, pricing.currency)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-sm font-semibold">Total</span>

        <span className="font-display text-xl font-medium tabular-nums">
          {formatCurrency(pricing.finalPrice, pricing.currency)}
        </span>
      </div>
    </div>
  );
}