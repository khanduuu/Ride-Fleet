import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBar } from "@/components/common/SearchBar";
import { VehicleGrid } from "@/components/common/VehicleGrid";
import {
  FilterPanel,
  FilterPanelMobile,
  emptyFilters,
  filtersToQuery,
  type FilterState,
} from "@/components/common/FilterPanel";
import { vehiclesService } from "@/services/vehicles.service";
import type { Vehicle, VehicleQuery, VehicleType, FuelType } from "@/types";

interface VehicleSearch {
  location?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  type?: string | undefined;
  fuel?: string | undefined;
}

export const Route = createFileRoute("/vehicles/")({
  validateSearch: (search: Record<string, unknown>): VehicleSearch => ({
  location: typeof search["location"] === "string" ? search["location"] : undefined,
  startDate: typeof search["startDate"] === "string" ? search["startDate"] : undefined,
  endDate: typeof search["endDate"] === "string" ? search["endDate"] : undefined,
  type: typeof search["type"] === "string" ? search["type"] : undefined,
  fuel: typeof search["fuel"] === "string" ? search["fuel"] : undefined,
}),
  head: () => ({
    meta: [
      { title: "Browse Vehicles — Ridefleet" },
      {
        name: "description",
        content:
          "Filter the Ridefleet fleet by type, price, fuel, transmission, seats and location, then book the vehicle that fits your trip.",
      },
      { property: "og:title", content: "Browse Vehicles — Ridefleet" },
      {
        property: "og:description",
        content:
          "Filter the Ridefleet fleet by type, price, fuel, transmission, seats and location.",
      },
    ],
  }),
  component: VehiclesPage,
});

const PAGE_SIZE = 6;

function VehiclesPage() {
  const search = Route.useSearch();
  const [filters, setFilters] = useState<FilterState>({
  ...emptyFilters,
  location: search.location ?? "",
  types: search.type ? [search.type as VehicleType] : [],
  fuels: search.fuel ? [search.fuel as FuelType] : [],
});
  const [sort, setSort] = useState<NonNullable<VehicleQuery["sort"]>>("recommended");
  const [page, setPage] = useState(1);
  const [favourites, setFavourites] = useState<string[]>([]);
  
  const favouritesQuery = useQuery({
  queryKey: ["vehicles", "favourites"],
  queryFn: () => vehiclesService.favourites(),
});
  useEffect(() => {
  if (favouritesQuery.data) {
    setFavourites(
      favouritesQuery.data.map((vehicle) => vehicle.id)
    );
  }
}, [favouritesQuery.data]);

  const query = useMemo<VehicleQuery>(
    () => ({ ...filtersToQuery(filters), sort, page, pageSize: PAGE_SIZE }),
    [filters, sort, page],
  );

  const listQuery = useQuery({
    queryKey: ["vehicles", "list", query],
    queryFn: () => vehiclesService.list(query),
  });

  function updateFilters(next: FilterState) {
    setFilters(next);
    setPage(1);
  }

  async function toggleFavourite(vehicle: Vehicle) {
  const exists = favourites.includes(vehicle.id);

  try {
    if (exists) {
      await vehiclesService.removeFavourite(vehicle.id);

      setFavourites((prev) =>
        prev.filter((id) => id !== vehicle.id)
      );

      toast("Removed from favourites", {
        description: vehicle.name,
      });
    } else {
      await vehiclesService.addFavourite(vehicle.id);

      setFavourites((prev) => [
        ...prev,
        vehicle.id,
      ]);

      toast("Saved to favourites", {
        description: vehicle.name,
      });
    }
  } catch (error) {
    console.error("Favourite error:", error);

    toast.error(
      exists
        ? "Failed to remove favourite"
        : "Failed to save favourite"
    );
  }
}

  const data = listQuery.data;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Available fleet
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {data
            ? `${data.total} vehicle${data.total === 1 ? "" : "s"} matching your search`
            : "Loading availability…"}
        </p>
      </header>

      <SearchBar
        variant="inline"
        defaultLocation={search.location ?? ""}
        className="mt-6"
      />

      <div className="mt-10 flex gap-10">
        <aside className="hidden w-64 shrink-0 lg:block">
          <FilterPanel
            filters={filters}
            onChange={updateFilters}
            onClear={() => updateFilters(emptyFilters)}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <FilterPanelMobile
              filters={filters}
              onChange={updateFilters}
              onClear={() => updateFilters(emptyFilters)}
            />
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="label-eyebrow">
                Sort
              </label>
              <Select
                value={sort}
                onValueChange={(value) => {
                  setSort(value as NonNullable<VehicleQuery["sort"]>);
                  setPage(1);
                }}
              >
                <SelectTrigger id="sort" className="w-[190px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price_asc">Price: low to high</SelectItem>
                  <SelectItem value="price_desc">Price: high to low</SelectItem>
                  <SelectItem value="rating_desc">Highest rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <VehicleGrid
            vehicles={data?.items ?? []}
            isLoading={listQuery.isLoading}
            isError={listQuery.isError}
            onRetry={() => void listQuery.refetch()}
            favourites={favourites}
            onToggleFavourite={toggleFavourite}
            onClearFilters={() => updateFilters(emptyFilters)}
          />

          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-12 flex items-center justify-center gap-2"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={page === i + 1 ? "default" : "outline"}
                  aria-current={page === i + 1 ? "page" : undefined}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
