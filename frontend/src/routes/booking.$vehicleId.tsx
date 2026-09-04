import {  useEffect, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format } from "date-fns";
import { CheckCircle2, MapPin } from "lucide-react";
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
import { DatePicker } from "@/components/common/DatePicker";
import { PriceBreakdown } from "@/components/common/PriceBreakdown";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { vehiclesService } from "@/services/vehicles.service";
import { bookingsService } from "@/services/bookings.service";
import { paymentsService } from "@/services/payments.service";
import { formatCurrency } from "@/lib/format";
import type { Booking, Vehicle } from "@/types";

interface BookingSearch {
  startDate?: string | undefined;
  endDate?: string | undefined;
}

const pickupPoints = [
  "Raipur Railway Station",
  "Swami Vivekananda Airport",
  "Telibandha",
  "Pandri",
  "Shankar Nagar",
  "GE Road",
  "Tatibandh",
  "Mowa",
  "Devendra Nagar",
  "Civil Lines",
  "VIP Road",
  "Naya Raipur",
  "Magneto Mall",
  "Ambuja Mall",
  "Bhatagaon",
  "Katora Talab",
  "Samta Colony",
  "Gudhiyari",
  "Daldal Seoni",
  "Avanti Vihar",
];

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}
export const Route = createFileRoute("/booking/$vehicleId")({
  validateSearch: (search: Record<string, unknown>): BookingSearch => ({
    startDate: typeof search["startDate"] === "string" ? search["startDate"] : undefined,
    endDate: typeof search["endDate"] === "string" ? search["endDate"] : undefined,
  }),
  loader: async ({ params }): Promise<{ vehicle: Vehicle }> => {
    const vehicle = await vehiclesService.getById(params.vehicleId);
    if (!vehicle) throw notFound();
    return { vehicle };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.vehicle.name ?? "vehicle";
    return {
      meta: [
        { title: `Book ${name} — Ridefleet` },
        {
          name: "description",
          content: `Confirm pickup location, dates and the itemised price for your ${name} rental.`,
        },
        { property: "og:title", content: `Book ${name} — Ridefleet` },
        {
          property: "og:description",
          content: `Confirm pickup location, dates and the itemised price for your ${name} rental.`,
        },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: BookingPage,
});

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function BookingPage() {
  const { vehicle } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [pickup, setPickup] = useState(pickupPoints[0]!);
  const [start, setStart] = useState<Date | undefined>(parseDate(search.startDate));
  const [end, setEnd] = useState<Date | undefined>(parseDate(search.endDate));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receipt, setReceipt] = useState<Booking | null>(null);

  const quote = useQuery({
  queryKey: [
    "pricing",
    vehicle.id,
    start?.toISOString(),
    end?.toISOString(),
    "booking",
  ],

  queryFn: () =>
    vehiclesService.quote({
      vehicleId: vehicle.id,
      startDate: format(start!, "yyyy-MM-dd"),
      endDate: format(end!, "yyyy-MM-dd"),
    }),

  enabled: !!start && !!end,
});

  const createBooking = useMutation({
  mutationFn: async () => {
    // 1. Create booking
    const booking = await bookingsService.create({
      vehicleId: vehicle.id,
      pickupLocation: pickup,
      startDate: start
        ? `${format(start, "yyyy-MM-dd")}T${startTime}:00Z`
        : "",
      endDate: end
        ? `${format(end, "yyyy-MM-dd")}T${endTime}:00Z`
        : "",
    });

    // 2. Create Razorpay order
    const order = await paymentsService.createOrder(booking.id);

    return { booking, order };
  },

  onSuccess: ({ booking, order }) => {
    const options: RazorpayOptions = {
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: "RideFleet",
      description: `Vehicle rental - ${vehicle.name}`,
      order_id: order.order_id,

      handler: async (response) => {
        try {
          // 3. Verify payment on backend
          await paymentsService.verify({
            booking_id: Number(booking.id),
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          // 4. Payment successful
          setReceipt({
            ...booking,
            status: "confirmed",
            paymentStatus: "paid",
          });

          toast.success("Payment successful", {
            description: `Booking ${booking.reference} confirmed`,
          });
        } catch (error: any) {
          const message =
            error?.details?.detail ||
            "Payment verification failed. Please contact support.";

          toast.error(message);
        }
      },

      theme: {
        color: "#2563eb",
      },
    };

    if (!window.Razorpay) {
      toast.error("Razorpay Checkout could not be loaded.");
      return;
    }

    const razorpay = new window.Razorpay(options);
    razorpay.open();

    setConfirmOpen(false);
  },

  onError: (error: any) => {
    const message =
      error?.details?.detail ||
      "We couldn't create your booking. Please try again.";

    toast.error(message);
  },
});

  const rentalDays =
  start && end
    ? differenceInCalendarDays(end, start)
    : 0;

  const datesValid = rentalDays > 0;
  useEffect(() => {
  if (typeof window === "undefined") return;

  if (window.Razorpay) return;

  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;

  document.body.appendChild(script);

  return () => {
    script.remove();
  };
}, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-display text-3xl font-medium tracking-tight">
        Complete your booking
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Review the vehicle, confirm your pickup window and check the itemised quote.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row">
            <img
              src={vehicle.imageUrl}
              alt={vehicle.name}
              loading="lazy"
              width={1024}
              height={1024}
              className="h-36 w-full shrink-0 rounded-md object-cover sm:size-36"
            />
            <div className="min-w-0">
              <h2 className="font-display text-lg font-medium">{vehicle.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {vehicle.type} • {vehicle.specs.fuel} • {vehicle.specs.transmission} •{" "}
                {vehicle.specs.seats} seats
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" /> {vehicle.location}
              </p>
              <p className="mt-3 font-display text-lg font-medium tabular-nums">
                {formatCurrency(vehicle.pricePerDay, vehicle.currency)}
                <span className="text-sm font-normal text-muted-foreground">/day</span>
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-lg font-medium">Pickup & return</h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="pickup" className="label-eyebrow">
                  Pickup location
                </label>
                <Select value={pickup} onValueChange={setPickup}>
                  <SelectTrigger id="pickup">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pickupPoints.map((point) => (
                      <SelectItem key={point} value={point}>
                        {point}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DatePicker label="Start date" value={start} onChange={setStart} id="book-start" />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="start-time" className="label-eyebrow">
                  Start time
                </label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <DatePicker label="End date" value={end} onChange={setEnd} id="book-end" />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="end-time" className="label-eyebrow">
                  End time
                </label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            {!datesValid && (
              <p role="status" className="mt-4 text-xs text-warning">
                Select both a start and end date to continue.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <PriceBreakdown
  pricing={quote.data as any}
  isLoading={quote.isLoading}
  nights={rentalDays}
/>
          <Button
            size="lg"
            className="w-full"
            disabled={!datesValid || createBooking.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            {createBooking.isPending ? "Confirming…" : "Confirm booking"}
          </Button>
          <p className="text-xs text-muted-foreground">
  You will be redirected to Razorpay to complete your payment. You can
  cancel your booking before the rental is completed.
</p>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm this booking?"
        description={`${vehicle.name} from ${pickup}. You will be redirected to Razorpay to complete your payment.`}
        confirmLabel="Yes, book it"
        onConfirm={() => createBooking.mutate()}
      />

      <Modal
        open={Boolean(receipt)}
        onOpenChange={(open) => {
          if (!open) {
            setReceipt(null);
            void navigate({ to: "/dashboard/bookings" });
          }
        }}
        title="Booking confirmed"
        description={receipt ? `Reference ${receipt.reference}` : ""}
        footer={
          <Button asChild>
            <Link to="/dashboard/bookings">View my bookings</Link>
          </Button>
        }
      >
        <div className="flex items-start gap-3 rounded-lg border border-success/25 bg-success-soft p-4">
          <CheckCircle2 className="size-5 shrink-0 text-success" />
          
        </div>
      </Modal>
    </div>
  );
}
