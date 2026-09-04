import { Link } from "@tanstack/react-router";
import { Heart, Users, Fuel, Gauge, ArrowRight } from "lucide-react";
import { Rating } from "./Rating";
import { AvailabilityPill } from "./StatusPill";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/types";

export function VehicleCard({
  vehicle,
  showMatch = true,
  onToggleFavourite,
  isFavourite,
  className,
}: {
  vehicle: Vehicle;
  showMatch?: boolean;
  onToggleFavourite?: (vehicle: Vehicle) => void;
  isFavourite?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white",
        "border border-slate-200 shadow-sm",
        "transition-all duration-300",
        "hover:-translate-y-2 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60",
        className,
      )}
    >
      {/* Match badge */}
      {showMatch && typeof vehicle.matchScore === "number" && (
        <span className="absolute left-4 top-4 z-20 rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-bold tracking-wide text-white shadow-md">
          {vehicle.matchScore}% MATCH
        </span>
      )}

      {/* Favourite */}
      {onToggleFavourite && (
        <button
          type="button"
          onClick={() => onToggleFavourite(vehicle)}
          aria-label={
            isFavourite
              ? "Remove from favourites"
              : "Save to favourites"
          }
          aria-pressed={isFavourite}
          className="absolute right-4 top-4 z-20 grid size-10 place-items-center rounded-full bg-white/95 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-blue-50"
        >
          <Heart
            className={cn(
              "size-5 transition-colors",
              isFavourite
                ? "fill-red-500 text-red-500"
                : "text-slate-500 group-hover:text-blue-600",
            )}
          />
        </button>
      )}

      <Link
        to="/vehicles/$vehicleId"
        params={{ vehicleId: vehicle.id }}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {/* =====================================================
            VEHICLE IMAGE
        ====================================================== */}

        <div className="relative mb-5 aspect-[4/3] w-full overflow-hidden bg-slate-50">
          {/* Soft blue glow */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 size-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/40 blur-3xl transition-all duration-500 group-hover:bg-blue-200/50" />

          <img
            src={vehicle.imageUrl}
            alt={`${vehicle.name}, ${vehicle.type} available in ${vehicle.location}`}
            loading="lazy"
            width={1024}
            height={768}
            className="relative z-10 size-full object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />

          {/* Type badge */}
          <span className="absolute bottom-3 left-3 z-20 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-sm backdrop-blur-sm">
            {vehicle.type}
          </span>
        </div>

        {/* =====================================================
            VEHICLE INFO
        ====================================================== */}

        <div className="px-5 pb-5">

          <div className="flex items-start justify-between gap-4">

            <div className="min-w-0">

              <h3 className="truncate text-lg font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                {vehicle.name}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2">

                <span className="text-xs text-slate-500">
                  {vehicle.specs.fuel} • {vehicle.location}
                </span>

                <AvailabilityPill
                  status={vehicle.availability}
                />

              </div>

            </div>

            {/* Price */}
            <div className="shrink-0 text-right">

              <span className="block text-lg font-bold tabular-nums text-slate-900">
                {formatCurrency(
                  vehicle.pricePerDay,
                  vehicle.currency,
                )}
              </span>

              <span className="text-xs text-slate-400">
                /day
              </span>

              <Rating
                value={vehicle.rating}
                count={vehicle.reviewCount}
                showStars={false}
                className="mt-1 justify-end"
              />

            </div>

          </div>

          {/* ===================================================
              SPECS
          ==================================================== */}

          <div className="mt-5 grid grid-cols-3 border-t border-slate-100 pt-4">

            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Users className="size-4 text-blue-500" />
              {vehicle.specs.seats} Seats
            </span>

            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Fuel className="size-4 text-blue-500" />
              {vehicle.specs.fuel}
            </span>

            <span className="flex items-center gap-2 text-xs text-slate-500">
              <Gauge className="size-4 text-blue-500" />
              {vehicle.specs.transmission}
            </span>

          </div>

          {/* ===================================================
              VIEW DETAILS
          ==================================================== */}

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

            <span className="text-sm font-semibold text-slate-700">
              View vehicle
            </span>

            <span className="grid size-8 place-items-center rounded-full bg-blue-50 text-blue-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>

          </div>

        </div>
      </Link>
    </article>
  );
}