import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { vendorNav } from "@/components/layout/nav-items";
import { DataTable, type Column } from "@/components/common/DataTable";
import { BookingStatusPill, PaymentStatusPill } from "@/components/common/StatusPill";
import { vendorService } from "@/services/dashboard.service";
import { formatCurrency, formatDateRange } from "@/lib/format";
import type { Booking } from "@/types";
import { apiClient } from "@/services/api-client";

export const Route = createFileRoute("/vendor/bookings")({
  head: () => ({
    meta: [
      { title: "Fleet Bookings — Ridefleet Vendor" },
      {
        name: "description",
        content:
          "Approve or decline incoming reservations and track every booking against your fleet.",
      },
      { property: "og:title", content: "Fleet Bookings — Ridefleet Vendor" },
      {
        property: "og:description",
        content: "Approve or decline reservations and track bookings against your fleet.",
      },
    ],
  }),
  component: VendorBookingsPage,
});

function VendorBookingsPage() {
  const bookings = useQuery({
    queryKey: ["vendor", "bookings", "all"],
    queryFn: () => vendorService.bookings(),
  });

  const columns: Column<Booking>[] = [
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
    { key: "payment", header: "Payment", render: (row) => <PaymentStatusPill status={row.paymentStatus} /> },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (row) => (
        <span className="text-sm font-medium tabular-nums">
          {formatCurrency(row.total, row.currency)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) =>
        row.status === "pending" ? (
          <div className="flex items-center gap-4">
  <Button
    size="sm"
    onClick={async () => {
      try {
        await apiClient.request(
          `/vendor/bookings/${row.id}/approve`,
          {
            method: "PUT",
          }
        );

        toast.success(`Approved ${row.reference}`);
        window.location.reload();
      } catch (error: any) {
        toast.error(
          error?.details?.detail ||
          "Failed to approve booking"
        );
      }
    }}
  >
    Approve
  </Button>

  <Button
    variant="ghost"
    size="sm"
    onClick={async () => {
      try {
        await apiClient.request(
          `/vendor/bookings/${row.id}/decline`,
          {
            method: "PUT",
          }
        );

        toast.success(`Declined ${row.reference}`);
        window.location.reload();
      } catch (error: any) {
        toast.error(
          error?.details?.detail ||
          "Failed to decline booking"
        );
      }
    }}
  >
    Decline
  </Button>
</div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <DashboardShell
      workspace="Vendor"
      title="Bookings"
      subtitle="Incoming and historical reservations."
      items={vendorNav}
    >
      <DataTable
        columns={columns}
        rows={bookings.data ?? []}
        isLoading={bookings.isLoading}
        getRowKey={(row) => row.id}
        caption="Vendor bookings"
        emptyTitle="No bookings yet"
      />
    </DashboardShell>
  );
}
