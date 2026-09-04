import { useEffect } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CarFront, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { DashboardShell, SectionHeading } from "@/components/layout/DashboardShell";
import { adminNav } from "@/components/layout/nav-items";
import { DashboardCard } from "@/components/common/DashboardCard";
import { StatsSkeleton } from "@/components/common/Skeletons";
import {
  CategoryBarChart,
  ChartPanel,
  RevenueAreaChart,
} from "@/components/common/Charts";
import { DataTable, type Column } from "@/components/common/DataTable";
import { MaintenancePill } from "@/components/common/StatusPill";
import { adminService } from "@/services/dashboard.service";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type {
  MaintenanceRecord,
  VehicleMaintenanceStatus,
} from "@/types";

export const Route = createFileRoute("/admin/")({
     
    beforeLoad: () => {
      console.log("ADMIN GUARD RUNNING");
  if (typeof window === "undefined") {
    return;
  }

  const token = localStorage.getItem("access_token");

  if (!token) {
    throw redirect({ to: "/auth" });
  }

  const encodedPayload = token.split(".")[1];

  if (!encodedPayload) {
    throw redirect({ to: "/auth" });
  }

  const payload = JSON.parse(atob(encodedPayload));

  if (payload.role !== "admin") {
    throw redirect({ to: "/dashboard" });
  }
},
  head: () => ({
    meta: [
      { title: "Admin Console — Ridefleet" },
      {
        name: "description",
        content:
          "Platform-wide oversight of users, vendors, vehicles, revenue and maintenance exposure.",
      },
      { property: "og:title", content: "Admin Console — Ridefleet" },
      {
        property: "og:description",
        content: "Platform-wide oversight of users, vendors, vehicles and revenue.",
      },
    ],
  }),
  component: AdminDashboard,
});

const maintenanceColumns: Column<MaintenanceRecord>[] = [
  {
    key: "vehicleId",
    header: "Vehicle",
    render: (row) => (
      <span className="text-sm font-medium">
        Vehicle {row.vehicleId}
      </span>
    ),
  },
  {
    key: "maintenanceType",
    header: "Task",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.maintenanceType}
      </span>
    ),
  },
  {
    key: "maintenanceDate",
    header: "Date",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.maintenanceDate)}
      </span>
    ),
  },
  {
    key: "cost",
    header: "Cost",
    render: (row) => (
      <span className="text-sm tabular-nums">
        {formatCurrency(row.cost, "INR")}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <MaintenancePill
  status={row.status as VehicleMaintenanceStatus}
/>
    ),
  },
];

function AdminDashboard() {
    const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      void navigate({ to: "/auth" });
      return;
    }

    const encodedPayload = token.split(".")[1];

    if (!encodedPayload) {
      void navigate({ to: "/auth" });
      return;
    }

    const payload = JSON.parse(atob(encodedPayload));

    if (payload.role !== "admin") {
      void navigate({ to: "/dashboard" });
    }
  }, [navigate]);
  const overview = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => adminService.overview(),
  });
  const maintenance = useQuery({
    queryKey: ["admin", "maintenance"],
    queryFn: () => adminService.maintenance(),
  });

  const data = overview.data;

  return (
    <DashboardShell
      workspace="Admin"
      title="Platform overview"
      subtitle="Everything happening across Ridefleet right now."
      items={adminNav}
    >
      {overview.isLoading ? (
        <StatsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard label="Total users" value={formatNumber(data?.totalUsers ?? 0)} hint="Customers & operators" icon={Users} />
          <DashboardCard label="Vendors" value={formatNumber(data?.totalVendors ?? 0)} hint="Verified fleets" icon={ShieldCheck} />
          <DashboardCard label="Vehicles" value={formatNumber(data?.totalVehicles ?? 0)} hint={`${data?.activeRentals ?? 0} on hire`} icon={CarFront} />
          <DashboardCard
            label="Revenue"
            value={data ? formatCurrency(data.revenue, data.currency, true) : "—"}
            delta="+8.9%"
            hint="Trailing 12 months"
            icon={TrendingUp}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartPanel title="Platform revenue" description="Gross bookings value by month.">
          <RevenueAreaChart data={data?.revenueSeries ?? []} />
        </ChartPanel>
        <ChartPanel title="Bookings by category" description="Demand split across vehicle classes.">
          <CategoryBarChart data={data?.bookingsByCategory ?? []} />
        </ChartPanel>
      </div>

      <section>
        <SectionHeading
          title="Maintenance exposure"
          description="Vehicles approaching or inside a service window."
        />
        <DataTable
          columns={maintenanceColumns}
          rows={maintenance.data ?? []}
          isLoading={maintenance.isLoading}
          getRowKey={(row) => row.id}
          caption="Platform maintenance exposure"
        />
      </section>
    </DashboardShell>
  );
}
