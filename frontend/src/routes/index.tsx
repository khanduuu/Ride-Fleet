import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BatteryCharging,
  Boxes,
  CarFront,
  Gauge,
  KeyRound,
  ShieldCheck,
  Truck,
  Users,
  Zap,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/common/SearchBar";
import { VehicleGrid } from "@/components/common/VehicleGrid";
import { Rating } from "@/components/common/Rating";
import {
  AvailabilityPill,
  VehicleMaintenancePill,
} from "@/components/common/StatusPill";

import { vehiclesService } from "@/services/vehicles.service";
import {
  platformService,
} from "@/services/dashboard.service";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Ridefleet — Rent Vehicles & Manage Your Fleet",
      },
      {
        name: "description",
        content:
          "Search vehicles by location and dates, book in under a minute, and run your rental fleet with live maintenance and revenue insight.",
      },
      {
        property: "og:title",
        content: "Ridefleet — Rent Vehicles & Manage Your Fleet",
      },
      {
        property: "og:description",
        content:
          "Search vehicles by location and dates, book in under a minute, and run your rental fleet with live maintenance and revenue insight.",
      },
    ],
  }),
  component: HomePage,
});

const categories = [
  {
    label: "Electric",
    icon: BatteryCharging,
    type: "Sedan",
    fuel: "Electric",
  },
  {
    label: "Utility",
    icon: Truck,
    type: "Van",
  },
  {
    label: "SUV",
    icon: CarFront,
    type: "SUV",
  },
  {
    label: "Hatchback",
    icon: Boxes,
    type: "Hatchback",
  },
];

const steps = [
  {
    title: "Search the fleet",
    body: "Choose your location, dates and preferred vehicle.",
  },
  {
    title: "Confirm your booking",
    body: "Review your quote and complete secure payment.",
  },
  {
    title: "Collect and drive",
    body: "Pick up your vehicle and enjoy your journey.",
  },
];

const benefits = [
  {
    icon: Zap,
    title: "Quick Booking",
    body: "Book your vehicle in minutes.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Vehicles",
    body: "Safe, reliable and well-maintained.",
  },
  {
    icon: Users,
    title: "For Everyone",
    body: "Customers, vendors and admins.",
  },
];

function HomePage() {
  const [activeFleetTab, setActiveFleetTab] = useState<
    "Dashboard" | "Fleet monitor" | "Maintenance"
  >("Dashboard");

  const maintenance = useQuery({
    queryKey: ["platform", "maintenance"],
    queryFn: () => platformService.maintenance(),
  });

  const fleet = useQuery({
    queryKey: ["platform", "vehicles"],
    queryFn: () =>
      vehiclesService.list({
        page: 1,
        pageSize: 10,
      }),
  });

  const popular = useQuery({
    queryKey: ["vehicles", "popular"],
    queryFn: () => vehiclesService.popular(3),
  });

  const recommended = useQuery({
    queryKey: ["vehicles", "recommended"],
    queryFn: () => vehiclesService.recommended(3),
  });

  const reviews = useQuery({
    queryKey: ["platform", "reviews"],
    queryFn: () => platformService.reviews(),
  });

  const platform = useQuery({
    queryKey: ["platform", "overview"],
    queryFn: () => platformService.overview(),
  });

  const featuredVehicle = popular.data?.[0];

  return (
    <>
      {/* =====================================================
    HERO
====================================================== */}

<section className="relative overflow-hidden bg-white px-6 pb-8 pt-8 lg:pt-12">
  {/* Background glow */}
  <div className="pointer-events-none absolute -right-40 top-0 h-[650px] w-[650px] rounded-full bg-blue-100/60 blur-3xl" />

  <div className="pointer-events-none absolute right-[20%] top-[15%] h-32 w-32 rounded-full bg-blue-100/50 blur-3xl" />

  <div className="relative mx-auto max-w-7xl">
    <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">

      {/* LEFT CONTENT */}
      <div className="relative z-20 max-w-xl">

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-blue-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-blue-600" />
          </span>

          Smart vehicle rentals
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
          Drive your
          <span className="block text-blue-600">
            journey.
          </span>
        </h1>

        {/* Description */}
        <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
          Rent reliable cars, SUVs and utility vehicles with
          transparent pricing, easy pickup and a seamless
          booking experience.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            to="/vehicles"
            className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700"
          >
            Explore vehicles
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <KeyRound className="size-4" />
            My bookings
          </Link>
        </div>

        {/* Trust points */}
        <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-blue-600" />
            Verified vehicles
          </div>

          <div className="flex items-center gap-2">
            <Zap className="size-4 text-blue-600" />
            Instant booking
          </div>

          <div className="flex items-center gap-2">
            <Gauge className="size-4 text-blue-600" />
            Transparent pricing
          </div>
        </div>
      </div>

      {/* RIGHT IMAGE */}
      <div className="relative flex min-h-[430px] items-center justify-center lg:min-h-[560px]">

        {/* Background */}
        <div className="absolute right-0 top-1/2 h-[390px] w-[390px] -translate-y-1/2 rounded-full bg-blue-50 blur-2xl lg:h-[520px] lg:w-[520px]" />

        {/* Decorative shapes */}
        <div className="absolute right-[8%] top-[8%] h-24 w-24 rotate-12 rounded-[2rem] bg-blue-600/10" />

        <div className="absolute bottom-[12%] left-[8%] size-16 rounded-full bg-sky-100" />

        {/* SUV */}
        <div className="relative z-10 w-full">
          <img
            src="/hero-suv.png"
            alt="RideFleet SUV"
            className="relative z-10 ml-auto w-[115%] max-w-[800px] object-contain mix-blend-multiply drop-shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
          />
        </div>

        {/* PRICE CARD */}
        {featuredVehicle && (
          <div className="absolute left-2 top-10 z-20 rounded-2xl border border-white/80 bg-white/95 px-5 py-4 shadow-xl shadow-slate-900/10 backdrop-blur-md sm:left-6 lg:left-0 lg:top-16">

            <div className="flex items-center gap-3">

              <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <CarFront className="size-5" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Starting from
                </p>

                <p className="text-xl font-bold text-slate-950">
                  {formatCurrency(
                    featuredVehicle.pricePerDay,
                    featuredVehicle.currency,
                  )}

                  <span className="ml-1 text-xs font-medium text-slate-400">
                    /day
                  </span>
                </p>
              </div>

            </div>
          </div>
        )}

             
{/* =====================================================
    BOTTOM FLOATING CARD
====================================================== */}

<div className="hero-floating absolute bottom-[20px] right-[1%] z-30 rounded-2xl border border-white/80 bg-white/95 px-5 py-4 shadow-xl shadow-slate-900/10 backdrop-blur-md">

  <div className="flex items-center gap-3">

    <div className="grid size-11 place-items-center rounded-xl bg-blue-50">
      <Gauge className="size-5 text-blue-600" />
    </div>

    <div>
      <p className="text-sm font-semibold text-slate-900">
        Drive a smarter
      </p>

      <p className="text-sm font-semibold text-blue-600">
        tomorrow
      </p>
    </div>

  </div>
</div>

</div>
</div>


{/* =====================================================
    SEARCH BAR
====================================================== */}

<div className="relative z-40 -mt-8 rounded-3xl border-2 border-blue-500 bg-white p-2 shadow-2xl shadow-blue-100/70 lg:-mt-8">
  <SearchBar />
</div>

</div>
</section>


{/* =====================================================
    CATEGORIES
====================================================== */}

<section className="border-y border-slate-200 bg-white py-8">
  <div className="mx-auto max-w-7xl px-6">

    <div className="flex items-center justify-between gap-8 overflow-x-auto">

      {categories.map((category) => {
        const Icon = category.icon;

        return (
          <Link
            key={category.label}
            to="/vehicles"
            search={{
              type: category.type,
              fuel: category.fuel,
            }}
            className="group flex shrink-0 items-center gap-3"
          >

            <div className="grid size-11 place-items-center rounded-full bg-blue-50 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-600">
              <Icon className="size-5 text-blue-600 transition-colors duration-300 group-hover:text-white" />
            </div>

            <span className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-blue-600">
              {category.label}
            </span>

          </Link>
        );
      })}

    </div>

  </div>
</section>
      {/* =====================================================
    POPULAR VEHICLES
====================================================== */}

<section className="relative overflow-hidden bg-slate-50 px-6 py-20">
  {/* Background decoration */}
  <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
  <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-sky-100/50 blur-3xl" />

  <div className="relative mx-auto max-w-7xl">

    {/* Section heading */}
    <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

      <div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">
            OUR FLEET
          </span>

          <span className="h-[2px] w-10 bg-blue-600" />
        </div>

        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Popular vehicles
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Choose from our most popular rental vehicles.
        </p>
      </div>

      {/* Browse button */}
      <Button
        asChild
        variant="outline"
        className="group w-fit border-blue-200 bg-white px-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg"
      >
        <Link to="/vehicles">
          Browse all vehicles

          <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </Button>

    </div>

    {/* Vehicle cards */}
    <div className="popular-vehicles-grid">

      <VehicleGrid
        vehicles={popular.data ?? []}
        isLoading={popular.isLoading}
        isError={popular.isError}
        onRetry={() => void popular.refetch()}
        skeletonCount={3}
      />

    </div>

  </div>

  {/* Section animation */}
  <style>{`

    @keyframes popularFadeUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .popular-vehicles-grid {
      animation: popularFadeUp 0.8s ease-out both;
    }

    @media (prefers-reduced-motion: reduce) {
      .popular-vehicles-grid {
        animation: none;
      }
    }

  `}</style>
</section>

      {/* =====================================================
    RECOMMENDED VEHICLES
====================================================== */}

<section className="relative overflow-hidden bg-white px-6 py-20">

  {/* Blue background decorations */}
  <div className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full bg-blue-50 blur-3xl" />

  <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-sky-50 blur-3xl" />

  <div className="relative mx-auto max-w-7xl">

    {/* Heading */}
    <div className="mb-10">

      <div className="flex items-center gap-3">

        <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">
          FOR YOU
        </span>

        <span className="h-[2px] w-10 bg-blue-600" />

      </div>

      <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            Recommended for you
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Vehicles selected from availability and popularity.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          className="group w-fit border-blue-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg"
        >
          <Link to="/vehicles">
            Explore fleet

            <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Button>

      </div>

    </div>

    {/* Recommended vehicles */}
    <div className="recommended-grid">

      <VehicleGrid
        vehicles={recommended.data ?? []}
        isLoading={recommended.isLoading}
        isError={recommended.isError}
        onRetry={() => void recommended.refetch()}
        skeletonCount={3}
      />

    </div>

  </div>

  <style>{`

    @keyframes recommendedFadeUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .recommended-grid {
      animation: recommendedFadeUp 0.8s ease-out both;
    }

    @media (prefers-reduced-motion: reduce) {
      .recommended-grid {
        animation: none;
      }
    }

  `}</style>

</section>

      {/* =====================================================
    HOW IT WORKS
====================================================== */}

<section className="relative overflow-hidden bg-slate-50 px-6 py-24">

  {/* Background decoration */}
  <div className="pointer-events-none absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/40 blur-3xl" />

  <div className="relative mx-auto max-w-7xl">

    {/* Heading */}
    <div className="text-center">

      <div className="flex items-center justify-center gap-3">

        <span className="h-[2px] w-10 bg-blue-600" />

        <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">
          SIMPLE PROCESS
        </span>

        <span className="h-[2px] w-10 bg-blue-600" />

      </div>

      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
        How it works
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
        Renting a vehicle with RideFleet is simple, fast and secure.
      </p>

    </div>

    {/* Steps */}
    <ol className="relative mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">

      {/* Connecting line */}
      <div className="pointer-events-none absolute left-[16%] right-[16%] top-16 hidden h-[2px] bg-blue-100 md:block" />

      {steps.map((step, index) => {

        const icons = [
          "🔎",
          "✓",
          "🚗",
        ];

        return (
          <li
            key={step.title}
            className="how-step group relative z-10 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-3 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/60"
            style={{
              animationDelay: `${index * 150}ms`,
            }}
          >

            {/* Top */}
            <div className="flex items-center justify-between">

              {/* Number */}
              <div className="grid size-14 place-items-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-200 transition-transform duration-300 group-hover:scale-110">
                {index + 1}
              </div>

              {/* Icon */}
              <div className="grid size-12 place-items-center rounded-full bg-blue-50 text-xl transition-all duration-300 group-hover:bg-blue-600 group-hover:scale-110">
                {icons[index]}
              </div>

            </div>

            {/* Content */}
            <div className="mt-8">

              <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {step.body}
              </p>

            </div>

            {/* Bottom arrow */}
            <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Step {index + 1}
              </span>

              {index < steps.length - 1 && (
                <ArrowRight className="size-5 text-blue-500 transition-transform duration-300 group-hover:translate-x-2" />
              )}

            </div>

          </li>
        );
      })}

    </ol>

  </div>

  {/* Animation */}
  <style>{`

    @keyframes howStepFade {
      from {
        opacity: 0;
        transform: translateY(30px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .how-step {
      opacity: 0;
      animation: howStepFade 0.7s ease-out forwards;
    }

    @media (prefers-reduced-motion: reduce) {
      .how-step {
        opacity: 1;
        animation: none;
      }
    }

  `}</style>

</section>

     {/* =====================================================
    BENEFITS
====================================================== */}

<section className="relative overflow-hidden bg-slate-50 px-6 py-20">

  {/* Background glow */}
  <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />

  <div className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-sky-100/50 blur-3xl" />

  <div className="relative mx-auto max-w-7xl">

    {/* Heading */}
    <div className="mb-12 text-center">

      <div className="flex items-center justify-center gap-3">

        <span className="h-[2px] w-10 bg-blue-600" />

        <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">
          WHY RIDE FLEET
        </span>

        <span className="h-[2px] w-10 bg-blue-600" />

      </div>

      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
        Built for a better rental experience
      </h2>

      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
        Everything you need for a simple, reliable and transparent
        vehicle rental experience.
      </p>

    </div>

    {/* Benefits */}
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

      {[
        {
          icon: ShieldCheck,
          title: "Verified operators",
          body: "Trusted vendors and reliable vehicles.",
        },
        {
          icon: Wrench,
          title: "Predictive maintenance",
          body: "Vehicles monitored for service needs.",
        },
        {
          icon: Gauge,
          title: "Transparent pricing",
          body: "Clear pricing with no surprises.",
        },
        {
          icon: KeyRound,
          title: "Easy pickup",
          body: "Simple pickup and booking experience.",
        },
      ].map((benefit, index) => {

        const Icon = benefit.icon;

        return (
          <div
            key={benefit.title}
            className="benefit-card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/60"
            style={{
              animationDelay: `${index * 120}ms`,
            }}
          >

            {/* Blue hover glow */}
            <div className="pointer-events-none absolute -right-10 -top-10 size-24 rounded-full bg-blue-50 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

            {/* Icon */}
            <div className="relative grid size-14 place-items-center rounded-2xl bg-blue-50 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-600">

              <Icon className="size-6 text-blue-600 transition-colors duration-300 group-hover:text-white" />

            </div>

            {/* Content */}
            <h3 className="relative mt-6 text-lg font-semibold text-slate-900 transition-colors duration-300 group-hover:text-blue-600">
              {benefit.title}
            </h3>

            <p className="relative mt-2 text-sm leading-6 text-slate-500">
              {benefit.body}
            </p>

            {/* Bottom accent */}
            <div className="relative mt-6 h-1 w-0 rounded-full bg-blue-600 transition-all duration-300 group-hover:w-12" />

          </div>
        );
      })}

    </div>

  </div>

  {/* Animation */}
  <style>{`

    @keyframes benefitFadeUp {
      from {
        opacity: 0;
        transform: translateY(25px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .benefit-card {
      opacity: 0;
      animation: benefitFadeUp 0.6s ease-out forwards;
    }

    @media (prefers-reduced-motion: reduce) {
      .benefit-card {
        opacity: 1;
        animation: none;
      }
    }

  `}</style>

</section>

      {/* =====================================================
    FLEET MANAGEMENT
====================================================== */}

<section className="relative overflow-hidden bg-slate-50 px-6 py-20">

  {/* Background glow */}
  <div className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />

  <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-sky-100/40 blur-3xl" />

  <div className="relative mx-auto max-w-7xl">

    {/* Heading */}
    <div className="mb-10">

      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">
          Fleet management
        </span>

        <span className="h-[2px] w-10 bg-blue-600" />
      </div>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            Manage your fleet smarter
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Real-time oversight for rental operators.
          </p>
        </div>

        <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600">
          Live fleet data
        </span>

      </div>
    </div>

    {/* Main panel */}
    <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-blue-100/40">

      <div className="flex flex-col lg:flex-row">

        {/* =================================================
            TABS
        ================================================== */}

        <div className="border-b border-slate-200 bg-slate-50/70 p-4 lg:w-56 lg:border-b-0 lg:border-r">

          <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Fleet overview
          </p>

          <div className="flex gap-2 overflow-x-auto lg:flex-col">

            {[
              "Dashboard",
              "Fleet monitor",
              "Maintenance",
            ].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() =>
                  setActiveFleetTab(
                    label as
                      | "Dashboard"
                      | "Fleet monitor"
                      | "Maintenance",
                  )
                }
                className={
                  activeFleetTab === label
                    ? "rounded-xl bg-blue-600 px-4 py-3 text-left text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all duration-300"
                    : "rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-500 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600"
                }
              >
                {label}
              </button>
            ))}

          </div>
        </div>

        {/* =================================================
            CONTENT
        ================================================== */}

        <div className="min-w-0 flex-1 p-6 lg:p-8">

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            {[
              {
                label: "Total vehicles",
                value: `${platform.data?.totalVehicles ?? 0}`,
              },
              {
                label: "Active rentals",
                value: `${platform.data?.activeBookings ?? 0}`,
              },
              {
                label: "Total revenue",
                value: formatCurrency(
                  platform.data?.revenue ?? 0,
                  platform.data?.currency ?? "INR",
                ),
              },
            ].map((kpi, index) => (
              <div
                key={kpi.label}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {kpi.label}
                </span>

                <p className="mt-3 font-display text-2xl font-semibold text-slate-950 transition-colors group-hover:text-blue-600">
                  {kpi.value}
                </p>
              </div>
            ))}

          </div>

          {/* =================================================
              FLEET MONITOR
          ================================================== */}

          {activeFleetTab === "Fleet monitor" && (
            <div className="mt-8 animate-[fadeIn_0.4s_ease-out] overflow-x-auto">

              <table className="w-full min-w-[520px] text-left">

                <thead>
                  <tr className="border-b border-slate-200">
                    {[
                      "Vehicle",
                      "Vehicle ID",
                      "Status",
                      "Maintenance",
                    ].map((h) => (
                      <th
                        key={h}
                        className="pb-4 text-xs font-bold uppercase tracking-wider text-slate-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {(fleet.data?.items ?? []).map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="border-b border-slate-100 transition-colors hover:bg-blue-50/40"
                    >
                      <td className="py-4 text-sm font-semibold text-slate-900">
                        {vehicle.name}
                      </td>

                      <td className="py-4 text-sm text-slate-500">
                        #{vehicle.id}
                      </td>

                      <td className="py-4">
                        <AvailabilityPill
                          status={vehicle.availability}
                        />
                      </td>

                      <td className="py-4">
                        <VehicleMaintenancePill
                          status={vehicle.maintenanceStatus}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

          {/* =================================================
              MAINTENANCE
          ================================================== */}

          {activeFleetTab === "Maintenance" && (
            <div className="mt-8 animate-[fadeIn_0.4s_ease-out] overflow-x-auto">

              <table className="w-full min-w-[650px] text-left">

                <thead>
                  <tr className="border-b border-slate-200">
                    {[
                      "Vehicle",
                      "Maintenance",
                      "Date",
                      "Cost",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="pb-4 text-xs font-bold uppercase tracking-wider text-slate-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {(maintenance.data ?? []).map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 transition-colors hover:bg-blue-50/40"
                    >
                      <td className="py-4 text-sm font-semibold text-slate-900">
                        {row.vehicleName}
                      </td>

                      <td className="py-4 text-sm text-slate-600">
                        {row.maintenanceType}
                      </td>

                      <td className="py-4 text-sm text-slate-500">
                        {row.maintenanceDate}
                      </td>

                      <td className="py-4 text-sm font-medium text-slate-700">
                        ₹{Number(row.cost).toLocaleString("en-IN")}
                      </td>

                      <td className="py-4 text-sm capitalize text-slate-600">
                        {row.status.replace("_", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

          {/* =================================================
              DASHBOARD
          ================================================== */}

          {activeFleetTab === "Dashboard" && (
            <div className="mt-8 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Fleet operating normally
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Monitor vehicles, rentals and maintenance from one place.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <span className="size-2.5 rounded-full bg-green-500" />
                  System active
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    </div>

  </div>

  <style>{`
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `}</style>

</section>

      {/* =====================================================
    REVIEWS
====================================================== */}

<section className="relative overflow-hidden bg-white px-6 py-20">

  {/* Background glow */}
  <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-blue-50 blur-3xl" />

  <div className="pointer-events-none absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-sky-50 blur-3xl" />

  <div className="relative mx-auto max-w-7xl">

    {/* Heading */}
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

      <div>

        <div className="flex items-center gap-3">

          <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">
            Customer stories
          </span>

          <span className="h-[2px] w-10 bg-blue-600" />

        </div>

        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          What our customers say
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Real experiences from people who rented with RideFleet.
        </p>

      </div>

      {/* Rating summary */}
      <div className="flex w-fit items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3">

        <div className="text-2xl font-bold text-blue-600">
          ★
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">
            Trusted by our customers
          </p>

          <p className="text-xs text-slate-500">
            Reliable vehicles & smooth bookings
          </p>
        </div>

      </div>

    </div>

    {/* Reviews */}
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

      {(reviews.data ?? []).map((review, index) => (
        <div
          key={review.id}
          className="review-card group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/50"
          style={{
            animationDelay: `${index * 120}ms`,
          }}
        >

          {/* Quote */}
          <div className="absolute right-6 top-4 select-none text-6xl font-serif leading-none text-blue-50 transition-colors duration-300 group-hover:text-blue-100">
            "
          </div>

          {/* Customer */}
          <div className="relative flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="grid size-11 place-items-center rounded-full bg-blue-50 font-semibold text-blue-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
                {review.author?.charAt(0)?.toUpperCase() ?? "C"}
              </div>

              <div>
                <span className="block font-semibold text-slate-900">
                  {review.author}
                </span>

                <span className="text-xs text-slate-400">
                  Verified customer
                </span>
              </div>

            </div>

            {/* Rating */}
            <div className="rounded-full bg-blue-50 px-3 py-1">
              <Rating value={review.rating} />
            </div>

          </div>

          {/* Comment */}
          <p className="relative mt-6 text-sm leading-7 text-slate-600">
            "{review.comment}"
          </p>

          {/* Vehicle */}
          {review.vehicleName && (
            <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5">

              <span className="size-2 rounded-full bg-blue-500" />

              <p className="text-xs font-semibold text-blue-600">
                {review.vehicleName}
              </p>

            </div>
          )}

        </div>
      ))}

    </div>

  </div>

  {/* Animation */}
  <style>{`

    @keyframes reviewFadeUp {
      from {
        opacity: 0;
        transform: translateY(25px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .review-card {
      opacity: 0;
      animation: reviewFadeUp 0.6s ease-out forwards;
    }

    @media (prefers-reduced-motion: reduce) {
      .review-card {
        opacity: 1;
        animation: none;
      }
    }

  `}</style>

</section>

{/* =====================================================
    CTA
====================================================== */}

<section className="px-6 pb-20">

  <div className="group relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-600 to-sky-500 px-8 py-16 text-white shadow-2xl shadow-blue-200/60 transition-all duration-500 hover:shadow-blue-300/70 lg:px-16">

    {/* Background circles */}
    <div className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-110" />

    <div className="pointer-events-none absolute -bottom-40 left-1/3 size-80 rounded-full bg-sky-300/20 blur-2xl transition-transform duration-700 group-hover:scale-110" />

    <div className="pointer-events-none absolute right-20 top-20 size-3 rounded-full bg-white/60 shadow-[0_0_30px_10px_rgba(255,255,255,0.25)]" />

    {/* Content */}
    <div className="relative max-w-2xl">

      <div className="flex items-center gap-3">

        <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-100">
          For vehicle owners
        </span>

        <span className="h-[2px] w-10 bg-white/70" />

      </div>

      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
        Grow your business
        <br />
        with RideFleet.
      </h2>

      <p className="mt-5 max-w-xl text-sm leading-7 text-blue-50 md:text-base">
        List your vehicles, manage bookings and grow your rental
        business with ease.
      </p>

      {/* Buttons */}
      <div className="mt-8 flex flex-wrap gap-3">

        <Button
          asChild
          size="lg"
          className="group/btn bg-white px-6 font-semibold text-blue-600 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-xl"
        >
          <Link to="/vendor">
            Manage your fleet

            <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Link>
        </Button>

        <Button
          asChild
          size="lg"
          variant="outline"
          className="border-white/40 bg-white/10 px-6 font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white/20 hover:text-white"
        >
          <Link to="/vehicles">
            Explore vehicles

            <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Button>

      </div>

    </div>

    {/* Decorative right-side graphic */}
    <div className="pointer-events-none absolute -right-4 bottom-0 hidden lg:block">

      <div className="relative size-72">

        <div className="absolute inset-8 rounded-full border border-white/20" />

        <div className="absolute inset-16 rounded-full border border-white/20" />

        <div className="absolute inset-24 rounded-full bg-white/10 backdrop-blur-sm" />

        <div className="absolute right-12 top-12 size-4 rounded-full bg-white/80 shadow-[0_0_25px_8px_rgba(255,255,255,0.25)]" />

        <div className="absolute bottom-16 left-12 size-3 rounded-full bg-white/60" />

      </div>

    </div>

  </div>

</section>

      {/* =====================================================
          ANIMATIONS
      ====================================================== */}

      <style>{`

        @keyframes heroTextIn {
          from {
            opacity: 0;
            transform: translateY(28px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroVisualIn {
          from {
            opacity: 0;
            transform: translateX(50px) scale(0.94);
          }

          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes floatingCard {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-8px);
          }
        }

        .hero-benefit {
          opacity: 0;
          animation: heroTextIn 0.7s ease-out forwards;
        }

        .hero-visual {
          animation: heroVisualIn 1s ease-out both;
        }

        .hero-floating {
          animation: floatingCard 4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-benefit,
          .hero-visual,
          .hero-floating {
            animation: none;
            opacity: 1;
          }
        }

      `}</style>
    </>
  );
}