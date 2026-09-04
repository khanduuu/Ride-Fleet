import { cn } from "@/lib/utils";
import type {
  AvailabilityStatus,
  BookingStatus,
  MaintenanceStatus,
  PaymentStatus,
  VehicleMaintenanceStatus,
} from "@/types";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  success: "bg-success-soft text-success border-success/25",
  warning: "bg-warning-soft text-warning border-warning/25",
  danger: "bg-danger-soft text-danger border-danger/25",
  accent: "bg-accent/10 text-accent border-accent/25",
};

export function StatusPill({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

/* Maintenance record status
   scheduled | in_progress | completed
*/
const maintenanceMap = {
  good: {
    label: "Good",
    className: "bg-green-100 text-green-700",
  },
  service_due_soon: {
    label: "Service due soon",
    className: "bg-yellow-100 text-yellow-700",
  },
  under_maintenance: {
    label: "Under maintenance",
    className: "bg-red-100 text-red-700",
  },
} as const;

export function MaintenancePill({
  status,
}: {
  status:  VehicleMaintenanceStatus;
}) {
  const maintenance = maintenanceMap[status];

  if (!maintenance) {
    return (
      <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700">
        Unknown
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${maintenance.className}`}
    >
      {maintenance.label}
    </span>
  );
}

/* Vehicle availability */

const availabilityMap: Record<
  AvailabilityStatus,
  { label: string; tone: Tone }
> = {
  available: {
    label: "Available",
    tone: "success",
  },
  booked: {
    label: "Booked",
    tone: "neutral",
  },
  maintenance: {
    label: "In workshop",
    tone: "danger",
  },
};

export function AvailabilityPill({
  status,
}: {
  status: AvailabilityStatus;
}) {
  const { label, tone } = availabilityMap[status];

  return <StatusPill label={label} tone={tone} />;
}

/* Booking status */

const bookingMap: Record<
  BookingStatus,
  { label: string; tone: Tone }
> = {
  active: {
    label: "Active",
    tone: "success",
  },
  upcoming: {
    label: "Upcoming",
    tone: "accent",
  },
  confirmed: {
  label: "Confirmed",
  tone: "success",
},
  completed: {
    label: "Completed",
    tone: "neutral",
  },
  cancelled: {
    label: "Cancelled",
    tone: "danger",
  },
  pending: {
    label: "Pending",
    tone: "warning",
  },
};

export function BookingStatusPill({
  status,
}: {
  status: BookingStatus;
}) {
  const { label, tone } = bookingMap[status];

  return <StatusPill label={label} tone={tone} />;
}

/* Payment status */

const paymentMap: Record<
  PaymentStatus,
  { label: string; tone: Tone }
> = {
  paid: {
    label: "Paid",
    tone: "success",
  },
  pending: {
    label: "Pending",
    tone: "warning",
  },
  refunded: {
    label: "Refunded",
    tone: "neutral",
  },
  failed: {
    label: "Failed",
    tone: "danger",
  },
};

export function PaymentStatusPill({
  status,
}: {
  status: PaymentStatus;
}) {
  const { label, tone } = paymentMap[status] ?? paymentMap.pending;

  return <StatusPill label={label} tone={tone} />;
}

/* Vehicle maintenance condition
   good | service_due_soon | under_maintenance
*/
const vehicleMaintenanceMap: Record<
  VehicleMaintenanceStatus,
  { label: string; tone: Tone }
> = {
  good: {
    label: "Good",
    tone: "success",
  },
  service_due_soon: {
    label: "Service Due Soon",
    tone: "warning",
  },
  under_maintenance: {
    label: "Under Maintenance",
    tone: "danger",
  },
};

export function VehicleMaintenancePill({
  status,
}: {
  status: VehicleMaintenanceStatus;
}) {
  const { label, tone } = vehicleMaintenanceMap[status];

  return <StatusPill label={label} tone={tone} />;
}