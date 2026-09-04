import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { adminNav } from "@/components/layout/nav-items";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusPill } from "@/components/common/StatusPill";
import { adminService } from "@/services/dashboard.service";
import { formatDate } from "@/lib/format";
import type { PlatformUser } from "@/types";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — Ridefleet Admin" },
      {
        name: "description",
        content:
          "Search platform accounts, review roles and suspend or reinstate access from one table.",
      },
      { property: "og:title", content: "User Management — Ridefleet Admin" },
      {
        property: "og:description",
        content: "Search platform accounts, review roles and manage access.",
      },
    ],
  }),
  component: AdminUsersPage,
});


const statusTone = {
  active: "success",
  pending: "warning",
  suspended: "danger",
} as const;

function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: () => adminService.users() });
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
  mutationFn: ({
    id,
    status,
  }: {
    id: string;
    status: "active" | "pending" | "suspended";
  }) => adminService.updateUserStatus(id, status),

  onSuccess: () => {
    toast.success("User status updated");

    queryClient.invalidateQueries({
      queryKey: ["admin", "users"],
    });
  },

  onError: () => {
    toast.error("Failed to update user status");
  },
});
  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const all = users.data ?? [];
    if (!term) return all;
    return all.filter(
      (user) =>
        user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term),
    );
  }, [users.data, query]);

  const columns: Column<PlatformUser>[] = [
    {
      key: "name",
      header: "User",
      render: (row) => (
        <div className="min-w-0">
          <span className="block truncate text-sm font-medium">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.email}</span>
        </div>
      ),
    },
    { key: "role", header: "Role", render: (row) => <span className="text-sm capitalize text-muted-foreground">{row.role}</span> },
    { key: "joined", header: "Joined", render: (row) => <span className="text-sm text-muted-foreground">{formatDate(row.joinedAt)}</span> },
    { key: "bookings", header: "Bookings", render: (row) => <span className="text-sm tabular-nums text-muted-foreground">{row.bookings}</span> },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusPill tone={statusTone[row.status]} label={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <Button
  size="sm"
  variant="outline"
  onClick={() =>
    updateStatus.mutate({
      id: row.id,
      status: row.status === "suspended" ? "active" : "suspended",
    })
  }
  disabled={updateStatus.isPending}
>
  {row.status === "suspended" ? "Reinstate" : "Suspend"}
</Button>
      ),
    },
  ];

  return (
    <DashboardShell
      workspace="Admin"
      title="Users"
      subtitle="Every account on the platform."
      items={adminNav}
      actions={
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email"
          aria-label="Search users"
          className="sm:w-64"
        />
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        isLoading={users.isLoading}
        getRowKey={(row) => row.id}
        caption="Platform users"
        emptyTitle="No users match"
        emptyDescription="Try a different name or email."
      />
    </DashboardShell>
  );
}
