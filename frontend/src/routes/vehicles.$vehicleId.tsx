import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays, format } from "date-fns";
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  Fuel,
  Gauge,
  Luggage,
  MapPin,
  Route as RouteIcon,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Rating } from "@/components/common/Rating";
import { DatePicker } from "@/components/common/DatePicker";
import { PriceBreakdown } from "@/components/common/PriceBreakdown";
import {
  AvailabilityPill,
  MaintenancePill,
} from "@/components/common/StatusPill";
import { ErrorState } from "@/components/common/EmptyState";
import { vehiclesService } from "@/services/vehicles.service";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Vehicle } from "@/types";

export const Route = createFileRoute("/vehicles/$vehicleId")({
  loader: async ({ params }): Promise<{ vehicle: Vehicle }> => {
    const vehicle = await vehiclesService.getById(params.vehicleId);
    if (!vehicle) throw notFound();
    return { vehicle };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Vehicle unavailable — Ridefleet" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { vehicle } = loaderData;
    const title = `${vehicle.name} — ${formatCurrency(vehicle.pricePerDay, vehicle.currency)}/day in ${vehicle.location} | Ridefleet`;
    const description = vehicle.description.slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: VehicleDetailPage,
});

function VehicleDetailPage() {
  const { vehicle } = Route.useLoaderData();
  const [activeImage, setActiveImage] = useState(0);
  const [start, setStart] = useState<Date | undefined>(undefined);
  const [end, setEnd] = useState<Date | undefined>(undefined);

  const reviews = useQuery({
    queryKey: ["vehicle", vehicle.id, "reviews"],
    queryFn: () => vehiclesService.reviews(vehicle.id),
  });

  const quote = useQuery({
  queryKey: [
    "pricing",
    vehicle.id,
    start?.toISOString(),
    end?.toISOString(),
  ],
  queryFn: () =>
    vehiclesService.quote({
      vehicleId: vehicle.id,
      startDate: format(start!, "yyyy-MM-dd"),
      endDate: format(end!, "yyyy-MM-dd"),
    }),
  enabled: !!start && !!end,
});

  const specs = [
    { icon: Users, label: "Seats", value: `${vehicle.specs.seats}` },
    { icon: Fuel, label: "Fuel", value: vehicle.specs.fuel },
    { icon: Gauge, label: "Transmission", value: vehicle.specs.transmission },
    { icon: RouteIcon, label: "Range", value: `${vehicle.specs.rangeKm} km` },
    { icon: Luggage, label: "Luggage", value: `${vehicle.specs.luggage} bags` },
    { icon: CalendarDays, label: "Model year", value: `${vehicle.specs.year}` },
  ];

  const bookable = vehicle.availability === "available";

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <Link to="/vehicles" className="hover:text-foreground">
          Vehicles
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{vehicle.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/5">
            <img
  src={vehicle.imageUrl || undefined}
  alt={`${vehicle.name} — view ${activeImage + 1}`}
  width={1024}
  height={1024}
  className="aspect-[4/3] w-full object-cover"
/>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {(vehicle.imageUrl ? [vehicle.imageUrl] : []).map(
  (image: string, index: number) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`Show image ${index + 1}`}
                aria-current={activeImage === index}
                className={
                  activeImage === index
                    ? "overflow-hidden rounded-md ring-2 ring-accent"
                    : "overflow-hidden rounded-md ring-1 ring-border hover:ring-foreground/30"
                }
              >
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
            ))}
          </div>

          <header className="mt-10">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-medium tracking-tight">
                {vehicle.name}
              </h1>
              <AvailabilityPill status={vehicle.availability} />
              <MaintenancePill status={vehicle.maintenanceStatus} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" /> {vehicle.location}
              </span>
              <Rating value={vehicle.rating} count={vehicle.reviewCount} />
              <span>{vehicle.type}</span>
            </div>
          </header>

          <section className="mt-8">
            <h2 className="font-display text-lg font-medium">Description</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {vehicle.description}
            </p>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-lg font-medium">Specifications</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {specs.map((spec) => (
                <div key={spec.label} className="rounded-lg border border-border p-4">
                  <dt className="label-eyebrow flex items-center gap-1.5">
                    <spec.icon className="size-3.5" /> {spec.label}
                  </dt>
                  <dd className="mt-1.5 text-sm font-medium">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-lg font-medium">Features</h2>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {vehicle.features.map((feature: string) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BadgeCheck className="size-4 shrink-0 text-accent" />
                  {feature}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-lg font-medium">Reviews</h2>
            {reviews.isLoading && (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            )}
            {reviews.isError && (
              <ErrorState onRetry={() => void reviews.refetch()} />
            )}
            <ul className="mt-4 space-y-4">
              {(reviews.data ?? []).map((review) => (
                <li key={review.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{review.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.date)}
                    </span>
                  </div>
                  <Rating value={review.rating} className="mt-2" />
                  <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl font-medium tabular-nums">
                {formatCurrency(vehicle.pricePerDay, vehicle.currency)}
                <span className="text-sm font-normal text-muted-foreground">/day</span>
              </span>
              {typeof vehicle.matchScore === "number" && (
                <span className="rounded-sm bg-foreground px-2 py-1 text-[10px] font-semibold text-background">
                  {vehicle.matchScore}% MATCH
                </span>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <DatePicker label="Start date" value={start} onChange={setStart} id="detail-start" />
              <DatePicker label="End date" value={end} onChange={setEnd} id="detail-end" />
            </div>

            <Button asChild size="lg" className="mt-5 w-full" disabled={!bookable}>
              <Link
                to="/booking/$vehicleId"
                params={{ vehicleId: vehicle.id }}
                search={{
                  startDate: start ? format(start, "yyyy-MM-dd") : undefined,
                  endDate: end ? format(end, "yyyy-MM-dd") : undefined,
                }}
              >
                {bookable ? "Book now" : "Currently unavailable"}
              </Link>
            </Button>

            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" /> Free cancellation up to 24 hours before pickup
            </p>
          </div>

          {start && end && (
  <div className="mt-6">
    <PriceBreakdown
  pricing={quote.data as any}
  isLoading={quote.isLoading}
  nights={differenceInDays(end, start)}
/>
  </div>
)}

          <div className="mt-6 rounded-lg border border-border bg-card p-5">
            <p className="label-eyebrow">Vendor</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold">
                {vehicle.vendor.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                  {vehicle.vendor.name}
                  {vehicle.vendor.verified && <BadgeCheck className="size-4 text-accent" />}
                </p>
                <p className="text-xs text-muted-foreground">
                  Member since {vehicle.vendor.memberSince} • {vehicle.vendor.tripsCompleted} trips
                </p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-muted-foreground">Rating</dt>
                <dd className="mt-0.5 font-medium">{vehicle.vendor.rating.toFixed(1)} / 5</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Response time</dt>
                <dd className="mt-0.5 font-medium">{vehicle.vendor.responseTimeMinutes} min</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
