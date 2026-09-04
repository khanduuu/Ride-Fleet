import { createFileRoute , redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { customerNav } from "@/components/layout/nav-items";
import { DataTable, type Column } from "@/components/common/DataTable";
import { PaymentStatusPill } from "@/components/common/StatusPill";
import { bookingsService } from "@/services/bookings.service";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Payment } from "@/types";

export const Route = createFileRoute("/dashboard/payments")({
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
      { title: "Payment History — Ridefleet" },
      {
        name: "description",
        content: "Invoices, payment methods and refund status for every Ridefleet rental.",
      },
      { property: "og:title", content: "Payment History — Ridefleet" },
      {
        property: "og:description",
        content: "Invoices, payment methods and refund status for every rental.",
      },
    ],
  }),
  component: PaymentsPage,
});

const columns: Column<Payment>[] = [
  { key: "ref", header: "Booking", render: (row) => <span className="text-sm font-medium">{row.bookingRef}</span> },
  { key: "date", header: "Date", render: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.date)}</span> },
  { key: "method", header: "Method", render: (row) => <span className="text-sm text-muted-foreground">{row.method}</span> },
  { key: "status", header: "Status", render: (row) => <PaymentStatusPill status={row.status} /> },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    render: (row) => (
      <span className="text-sm font-medium tabular-nums">
        {formatCurrency(row.amount, row.currency)}
      </span>
    ),
  },
];

function PaymentsPage() {
  const payments = useQuery({
    queryKey: ["customer", "payments"],
    queryFn: () => bookingsService.payments(),
  });

  return (
    <DashboardShell
      workspace="Customer"
      title="Payments"
      subtitle="Receipts and refunds across your rentals."
      items={customerNav}
    >
      <DataTable
        columns={columns}
        rows={payments.data ?? []}
        isLoading={payments.isLoading}
        getRowKey={(row) => row.id}
        caption="Payment history"
        emptyTitle="No payments yet"
      />
    </DashboardShell>
  );
}
