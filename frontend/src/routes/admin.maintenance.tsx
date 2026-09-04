import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell, SectionHeading } from "@/components/layout/DashboardShell";
import { adminNav } from "@/components/layout/nav-items";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusPill } from "@/components/common/StatusPill";
import { adminService } from "@/services/dashboard.service";
import { formatCurrency, formatDate } from "@/lib/format";
import type { MaintenanceRecord } from "@/types";

export const Route = createFileRoute("/admin/maintenance")({
  component: AdminMaintenance,
});

const columns: Column<MaintenanceRecord>[] = [
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
  render: (row) => {
    const statusMap = {
      scheduled: {
        label: "Scheduled",
        tone: "warning" as const,
      },
      in_progress: {
        label: "In Progress",
        tone: "accent" as const,
      },
      completed: {
        label: "Completed",
        tone: "success" as const,
      },
    };

    const status = statusMap[row.status];

    return (
      <StatusPill
        label={status.label}
        tone={status.tone}
      />
    );
  },
},
];

function AdminMaintenance() {
  const maintenance = useQuery({
    queryKey: ["admin", "maintenance"],
    queryFn: () => adminService.maintenance(),
  });

  return (
    <DashboardShell
      workspace="Admin"
      title="Maintenance"
      subtitle="Manage vehicle maintenance records."
      items={adminNav}
    >
      <SectionHeading
        title="Maintenance records"
        description="Maintenance activity across all vehicles."
      />

      <DataTable
        columns={columns}
        rows={maintenance.data ?? []}
        isLoading={maintenance.isLoading}
        getRowKey={(row) => row.id}
        caption="Vehicle maintenance records"
      />
    </DashboardShell>
  );
}