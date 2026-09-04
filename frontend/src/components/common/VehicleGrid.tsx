import { Car } from "lucide-react";
import { VehicleCard } from "./VehicleCard";
import { VehicleGridSkeleton } from "./Skeletons";
import { EmptyState, ErrorState } from "./EmptyState";
import type { Vehicle } from "@/types";

export function VehicleGrid({
  vehicles,
  isLoading,
  isError,
  onRetry,
  favourites,
  onToggleFavourite,
  emptyTitle = "No vehicles match those filters",
  emptyDescription = "Try widening the price range or clearing a filter.",
  onClearFilters,
  skeletonCount = 6,
}: {
  vehicles: Vehicle[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  favourites?: string[];
  onToggleFavourite?: (vehicle: Vehicle) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onClearFilters?: () => void;
  skeletonCount?: number;
}) {
  if (isLoading) {
    return <VehicleGridSkeleton count={skeletonCount} />;
  }

  if (isError) {
    return <ErrorState {...(onRetry ? { onRetry } : {})} />;
  }

  if (!vehicles.length) {
    return (
      <EmptyState
        icon={Car}
        title={emptyTitle}
        description={emptyDescription}
        {...(onClearFilters
          ? {
              actionLabel: "Clear filters",
              onAction: onClearFilters,
            }
          : {})}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle, index) => (
          <div
            key={vehicle.id}
            className="vehicle-card-animation"
            style={{
              animationDelay: `${index * 120}ms`,
            }}
          >
            <VehicleCard
              vehicle={vehicle}
              {...(onToggleFavourite ? { onToggleFavourite } : {})}
              {...(favourites
                ? {
                    isFavourite: favourites.includes(vehicle.id),
                  }
                : {})}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes vehicleCardFadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .vehicle-card-animation {
          opacity: 0;
          animation: vehicleCardFadeUp 0.6s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .vehicle-card-animation {
            opacity: 1;
            animation: none;
          }
        }
      `}</style>
    </>
  );
}