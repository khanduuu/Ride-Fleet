import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Gauge,
  Heart,
  LayoutDashboard,
  ShieldCheck,
  Star,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import type { NavItem } from "./DashboardShell";


export const customerNav: NavItem[] = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "My bookings", to: "/dashboard/bookings", icon: CalendarDays },
  { label: "Favorites", to: "/dashboard/favorites", icon: Heart },
  { label: "Payments", to: "/dashboard/payments", icon: CreditCard },
  { label: "Reviews", to: "/dashboard/reviews", icon: Star },
];

export const vendorNav: NavItem[] = [
  { label: "Overview", to: "/vendor", icon: LayoutDashboard, exact: true },
  { label: "My vehicles", to: "/vendor/vehicles", icon: Truck },
  { label: "Bookings", to: "/vendor/bookings", icon: CalendarDays },
  { label: "Maintenance", to: "/vendor/maintenance", icon: Wrench },
  { label: "Earnings", to: "/vendor/earnings", icon: BarChart3 },
];

export const adminNav: NavItem[] = [
  { label: "Overview", to: "/admin", icon: Gauge, exact: true },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Vendors", to: "/admin/vendors", icon: ShieldCheck },
  { label: "Vehicles", to: "/admin/vehicles", icon: Truck },
  { label: "Bookings", to: "/admin/bookings", icon: CalendarDays },
  { label: "Payments", to: "/admin/payments", icon: CreditCard },
  {
  label: "Maintenance",
  to: "/admin/maintenance",
  icon: Wrench,
},
];
