import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/components/layout/nav-items";
import { DataTable, type Column } from "@/components/common/DataTable";
import { BookingStatusPill, PaymentStatusPill } from "@/components/common/StatusPill";
import { adminService } from "@/services/dashboard.service";
import { formatCurrency, formatDateRange } from "@/lib/format";
import type { Booking } from "@/types";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({
    meta: [
      { title: "All Bookings — Ridefleet Admin" },
      {
        name: "description",
        content:
          "Every reservation on the platform with customer, operator, status and settled value.",
      },
      { property: "og:title", content: "All Bookings — Ridefleet Admin" },
      {
        property: "og:description",
        content: "Every reservation with customer, operator, status and value.",
      },
    ],
  }),
  component: AdminBookingsPage,
});

const columns: Column<Booking>[] = [
  { key: "ref", header: "Reference", render: (row) => <span className="text-sm font-medium">{row.reference}</span> },
  { key: "vehicle", header: "Vehicle", render: (row) => <span className="text-sm">{row.vehicleName}</span> },
  { key: "customer", header: "Customer", render: (row) => <span className="text-sm text-muted-foreground">{row.customerName}</span> },
  { key: "vendor", header: "Operator", render: (row) => <span className="text-sm text-muted-foreground">{row.vendorName}</span> },
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
  {
  key: "paymentStatus",
  header: "Payment",
  render: (row) => (
    <PaymentStatusPill status={row.paymentStatus ?? "pending"} />
  ),
},
  {
    key: "total",
    header: "Total",
    align: "right",
    render: (row) => (
      <span className="text-sm font-medium tabular-nums">
        {formatCurrency(row.total ?? 0, row.currency ?? "INR")}
      </span>
    ),
  },
];

function AdminBookingsPage() {
  const bookings = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: () => adminService.bookings(),
  });

  return (
    <DashboardShell
      workspace="Admin"
      title="Bookings"
      subtitle="Reservation flow across the whole platform."
      items={adminNav}
    >
      <DataTable
        columns={columns}
        rows={bookings.data ?? []}
        isLoading={bookings.isLoading}
        getRowKey={(row) => row.id}
        caption="All platform bookings"
      />
    </DashboardShell>
  );
}
