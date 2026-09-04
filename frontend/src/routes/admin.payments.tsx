import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell, SectionHeading } from "@/components/layout/DashboardShell";
import { adminNav } from "@/components/layout/nav-items";
import { DashboardCard } from "@/components/common/DashboardCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { PaymentStatusPill } from "@/components/common/StatusPill";
import { adminService } from "@/services/dashboard.service";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Payment } from "@/types";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "Payments & Settlements — Ridefleet Admin" },
      {
        name: "description",
        content:
          "Track captured, pending, refunded and failed payments across every operator on the platform.",
      },
      { property: "og:title", content: "Payments & Settlements — Ridefleet Admin" },
      {
        property: "og:description",
        content: "Track captured, pending, refunded and failed payments platform-wide.",
      },
    ],
  }),
  component: AdminPaymentsPage,
});

const columns: Column<Payment>[] = [
  { key: "ref", header: "Booking", render: (row) => <span className="text-sm font-medium">{row.bookingRef}</span> },
  { key: "payer", header: "Payer", render: (row) => <span className="text-sm text-muted-foreground">{row.payer ?? "—"}</span> },
  { key: "method", header: "Method", render: (row) => <span className="text-sm text-muted-foreground">{row.method}</span> },
  { key: "date", header: "Date", render: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.date)}</span> },
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

function AdminPaymentsPage() {
  const payments = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: () => adminService.payments(),
  });

  const rows = payments.data ?? [];
  const currency = rows[0]?.currency ?? "USD";
  const captured = rows.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const pending = rows.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
  const refunded = rows.filter((p) => p.status === "refunded").reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardShell
      workspace="Admin"
      title="Payments"
      subtitle="Settlement state across the platform."
      items={adminNav}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard label="Captured" value={formatCurrency(captured, currency)} hint="Settled to operators" />
        <DashboardCard label="Pending" value={formatCurrency(pending, currency)} hint="Awaiting capture" />
        <DashboardCard label="Refunded" value={formatCurrency(refunded, currency)} hint="Returned to customers" />
      </div>

      <section>
        <SectionHeading title="Transactions" />
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={payments.isLoading}
          getRowKey={(row) => row.id}
          caption="Platform payments"
        />
      </section>
    </DashboardShell>
  );
}
