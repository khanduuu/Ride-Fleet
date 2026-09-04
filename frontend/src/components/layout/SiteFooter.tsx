import { Link } from "@tanstack/react-router";
import {
  CarFront,
  ShieldCheck,
  Wrench,
  ArrowUpRight,
} from "lucide-react";

const columns = [
  {
    title: "Platform",
    links: [
      { label: "Browse vehicles", to: "/vehicles" },
      { label: "Customer dashboard", to: "/dashboard" },
      { label: "Vendor dashboard", to: "/vendor" },
    ],
  },
  {
    title: "Operators",
    links: [
      { label: "Admin console", to: "/admin" },
      { label: "Maintenance", to: "/vendor/maintenance" },
      { label: "Earnings", to: "/vendor/earnings" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-blue-100 bg-slate-950 text-white">

      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-40 -top-40 size-96 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-16">

        {/* =================================================
            MAIN FOOTER
        ================================================== */}

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">

          {/* Brand */}
          <div className="flex flex-col gap-6">

            <Link
              to="/"
              className="group flex w-fit items-center gap-3"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-transform duration-300 group-hover:scale-105">
                <CarFront className="size-5" />
              </div>

              <div>
                <span className="block text-xl font-extrabold tracking-tight">
                  RIDE<span className="text-blue-500"> FLEET</span>
                </span>

                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Smart Vehicle Rental
                </span>
              </div>
            </Link>

            <p className="max-w-[38ch] text-sm leading-7 text-slate-400">
              Smart vehicle rentals for every journey. Browse reliable
              vehicles, book with confidence and manage your rental
              experience with ease.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">

              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
                <ShieldCheck className="size-4 text-blue-500" />

                <span className="text-xs font-medium text-slate-300">
                  Verified vehicles
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
                <Wrench className="size-4 text-blue-500" />

                <span className="text-xs font-medium text-slate-300">
                  Fleet maintained
                </span>
              </div>

            </div>
          </div>


          {/* Links */}
          {columns.map((column) => (
            <div
              key={column.title}
              className="space-y-5"
            >
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                {column.title}
              </h2>

              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="group flex w-fit items-center gap-1.5 text-sm text-slate-400 transition-colors duration-200 hover:text-blue-400"
                    >
                      {link.label}

                      <ArrowUpRight className="size-3 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>


        {/* =================================================
            BOTTOM
        ================================================== */}

        <div className="mt-16 flex flex-col items-center justify-between gap-5 border-t border-slate-800 pt-8 md:flex-row">

          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            © 2026 RideFleet Mobility Systems
          </span>

          <div className="flex gap-6 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            <button
              type="button"
              className="transition-colors hover:text-blue-400"
            >
              Privacy
            </button>

            <button
              type="button"
              className="transition-colors hover:text-blue-400"
            >
              Terms
            </button>
          </div>

        </div>

      </div>
    </footer>
  );
}