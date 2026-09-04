import { createFileRoute, Link , redirect} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { customerNav } from "@/components/layout/nav-items";
import { VehicleGrid } from "@/components/common/VehicleGrid";
import { vehiclesService } from "@/services/vehicles.service";

export const Route = createFileRoute("/dashboard/favorites")({
  beforeLoad: () => {
  if (typeof window === "undefined") return;

  const token = localStorage.getItem("access_token");

  if (!token) {
    throw redirect({ to: "/auth" });
  }

  const encodedPayload = token.split(".")[1];

if (!encodedPayload) {
  throw redirect({ to: "/auth" });
}

const payload = JSON.parse(atob(encodedPayload));

  if (payload.role === "vendor") {
    throw redirect({ to: "/vendor" });
  }

  if (payload.role === "admin") {
    throw redirect({ to: "/admin" });
  }
},
  head: () => ({
    meta: [
      { title: "Saved Vehicles — Ridefleet" },
      {
        name: "description",
        content: "The vehicles you've saved, with live availability and daily rates.",
      },
      { property: "og:title", content: "Saved Vehicles — Ridefleet" },
      {
        property: "og:description",
        content: "The vehicles you've saved, with live availability and daily rates.",
      },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const favourites = useQuery({
  queryKey: ["vehicles", "favourites"],
  queryFn: () => vehiclesService.favourites(),
});

  return (
    <DashboardShell
      workspace="Customer"
      title="Favorites"
      subtitle="Saved vehicles, ready to rebook."
      items={customerNav}
      actions={
        <Button asChild variant="outline">
          <Link to="/vehicles">Find more</Link>
        </Button>
      }
    >
      <VehicleGrid
  vehicles={favourites.data ?? []}
  isLoading={favourites.isLoading}
  isError={favourites.isError}
  onRetry={() => void favourites.refetch()}
  onToggleFavourite={async (vehicle) => {
    try {
      await vehiclesService.removeFavourite(vehicle.id);

      await favourites.refetch();
    } catch (error: any) {
      console.error("Remove favourite error:", error);

      alert(
        error?.details?.detail ||
        "Failed to remove vehicle from favourites"
      );
    }
  }}
  skeletonCount={2}
/>
    </DashboardShell>
  );
}
