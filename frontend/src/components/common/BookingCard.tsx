import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";
import { BookingStatusPill, PaymentStatusPill } from "./StatusPill";
import { formatCurrency, formatDateRange } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/types";

export function BookingCard({
  booking,
  onCancel,
  onReview,
}: {
  booking: Booking;
  onCancel?: (booking: Booking) => void;
  onReview?: (booking: Booking) => void;
}) {

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row">
      
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-medium">{booking.vehicleName}</h3>
            <p className="text-xs text-muted-foreground">
              Ref {booking.reference} • {booking.pickupLocation}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <BookingStatusPill status={booking.status} />
            <PaymentStatusPill status={booking.paymentStatus} />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" />
            {formatDateRange(booking.startDate, booking.endDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            {booking.pickupLocation}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <span className="font-display text-lg font-medium tabular-nums">
            {formatCurrency(booking.total, booking.currency)}
          </span>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/vehicles/$vehicleId" params={{ vehicleId: booking.vehicleId }}>
                View vehicle
              </Link>
            </Button>
             {onCancel &&
  (booking.status === "upcoming" || booking.status === "confirmed") && (
              <Button variant="ghost" size="sm" onClick={() => onCancel(booking)}>
                Cancel
              </Button>
            )}
            {onReview && booking.status === "completed" && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onReview(booking)}
  >
    Write review
  </Button>
)}
          </div>
        </div>
      </div>
    </article>
  );
}
