import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { uploadVehicleImage } from "@/services/imagekit.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AvailabilityPill,
  VehicleMaintenancePill,
} from "@/components/common/StatusPill";
import { Modal, ConfirmDialog } from "@/components/common/Modal";
import { vendorService } from "@/services/dashboard.service";
import { vehiclesService } from "@/services/vehicles.service";
import { formatCurrency } from "@/lib/format";
import type { Vehicle, VehicleType } from "@/types";

export const Route = createFileRoute("/vendor/vehicles")({
  head: () => ({
    meta: [
      { title: "My Vehicles — Ridefleet Vendor" },
      {
        name: "description",
        content:
          "Add, edit and retire listings, and keep availability and maintenance state current for every vehicle.",
      },
      { property: "og:title", content: "My Vehicles — Ridefleet Vendor" },
      {
        property: "og:description",
        content: "Add, edit and retire listings and keep availability current.",
      },
    ],
  }),
  component: VendorVehiclesPage,
});

const vehicleTypes: VehicleType[] = ["Sedan", "SUV", "Hatchback", "Van", "Luxury", "Bike"];

function VendorVehiclesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [removing, setRemoving] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<{
  brand: string;
  model: string;
  vehicle_type: string;
  registration_number: string;
  price_per_day: number | "";
  fuel_type: string;
  transmission: string;
  seats: number;
  location: string;
}>({
  brand: "",
  model: "",
  vehicle_type: "Sedan",
  registration_number: "",
  price_per_day: "",
  fuel_type: "Petrol",
  transmission: "Manual",
  seats: 5,
  location: "",
});

  const vehicles = useQuery({
    queryKey: ["vendor", "vehicles"],
    queryFn: () => vendorService.vehicles(),
  });

  const columns: Column<Vehicle>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={row.imageUrl}
            alt=""
            loading="lazy"
            width={96}
            height={96}
            className="size-10 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0">
            <Link
              to="/vehicles/$vehicleId"
              params={{ vehicleId: row.id }}
              className="block truncate text-sm font-medium hover:underline"
            >
              {row.name}
            </Link>
            <span className="text-xs text-muted-foreground">{row.type}</span>
          </div>
        </div>
      ),
    },
    { key: "location", header: "Location", render: (row) => <span className="text-sm text-muted-foreground">{row.location}</span> },
    {
      key: "price",
      header: "Rate / day",
      render: (row) => (
        <span className="text-sm font-medium tabular-nums">
          {formatCurrency(row.pricePerDay, row.currency)}
        </span>
      ),
    },
    { key: "availability", header: "Availability", render: (row) => <AvailabilityPill status={row.availability} /> },
    {
  key: "maintenance",
  header: "Maintenance",
  render: (row) => (
    <VehicleMaintenancePill status={row.maintenanceStatus} />
  ),
},
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
  setEditing(row);

  const nameParts = row.name.split(" ");

  setVehicleName(row.name);

  setVehicleForm({
    brand: nameParts[0] ?? "",
    model: nameParts.slice(1).join(" "),
    vehicle_type: row.type,
    registration_number: "",
    price_per_day: row.pricePerDay,
    fuel_type: row.specs?.fuel ?? "Petrol",
    transmission: row.specs?.transmission ?? "Manual",
    seats: row.specs?.seats ?? 5,
    location: row.location,
  });

  setFormOpen(true);
}}
          >
            Edit
          </Button>
          <Button
  size="sm"
  variant="ghost"
  onClick={() => setRemoving(row)}
>
  Remove
</Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      workspace="Vendor"
      title="My vehicles"
      subtitle="Listings, rates and availability."
      items={vendorNav}
      actions={
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Add vehicle
        </Button>
      }
    >
      <DataTable
        columns={columns}
        rows={vehicles.data ?? []}
        isLoading={vehicles.isLoading}
        getRowKey={(row) => row.id}
        caption="Vendor vehicle listings"
        emptyTitle="No vehicles listed"
        emptyDescription="Add your first vehicle to start taking bookings."
      />

      <Modal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? `Edit ${editing.name}` : "Add a vehicle"}
        description="Details are validated server side before the listing goes live."
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
  try {
  const fullName =
    vehicleName.trim() ||
    `${vehicleForm.brand} ${vehicleForm.model}`.trim();

  if (!fullName) {
    toast.error("Please enter a vehicle name");
    return;
  }

  if (!vehicleForm.price_per_day || !vehicleForm.location) {
    toast.error("Please fill all required fields");
    return;
  }

  const parts = fullName.split(/\s+/);


    const data = {
      ...vehicleForm,
      brand: parts[0] ?? "",
      model: parts.slice(1).join(" ") || "Vehicle",
      price_per_day: Number(vehicleForm.price_per_day),
    };

    if (editing) {
      await vehiclesService.update(editing.id, data);
      toast.success("Vehicle updated successfully");
    } else {
  let imageUrl = "";

  if (vehicleImage) {
    toast.loading("Uploading vehicle image...", {
      id: "vehicle-image-upload",
    });

    const uploadResult = await uploadVehicleImage(vehicleImage);

    imageUrl = uploadResult.url ?? "";

    toast.success("Image uploaded", {
      id: "vehicle-image-upload",
    });
  }

  await vehiclesService.create({
    ...data,
    registration_number: `RF-${Date.now()}`,
    image_url: imageUrl,
  });

  toast.success("Listing created successfully");
}

    setFormOpen(false);
    setEditing(null);
    await vehicles.refetch();

  } catch (error) {
    console.error(error);
    toast.error(editing ? "Failed to update vehicle" : "Failed to create listing");
  }
}}
            >
              {editing ? "Save changes" : "Create listing"}
            </Button>
          </>
        }
      >
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="v-name" className="label-eyebrow">
              Vehicle name
            </label>
<Input
  id="v-name"
  value={vehicleName}
  onChange={(e) => setVehicleName(e.target.value)}
  placeholder="Maruti Swift"
/>          
</div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="v-type" className="label-eyebrow">
              Type
            </label>
            <Select
  value={vehicleForm.vehicle_type}
  onValueChange={(value) =>
    setVehicleForm({
      ...vehicleForm,
      vehicle_type: value,
    })
  }
>
              <SelectTrigger id="v-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="v-price" className="label-eyebrow">
              Rate per day
            </label>
            <Input
  id="v-price"
  type="number"
  value={vehicleForm.price_per_day}
  onChange={(e) =>
   setVehicleForm({
      ...vehicleForm,
      price_per_day: e.target.value === "" ? "" : Number(e.target.value),
    })
  }
/>
          </div>
          <div className="flex flex-col gap-1.5">
  <label className="label-eyebrow">
    Fuel Type
  </label>

  <Select
    value={vehicleForm.fuel_type}
    onValueChange={(value) =>
      setVehicleForm({
        ...vehicleForm,
        fuel_type: value,
      })
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Select fuel type" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="Petrol">Petrol</SelectItem>
      <SelectItem value="Diesel">Diesel</SelectItem>
      <SelectItem value="Electric">Electric</SelectItem>
      <SelectItem value="Hybrid">Hybrid</SelectItem>
    </SelectContent>
  </Select>
</div>

<div className="flex flex-col gap-1.5">
  <label className="label-eyebrow">
    Transmission
  </label>

  <Select
    value={vehicleForm.transmission}
    onValueChange={(value) =>
      setVehicleForm({
        ...vehicleForm,
        transmission: value,
      })
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Select transmission" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="Manual">Manual</SelectItem>
      <SelectItem value="Automatic">Automatic</SelectItem>
    </SelectContent>
  </Select>
</div>

<div className="flex flex-col gap-1.5">
  <label htmlFor="v-seats" className="label-eyebrow">
    Seats
  </label>

  <Input
    id="v-seats"
    type="number"
    min={1}
    value={vehicleForm.seats}
    onChange={(e) =>
      setVehicleForm({
        ...vehicleForm,
        seats: Number(e.target.value),
      })
    }
  />
</div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="v-location" className="label-eyebrow">
              Pickup location
            </label>
            <Input
  id="v-location"
  value={vehicleForm.location}
  onChange={(e) =>
    setVehicleForm({
      ...vehicleForm,
      location: e.target.value,
    })
  }
  placeholder="Raipur, India"
/>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
  <label htmlFor="v-image" className="label-eyebrow">
    Vehicle image
  </label>

  <Input
    id="v-image"
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0] ?? null;

      setVehicleImage(file);

      if (file) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        setImagePreview("");
      }
    }}
  />

  {imagePreview && (
    <img
      src={imagePreview}
      alt="Vehicle preview"
      className="mt-2 h-40 w-full rounded-md object-cover"
    />
  )}
</div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="v-desc" className="label-eyebrow">
              Description
            </label>
            <Textarea id="v-desc" rows={4} defaultValue={editing?.description ?? ""} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove this listing?"
        description={
          removing ? `${removing.name} will stop accepting new bookings immediately.` : ""
        }
        confirmLabel="Remove listing"
        destructive
        onConfirm={async () => {
  if (!removing) return;

  try {
    await vehiclesService.remove(removing.id);

    toast.success("Listing removed", {
      description: removing.name,
    });

    setRemoving(null);
    await vehicles.refetch();
  } catch (error) {
    console.error(error);
    toast.error("Failed to remove listing");
  }
}}
      />
    </DashboardShell>
  );
}
