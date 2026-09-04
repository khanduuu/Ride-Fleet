import { createFileRoute , redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { customerNav } from "@/components/layout/nav-items";
import { Rating } from "@/components/common/Rating";
import { EmptyState } from "@/components/common/EmptyState";
import { CardGridSkeleton } from "@/components/common/Skeletons";
import { bookingsService } from "@/services/bookings.service";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/dashboard/reviews")({
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
      { title: "My Reviews — Ridefleet" },
      {
        name: "description",
        content: "Reviews you've left for vehicles and vendors after completed trips.",
      },
      { property: "og:title", content: "My Reviews — Ridefleet" },
      {
        property: "og:description",
        content: "Reviews you've left for vehicles and vendors after completed trips.",
      },
    ],
  }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const reviews = useQuery({
    queryKey: ["customer", "reviews"],
    queryFn: () => bookingsService.myReviews(),
  });

  return (
    <DashboardShell
      workspace="Customer"
      title="My reviews"
      subtitle="Feedback you've shared after completed trips."
      items={customerNav}
    >
      {reviews.isLoading ? (
        <CardGridSkeleton count={2} />
      ) : reviews.data?.length ? (
        <ul className="space-y-4">
          {reviews.data.map((review) => (
            <li key={review.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{review.vehicleName ?? "Vehicle"}</span>
                <span className="text-xs text-muted-foreground">{formatDate(review.date)}</span>
              </div>
              <Rating value={review.rating} className="mt-2" />
              <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No reviews yet" description="Complete a trip to leave feedback." />
      )}
    </DashboardShell>
  );
}
