import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CalendarDays, Truck, Wallet } from "lucide-react";
import { DashboardShell, SectionHeading } from "@/components/layout/DashboardShell";
import { vendorNav } from "@/components/layout/nav-items";
import { DashboardCard } from "@/components/common/DashboardCard";
import { StatsSkeleton } from "@/components/common/Skeletons";
import {
  CategoryBarChart,
  ChartPanel,
  RevenueAreaChart,
} from "@/components/common/Charts";
import { DataTable, type Column } from "@/components/common/DataTable";
import { BookingStatusPill } from "@/components/common/StatusPill";
import { vendorService } from "@/services/dashboard.service";
import { formatCurrency, formatDateRange } from "@/lib/format";
import type { Booking } from "@/types";

export const Route = createFileRoute("/vendor/")({
    beforeLoad: () => {
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
  if (payload.role !== "vendor") {
    throw redirect({ to: "/dashboard" });
  }
},
  head: () => ({
    meta: [
      { title: "Vendor Dashboard — Ridefleet" },
      {
        name: "description",
        content:
          "Monitor fleet revenue, utilisation, active bookings and maintenance exposure across your vehicles.",
      },
      { property: "og:title", content: "Vendor Dashboard — Ridefleet" },
      {
        property: "og:description",
        content: "Monitor fleet revenue, utilisation, bookings and maintenance exposure.",
      },
    ],
  }),
  component: VendorDashboard,
});

const bookingColumns: Column<Booking>[] = [
  { key: "ref", header: "Reference", render: (row) => <span className="text-sm font-medium">{row.reference}</span> },
  { key: "vehicle", header: "Vehicle", render: (row) => <span className="text-sm">{row.vehicleName}</span> },
  { key: "customer", header: "Customer", render: (row) => <span className="text-sm text-muted-foreground">{row.customerName}</span> },
  {
    key: "dates",
    header: "Dates",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {formatDateRange(row.startDate, row.endDate)}
      </span>
    ),
  },
  { key: "status", header: "Status", render: (row) => <BookingStatusPill status={row.status} /> },
];

function VendorDashboard() {
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

    if (payload.role !== "vendor") {
      void navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  const overview = useQuery({
    queryKey: ["vendor", "overview"],
    queryFn: () => vendorService.overview(),
  });
   const bookings = useQuery({
    queryKey: ["vendor", "bookings"],
    queryFn: () => vendorService.bookings(),
  });
  const data = overview.data;
  return (
    <DashboardShell
      workspace="Vendor"
      title="Fleet overview"
      subtitle="Performance across every vehicle you operate."
      items={vendorNav}
    >
      {overview.isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            label="Total vehicles"
            value={`${data?.totalVehicles ?? 0}`}
            hint="Listed on the platform"
            icon={Truck}
          />
          <DashboardCard
            label="Active bookings"
            value={`${data?.activeBookings ?? 0}`}
            hint="On the road now"
            icon={CalendarCheck}
          />
          <DashboardCard
            label="Upcoming"
            value={`${data?.upcomingBookings ?? 0}`}
            hint="Next 14 days"
            icon={CalendarDays}
          />
          <DashboardCard
  label="Revenue"
  value={data ? formatCurrency(data.revenue, data.currency) : "—"}
  delta="+12.4%"
  hint="vs. last quarter"
  icon={Wallet}
/>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartPanel title="Revenue" description="Monthly gross bookings value.">
          <RevenueAreaChart data={data?.revenueSeries ?? []} />
        </ChartPanel>
        <ChartPanel title="Utilisation" description="Percentage of fleet on hire.">
          <CategoryBarChart data={data?.utilisationSeries ?? []} />
        </ChartPanel>
      </div>

      <section>
        <SectionHeading title="Recent bookings" description="Latest reservations across your fleet." />
        <DataTable
          columns={bookingColumns}
          rows={bookings.data ?? []}
          isLoading={bookings.isLoading}
          getRowKey={(row) => row.id}
          caption="Recent vendor bookings"
        />
      </section>
    </DashboardShell>
  );
}
