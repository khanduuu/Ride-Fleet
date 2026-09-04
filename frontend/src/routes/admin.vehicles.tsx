import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/components/layout/nav-items";
import { DataTable, type Column } from "@/components/common/DataTable";
import {
  AvailabilityPill,
  VehicleMaintenancePill,
} from "@/components/common/StatusPill";
import { adminService } from "@/services/dashboard.service";
import { formatCurrency } from "@/lib/format";
import type { Vehicle } from "@/types";

export const Route = createFileRoute("/admin/vehicles")({
  head: () => ({
    meta: [
      { title: "Fleet Registry — Ridefleet Admin" },
      {
        name: "description",
        content:
          "Every vehicle on the platform with its operator, rate, availability and maintenance state.",
      },
      { property: "og:title", content: "Fleet Registry — Ridefleet Admin" },
      {
        property: "og:description",
        content: "Every vehicle on the platform with operator, rate and availability.",
      },
    ],
  }),
  component: AdminVehiclesPage,
});

const columns: Column<Vehicle>[] = [
  {
    key: "vehicle",
    header: "Vehicle",
    render: (row) => (
      <Link
        to="/vehicles/$vehicleId"
        params={{ vehicleId: row.id }}
        className="text-sm font-medium hover:underline"
      >
        {row.name}
      </Link>
    ),
  },
  { key: "vendor", header: "Operator", render: (row) => <span className="text-sm text-muted-foreground">{row.vendor.name}</span> },
  { key: "type", header: "Type", render: (row) => <span className="text-sm text-muted-foreground">{row.type}</span> },
  { key: "location", header: "Location", render: (row) => <span className="text-sm text-muted-foreground">{row.location}</span> },
  {
    key: "rate",
    header: "Rate / day",
    render: (row) => (
      <span className="text-sm font-medium tabular-nums">
        {formatCurrency(row.pricePerDay, row.currency)}
      </span>
    ),
  },
  { key: "availability", header: "Availability", render: (row) => <AvailabilityPill status={row.availability} /> },
  {
  key: "maintenance",
  header: "Maintenance",
  render: (row) => (
    <VehicleMaintenancePill status={row.maintenanceStatus} />
  ),
},
];

function AdminVehiclesPage() {
  const vehicles = useQuery({
    queryKey: ["admin", "vehicles"],
    queryFn: () => adminService.vehicles(),
  });

  return (
    <DashboardShell
      workspace="Admin"
      title="Fleet registry"
      subtitle="All vehicles listed across every operator."
      items={adminNav}
    >
      <DataTable
        columns={columns}
        rows={vehicles.data ?? []}
        isLoading={vehicles.isLoading}
        getRowKey={(row) => row.id}
        caption="Platform vehicles"
      />
    </DashboardShell>
  );
}
