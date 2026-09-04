import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import {
  DashboardShell,
  SectionHeading,
} from "@/components/layout/DashboardShell";

import { vendorNav } from "@/components/layout/nav-items";

import { DashboardCard } from "@/components/common/DashboardCard";

import {
  ChartPanel,
  RevenueAreaChart,
} from "@/components/common/Charts";

import {
  DataTable,
  type Column,
} from "@/components/common/DataTable";

import { PaymentStatusPill } from "@/components/common/StatusPill";

import { vendorService } from "@/services/dashboard.service";

import {
  formatCurrency,
  formatDate,
} from "@/lib/format";

import type { Payment } from "@/types";

export const Route = createFileRoute("/vendor/earnings")({
  head: () => ({
    meta: [
      {
        title: "Earnings & Payouts — Ridefleet Vendor",
      },
      {
        name: "description",
        content:
          "Gross revenue, platform fees and payout status for every rental in your fleet.",
      },
      {
        property: "og:title",
        content: "Earnings & Payouts — Ridefleet Vendor",
      },
      {
        property: "og:description",
        content:
          "Gross revenue, platform fees and payout status for every rental.",
      },
    ],
  }),

  component: EarningsPage,
});

const columns: Column<Payment>[] = [
  {
    key: "ref",
    header: "Booking",
    render: (row) => (
      <span className="text-sm font-medium">
        {row.bookingRef}
      </span>
    ),
  },

  {
    key: "payer",
    header: "Payer",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.payer ?? "—"}
      </span>
    ),
  },

  {
    key: "date",
    header: "Date",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.date)}
      </span>
    ),
  },

  {
    key: "status",
    header: "Status",
    render: (row) => (
      <PaymentStatusPill status={row.status} />
    ),
  },

  {
    key: "amount",
    header: "Amount",
    align: "right",
    render: (row) => (
      <span className="text-sm font-medium tabular-nums">
        {formatCurrency(row.amount, "INR")}
      </span>
    ),
  },
];

function EarningsPage() {
  const payments = useQuery({
    queryKey: ["vendor", "earnings"],
    queryFn: () => vendorService.earnings(),
  });

  const rows = payments.data ?? [];

  /*
   * Only completed/paid payments count as vendor revenue.
   */
  const completedPayments = rows.filter(
  (payment) => payment.status === "paid",
);

  /*
   * Gross revenue
   */
  const gross = completedPayments.reduce(
    (total, payment) =>
      total + Number(payment.amount || 0),
    0,
  );

  /*
   * Platform fee = 12%
   */
  const platformFees = gross * 0.12;

  /*
   * Vendor payout = 88%
   */
  const netPayout = gross - platformFees;

  /*
   * Revenue by month
   */
  const revenueByMonth: Record<string, number> = {};

  completedPayments.forEach((payment) => {
    const date = new Date(payment.date);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const month = date.toLocaleString("en-IN", {
      month: "short",
    });

    revenueByMonth[month] =
      (revenueByMonth[month] ?? 0) +
      Number(payment.amount || 0);
  });

  const revenueSeries = Object.entries(
    revenueByMonth,
  ).map(([month, revenue]) => ({
    month,
    revenue,
  }));

  return (
    <DashboardShell
      workspace="Vendor"
      title="Earnings"
      subtitle="Revenue, fees and payouts."
      items={vendorNav}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard
          label="Gross revenue"
          value={formatCurrency(gross, "INR")}
          hint="Total paid booking revenue"
        />

        <DashboardCard
          label="Platform fees"
          value={formatCurrency(platformFees, "INR")}
          hint="12% of gross"
        />

        <DashboardCard
          label="Net payout"
          value={formatCurrency(netPayout, "INR")}
          hint="88% after platform fees"
        />
      </div>

      <ChartPanel
        title="Revenue trend"
        description="Gross paid booking revenue by month."
      >
        <RevenueAreaChart
  data={revenueSeries.map((item) => ({
    label: item.month,
    value: item.revenue,
  }))}
/>
      </ChartPanel>

      <section>
        <SectionHeading
          title="Transactions"
          description="Every payment associated with your vehicles."
        />

        <DataTable
          columns={columns}
          rows={rows}
          isLoading={payments.isLoading}
          getRowKey={(row) => row.id}
          caption="Vendor transactions"
        />
      </section>
    </DashboardShell>
  );
}