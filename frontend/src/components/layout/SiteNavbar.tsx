import { useEffect, useState } from "react";
import type { UserRole } from "@/types";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { label: "Home", to: "/" },
  { label: "Vehicles", to: "/vehicles" },
  { label: "Bookings", to: "/dashboard/bookings" },
  { label: "Favorites", to: "/dashboard/favorites" },
  { label: "Dashboard", to: "/dashboard" },
] as const;

function getUserRole(): UserRole {
  if (typeof window === "undefined") {
    return "customer";
  }

  const token = localStorage.getItem("access_token");

  if (!token) {
    return "customer";
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]!));

    if (
      payload.role === "customer" ||
      payload.role === "vendor" ||
      payload.role === "admin"
    ) {
      return payload.role;
    }
  } catch {
    // Ignore invalid token
  }

  return "customer";
}

export function SiteNavbar() {
  const [open, setOpen] = useState(false);

  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const [userRole, setUserRole] = useState<UserRole>(getUserRole());

  useEffect(() => {
    const updateRole = () => {
      setUserRole(getUserRole());
    };

    updateRole();

    window.addEventListener("storage", updateRole);

    return () => {
      window.removeEventListener("storage", updateRole);
    };
  }, []);

  const navLinks = links
    .filter((link) => {
      // Customers can see all customer navigation
      if (userRole === "customer") {
        return true;
      }

      // Vendors and admins only see Home, Vehicles and Dashboard
      return (
        link.label === "Home" ||
        link.label === "Vehicles" ||
        link.label === "Dashboard"
      );
    })
    .map((link) =>
      link.label === "Dashboard"
        ? {
            ...link,
            to:
              userRole === "vendor"
                ? "/vendor"
                : userRole === "admin"
                  ? "/admin"
                  : "/dashboard",
          }
        : link,
    );

  return (
    <header className="sticky top-0 z-50 border-b border-blue-100 bg-white/95 shadow-sm backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4"
      >
        {/* =================================================
            LOGO + DESKTOP NAV
        ================================================== */}

        <div className="flex min-w-0 items-center gap-8">

          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center gap-2"
          >
            <div className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-700">
              <CarFront className="size-5" />
            </div>

            <div>
              <span className="block text-xl font-extrabold tracking-tight text-slate-950">
                RIDE<span className="text-blue-600"> FLEET</span>
              </span>

              <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:block">
                Smart Vehicle Rental
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200",
                    "hover:bg-blue-50 hover:text-blue-600",
                    pathname === link.to &&
                      "bg-blue-50 font-semibold text-blue-600",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================== */}

        <div className="flex shrink-0 items-center gap-2">

          {/* Logout */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.removeItem("access_token");
              window.location.href = "/auth";
            }}
            className="hidden border-blue-200 text-blue-600 transition-all hover:bg-blue-50 hover:text-blue-700 sm:inline-flex"
          >
            Logout
          </Button>

          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 hover:bg-blue-50 hover:text-blue-600 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* =================================================
          MOBILE MENU
      ================================================== */}

      {open && (
        <div className="border-t border-blue-100 bg-white shadow-lg md:hidden">
          <ul className="mx-auto max-w-7xl space-y-1 px-6 py-4">

            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    pathname === link.to
                      ? "bg-blue-50 font-semibold text-blue-600"
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-600",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            {/* Mobile Logout */}
            <li className="pt-2">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("access_token");
                  window.location.href = "/auth";
                }}
                className="w-full rounded-xl border border-blue-200 px-4 py-3 text-left text-sm font-semibold text-blue-600 transition-all hover:bg-blue-50"
              >
                Logout
              </button>
            </li>

          </ul>
        </div>
      )}
    </header>
  );
}