export type UserRole = "customer" | "vendor" | "admin";

export type VehicleType =
  | "Sedan"
  | "SUV"
  | "Hatchback"
  | "Van"
  | "Luxury"
  | "Bike";

export type FuelType = "Electric" | "Hybrid" | "Petrol" | "Diesel";
export type Transmission = "Automatic" | "Manual";

export type MaintenanceStatus =
  | "scheduled"
  | "in_progress"
  | "completed";
export type AvailabilityStatus = "available" | "booked" | "maintenance";
export type BookingStatus =
  | "upcoming"
  | "active"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "pending";
export type PaymentStatus = "paid" | "pending" | "refunded" | "failed";

export interface Vendor {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  tripsCompleted: number;
  memberSince: string;
  responseTimeMinutes: number;
  verified: boolean;
  city?: string;
  vehicleCount?: number;
  status?: "active" | "pending" | "suspended";
}

export interface VehicleSpecs {
  seats: number;
  doors: number;
  fuel: FuelType;
  transmission: Transmission;
  rangeKm: number;
  luggage: number;
  year: number;
}

/** Server-computed pricing. The frontend never derives these numbers. */
export interface PricingBreakdown {
  currency: string;
  basePrice: number;
  demandAdjustment: number;
  discount: number;
  taxesAndFees: number;
  finalPrice: number;
  demandLabel?: string;
  discountLabel?: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  vehicleName?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  pricePerDay: number;
  currency: string;
  rating: number;
  reviewCount: number;
  location: string;
  availability: AvailabilityStatus;
  maintenanceStatus: VehicleMaintenanceStatus;
  imageUrl: string;
  gallery: string[];
  description: string;
  features: string[];
  specs: VehicleSpecs;
  vendor: Vendor;
  matchScore?: number;
  pricing?: PricingBreakdown;
}

export interface VehicleQuery {
  q?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  types?: VehicleType[];
  fuels?: FuelType[];
  transmissions?: Transmission[];
  seats?: number[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "recommended" | "price_asc" | "price_desc" | "rating_desc";
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Booking {
  id: string;
  reference: string;
  vehicleId: string;
  vehicleName: string;
  vehicleImage: string;
  customerName: string;
  vendorName: string;
  pickupLocation: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  total: number;
  currency: string;
}

export interface Payment {
  id: string;
  bookingRef: string;
  method: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  date: string;
  payer?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  maintenanceType: string;
  description: string;
  maintenanceDate: string;
  cost: number;
  status: MaintenanceStatus;
}

export interface MetricPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface CustomerOverview {
  userName: string;
  activeRental: Booking | null;
  upcoming: Booking[];
  previous: Booking[];
  favouritesCount: number;
  totalSpend: number;
  currency: string;
}

export interface VendorOverview {
  totalVehicles: number;
  activeBookings: number;
  upcomingBookings: number;
  revenue: number;
  currency: string;
  revenueSeries: MetricPoint[];
  utilisationSeries: MetricPoint[];
}

export interface AdminOverview {
  totalUsers: number;
  totalVendors: number;
  totalVehicles: number;
  activeRentals: number;
  totalBookings: number;
  revenue: number;
  currency: string;
  revenueSeries: MetricPoint[];
  bookingsByCategory: MetricPoint[];
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "pending" | "suspended";
  joinedAt: string;
  bookings: number;
}

export type VehicleMaintenanceStatus =
  | "good"
  | "service_due_soon"
  | "under_maintenance";  

  export interface PlatformOverview {
  totalVehicles: number;
  activeBookings: number;
  revenue: number;
  currency: string;
}