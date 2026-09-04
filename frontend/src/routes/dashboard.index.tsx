import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CreditCard, Heart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardShell, SectionHeading } from "@/components/layout/DashboardShell";
import { customerNav } from "@/components/layout/nav-items";
import { DashboardCard } from "@/components/common/DashboardCard";
import { BookingCard } from "@/components/common/BookingCard";
import { EmptyState } from "@/components/common/EmptyState";
import { CardGridSkeleton } from "@/components/common/Skeletons";
import { bookingsService } from "@/services/bookings.service";
import { formatCurrency, formatDateRange } from "@/lib/format";

export const Route = createFileRoute("/dashboard/")({
    beforeLoad: () => {
  if (typeof window === "undefined") {
    return;
  }

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

  // customer can continue to /dashboard
},
  head: () => ({
    meta: [
      { title: "Customer Dashboard — Ridefleet" },
      {
        name: "description",
        content:
          "Track your active rental, upcoming trips, spend and saved vehicles in one place.",
      },
      { property: "og:title", content: "Customer Dashboard — Ridefleet" },
      {
        property: "og:description",
        content: "Track your active rental, upcoming trips, spend and saved vehicles.",
      },
    ],
  }),
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const overview = useQuery({
    queryKey: ["customer", "overview"],
    queryFn: () => bookingsService.customerOverview(),
  });
  const data = overview.data;

  return (
    <DashboardShell
      workspace="Customer"
      title={data ? `Welcome back, ${data.userName}` : "Welcome back"}
      subtitle="Here's what's happening with your rentals."
      items={customerNav}
      actions={
        <Button asChild>
          <Link to="/vehicles">Book a vehicle</Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          label="Active rental"
          value={data?.activeRental ? "1 vehicle" : "None"}
          hint={data?.activeRental?.vehicleName ?? "No vehicle out right now"}
          icon={MapPin}
        />
        <DashboardCard
          label="Upcoming trips"
          value={`${data?.upcoming.length ?? 0}`}
          hint="Confirmed reservations"
          icon={CalendarDays}
        />
        <DashboardCard
          label="Total spend"
          value={data ? formatCurrency(data.totalSpend, data.currency) : "—"}
          hint="Lifetime on Ridefleet"
          icon={CreditCard}
        />
        <DashboardCard
          label="Saved vehicles"
          value={`${data?.favouritesCount ?? 0}`}
          hint="In your favourites"
          icon={Heart}
        />
      </div>

      <section>
        <SectionHeading
          title="Active rental"
          description="Live trip details and return window."
        />
        {overview.isLoading && <CardGridSkeleton count={1} />}
        {!overview.isLoading && !data?.activeRental && (
          <EmptyState
            title="No active rental"
            description="Book a vehicle and it will appear here with live trip details."
          />
        )}
        {data?.activeRental && (
          <div className="rounded-lg border border-border bg-card p-5">
            <BookingCard booking={data.activeRental} />
            <p className="mt-4 text-xs text-muted-foreground">
              Return window: {formatDateRange(data.activeRental.startDate, data.activeRental.endDate)}
            </p>
          </div>
        )}
      </section>

      <section>
        <SectionHeading
          title="Upcoming bookings"
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/bookings">View all</Link>
            </Button>
          }
        />
        {overview.isLoading ? (
          <CardGridSkeleton count={2} />
        ) : data?.upcoming.length ? (
          <div className="space-y-4">
            {data.upcoming.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing scheduled" description="Your next trip will show here." />
        )}
      </section>

      <section>
        <SectionHeading title="Previous rentals" />
        {overview.isLoading ? (
          <CardGridSkeleton count={2} />
        ) : (
          <div className="space-y-4">
            {(data?.previous ?? []).map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
