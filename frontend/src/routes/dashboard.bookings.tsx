import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { customerNav } from "@/components/layout/nav-items";
import { BookingCard } from "@/components/common/BookingCard";
import { EmptyState, ErrorState } from "@/components/common/EmptyState";
import { CardGridSkeleton } from "@/components/common/Skeletons";
import { ConfirmDialog , Modal } from "@/components/common/Modal";
import { bookingsService } from "@/services/bookings.service";
import type { Booking, BookingStatus } from "@/types";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/dashboard/bookings")({
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
      { title: "My Bookings — Ridefleet" },
      {
        name: "description",
        content:
          "Review upcoming, active, completed and cancelled rentals, and cancel a reservation in one tap.",
      },
      { property: "og:title", content: "My Bookings — Ridefleet" },
      {
        property: "og:description",
        content: "Review upcoming, active, completed and cancelled rentals.",
      },
    ],
  }),
  component: BookingsPage,
});

const tabs: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function getBookingTabStatus(booking: Booking): BookingStatus {
  const today = new Date().toISOString().split("T")[0] ?? "";

  if (booking.status === "cancelled") {
    return "cancelled";
  }

  if (booking.status === "completed") {
    return "completed";
  }

  if (booking.status === "confirmed") {
    if (booking.startDate > today) {
      return "upcoming";
    }

    if (booking.startDate <= today && booking.endDate > today) {
      return "active";
    }

    return "completed";
  }

  return "upcoming";
}

function BookingsPage() {
  const [pending, setPending] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const bookings = useQuery({
    queryKey: ["bookings", "list"],
    queryFn: () => bookingsService.list(),
  });

  const rows = bookings.data ?? [];

  return (
    <DashboardShell
      workspace="Customer"
      title="My bookings"
      subtitle="Every reservation across the Ridefleet fleet."
      items={customerNav}
      actions={
        <Button asChild variant="outline">
          <Link to="/vehicles">Book another</Link>
        </Button>
      }
    >
      {bookings.isError ? (
        <ErrorState onRetry={() => void bookings.refetch()} />
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => {
            const filtered =
  tab.value === "all"
    ? rows
    : rows.filter((b) => getBookingTabStatus(b) === tab.value);
            return (
              <TabsContent key={tab.value} value={tab.value} className="mt-6">
                {bookings.isLoading ? (
                  <CardGridSkeleton count={3} />
                ) : filtered.length ? (
                  <div className="space-y-4">
                    {filtered.map((booking) => (
                      <BookingCard
  key={booking.id}
  booking={booking}
  {...(getBookingTabStatus(booking) === "upcoming"
  ? { onCancel: (b: Booking) => setPending(b) }
  : {})}
  {...(booking.status === "completed"
    ? { onReview: (b: Booking) => setReviewBooking(b) }
    : {})}
/>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No bookings here"
                    description="Reservations with this status will appear in this tab."
                  />
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(open) => !open && setPending(null)}
        title="Cancel this booking?"
        description={
          pending
            ? `${pending.vehicleName} (${pending.reference}) will be released back to the fleet.`
            : ""
        }
        confirmLabel="Cancel booking"
        destructive
        onConfirm={async () => {
  if (!pending) return;

  try {
    await bookingsService.cancel(pending.id);

    toast.success("Booking cancelled", {
      description: pending.reference,
    });

    setPending(null);
    await bookings.refetch();
  } catch (error: any) {
  console.error("Cancel booking error:", error);

  toast.error(
    error?.details?.detail ||
    "Failed to cancel booking"
  );
}
}}

      />      <Modal
        open={Boolean(reviewBooking)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewBooking(null);
            setRating(5);
            setComment("");
          }
        }}
        title="Write a review"
        description={
          reviewBooking
            ? `Share your experience with ${reviewBooking.vehicleName}.`
            : ""
        }
        footer={
          <Button
            onClick={async () => {
              if (!reviewBooking) return;

              if (!comment.trim()) {
                toast.error("Please write a comment");
                return;
              }

              try {
                await bookingsService.createReview({
                  bookingId: reviewBooking.id,
                  rating,
                  comment: comment.trim(),
                });

                toast.success("Review submitted successfully");

                setReviewBooking(null);
                setRating(5);
                setComment("");
              } catch (error: any) {
  console.error("Review error:", error);

  toast.error(
    error?.details?.detail ||
    "Failed to submit review"
  );
}
            }}
          >
            Submit review
          </Button>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="label-eyebrow">
              Rating
            </label>

            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={rating === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRating(value)}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="review-comment"
              className="label-eyebrow"
            >
              Comment
            </label>

            <Textarea
              id="review-comment"
              className="mt-2"
              placeholder="How was your experience?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
