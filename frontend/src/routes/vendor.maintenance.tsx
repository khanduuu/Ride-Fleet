import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  useMutation,
  useQuery as useReactQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { vendorNav } from "@/components/layout/nav-items";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusPill } from "@/components/common/StatusPill";
import { Modal } from "@/components/common/Modal";

import { vendorService } from "@/services/dashboard.service";
import { formatDate, formatNumber } from "@/lib/format";

import type { MaintenanceRecord } from "@/types";

export const Route = createFileRoute("/vendor/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance Schedule — Ridefleet Vendor" },
      {
        name: "description",
        content:
          "Service windows and maintenance records for every vehicle in your fleet.",
      },
      {
        property: "og:title",
        content: "Maintenance Schedule — Ridefleet Vendor",
      },
      {
        property: "og:description",
        content: "Maintenance records for your fleet.",
      },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const [addOpen, setAddOpen] = useState(false);

  const [vehicleId, setVehicleId] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("");
  const [description, setDescription] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [cost, setCost] = useState("");

  const [status, setStatus] = useState<
    "scheduled" | "in_progress" | "completed"
  >("scheduled");

  // Maintenance records
  const records = useReactQuery({
    queryKey: ["vendor", "maintenance"],
    queryFn: () => vendorService.maintenance(),
  });

  // Vendor vehicles
  const vehicles = useReactQuery({
    queryKey: ["vendor", "vehicles"],
    queryFn: () => vendorService.vehicles(),
  });

  // Create maintenance
  const createMaintenance = useMutation({
    mutationFn: () =>
      vendorService.createMaintenance({
      vehicle_id: Number(vehicleId),
      maintenance_type: maintenanceType,
      ...(description ? { description } : {}),
      maintenance_date: maintenanceDate,
      cost: Number(cost) || 0,
      status,
   }),

    onSuccess: async () => {
      toast.success("Maintenance record added successfully");

      setAddOpen(false);
      setVehicleId("");
      setMaintenanceType("");
      setDescription("");
      setMaintenanceDate("");
      setCost("");
      setStatus("scheduled");

      await records.refetch();
    },

    onError: (error: any) => {
      toast.error(
        error?.details?.detail ||
          "Failed to add maintenance record"
      );
    },
  });

  const columns: Column<MaintenanceRecord>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      render: (row) => (
        <span className="text-sm font-medium">
          {row.vehicleName}
        </span>
      ),
    },

    {
      key: "type",
      header: "Maintenance",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.maintenanceType}
        </span>
      ),
    },

    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.description || "—"}
        </span>
      ),
    },

    {
      key: "date",
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
        <span className="text-sm tabular-nums text-muted-foreground">
          ₹{formatNumber(row.cost)}
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

        const currentStatus = statusMap[row.status];

        return (
          <StatusPill
            label={currentStatus.label}
            tone={currentStatus.tone}
          />
        );
      },
    },

    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          disabled={row.status === "completed"}
          onClick={async () => {
            try {
              await vendorService.markServiced(row.id);

              await records.refetch();

              toast.success(
                `Service completed for ${row.vehicleName}`
              );
            } catch (error) {
              console.error(error);

              toast.error(
                "Failed to mark service as completed"
              );
            }
          }}
        >
          {row.status === "completed"
            ? "Serviced"
            : "Mark serviced"}
        </Button>
      ),
    },
  ];

  return (
    <DashboardShell
      workspace="Vendor"
      title="Maintenance"
      subtitle="Predictive service windows before a vehicle fails."
      items={vendorNav}
      actions={
        <Button onClick={() => setAddOpen(true)}>
          Add Maintenance
        </Button>
      }
    >
      <DataTable
        columns={columns}
        rows={records.data ?? []}
        isLoading={records.isLoading}
        getRowKey={(row) => row.id}
        caption="Maintenance schedule"
        emptyTitle="Nothing due"
        emptyDescription="Every vehicle is inside its service window."
      />

      <Modal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add maintenance"
        description="Create a maintenance record for one of your vehicles."
        footer={
          <Button
            onClick={() => createMaintenance.mutate()}
            disabled={
              createMaintenance.isPending ||
              !vehicleId ||
              !maintenanceType ||
              !maintenanceDate
            }
          >
            {createMaintenance.isPending
              ? "Saving..."
              : "Save maintenance"}
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Vehicle */}
          <div>
            <label className="label-eyebrow">
              Vehicle
            </label>

            <Select
              value={vehicleId}
              onValueChange={setVehicleId}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>

              <SelectContent>
                {(vehicles.data ?? []).map((vehicle) => (
                  <SelectItem
                    key={vehicle.id}
                    value={String(vehicle.id)}
                  >
                    {vehicle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Maintenance type */}
          <div>
            <label
              htmlFor="maintenance-type"
              className="label-eyebrow"
            >
              Maintenance type
            </label>

            <Input
              id="maintenance-type"
              className="mt-2"
              placeholder="e.g. Oil change"
              value={maintenanceType}
              onChange={(e) =>
                setMaintenanceType(e.target.value)
              }
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="maintenance-description"
              className="label-eyebrow"
            >
              Description
            </label>

            <Input
              id="maintenance-description"
              className="mt-2"
              placeholder="Describe the service"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />
          </div>

          {/* Date */}
          <div>
            <label
              htmlFor="maintenance-date"
              className="label-eyebrow"
            >
              Maintenance date
            </label>

            <Input
              id="maintenance-date"
              className="mt-2"
              type="date"
              value={maintenanceDate}
              onChange={(e) =>
                setMaintenanceDate(e.target.value)
              }
            />
          </div>

          {/* Cost */}
          <div>
            <label
              htmlFor="maintenance-cost"
              className="label-eyebrow"
            >
              Cost
            </label>

            <Input
              id="maintenance-cost"
              className="mt-2"
              type="number"
              min="0"
              placeholder="0"
              value={cost}
              onChange={(e) =>
                setCost(e.target.value)
              }
            />
          </div>

          {/* Status */}
          <div>
            <label className="label-eyebrow">
              Status
            </label>

            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(
                  value as
                    | "scheduled"
                    | "in_progress"
                    | "completed"
                )
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="scheduled">
                  Scheduled
                </SelectItem>

                <SelectItem value="in_progress">
                  In Progress
                </SelectItem>

                <SelectItem value="completed">
                  Completed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}