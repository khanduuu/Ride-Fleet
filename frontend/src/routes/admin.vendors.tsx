import { createFileRoute } from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/components/layout/nav-items";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusPill } from "@/components/common/StatusPill";
import { adminService } from "@/services/dashboard.service";
import type { Vendor } from "@/types";

export const Route = createFileRoute("/admin/vendors")({
  head: () => ({
    meta: [
      { title: "Vendor Approvals — Ridefleet Admin" },
      {
        name: "description",
        content:
          "Review vendor applications, verification state, fleet size and service ratings.",
      },
      { property: "og:title", content: "Vendor Approvals — Ridefleet Admin" },
      {
        property: "og:description",
        content: "Review vendor applications, verification state and fleet size.",
      },
    ],
  }),
  component: AdminVendorsPage,
});

const statusTone = {
  active: "success",
  pending: "warning",
  suspended: "danger",
} as const;

function AdminVendorsPage() {
  const queryClient = useQueryClient();

  const vendors = useQuery({
    queryKey: ["admin", "vendors"],
    queryFn: () => adminService.vendors(),
  });

  const updateStatus = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "pending" | "suspended";
    }) => adminService.updateUserStatus(id, status),

    onSuccess: () => {
      toast.success("Vendor status updated");

      queryClient.invalidateQueries({
        queryKey: ["admin", "vendors"],
      });

      queryClient.invalidateQueries({
        queryKey: ["admin", "users"],
      });
    },

    onError: (error) => {
      console.error("Vendor status update failed:", error);
      toast.error("Failed to update vendor status");
    },
  });

  const columns: Column<Vendor>[] = [
    {
      key: "name",
      header: "Vendor",
      render: (row) => (
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {row.name}
          {row.verified && <BadgeCheck className="size-4 text-accent" />}
        </span>
      ),
    },
    { key: "city", header: "City", render: (row) => <span className="text-sm text-muted-foreground">{row.city ?? "—"}</span> },
    { key: "fleet", header: "Fleet", render: (row) => <span className="text-sm tabular-nums text-muted-foreground">{row.vehicleCount ?? 0}</span> },
    { key: "rating", header: "Rating", render: (row) => <span className="text-sm tabular-nums text-muted-foreground">{(row.rating ?? 0).toFixed(1)}</span> },
    { key: "trips", header: "Trips", render: (row) => <span className="text-sm tabular-nums text-muted-foreground">{row.tripsCompleted}</span> },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusPill tone={statusTone[row.status ?? "active"]} label={row.status ?? "active"} />,
    },
    {
  key: "actions",
  header: "Actions",
  align: "right",
  render: (row) => (
    <Button
      size="sm"
      variant="outline"
      disabled={updateStatus.isPending}
      onClick={() =>
        updateStatus.mutate({
          id: row.id,
          status:
            row.status === "suspended"
              ? "active"
              : "suspended",
        })
      }
    >
      {row.status === "suspended" ? "Reinstate" : "Suspend"}
    </Button>
  ),
},
  ];

  return (
    <DashboardShell
      workspace="Admin"
      title="Vendors"
      subtitle="Operator verification and standing."
      items={adminNav}
    >
      <DataTable
        columns={columns}
        rows={vendors.data ?? []}
        isLoading={vendors.isLoading}
        getRowKey={(row) => row.id}
        caption="Platform vendors"
      />
    </DashboardShell>
  );
}
