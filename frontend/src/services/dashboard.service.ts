import { withMock, apiClient } from "./api-client";
import {
  mockAdminOverview,
  mockBookings,
  mockMaintenance,
  mockPayments,
  mockUsers,
  mockVehicles,
  mockVendorOverview,
  mockVendors,
} from "./mock-data";
import type {
  AdminOverview,
  Booking,
  BookingStatus,
  MaintenanceRecord,
  Payment,
  PaymentStatus,
  PlatformUser,
  Vehicle,
  Vendor,
  Review,
  VendorOverview,
  PlatformOverview,
} from "@/types";

export const platformService = {
  overview(): Promise<PlatformOverview> {
    return apiClient.request("/platform/overview");
  },

  reviews(): Promise<Review[]> {
    return apiClient.request("/platform/reviews");
  },
  maintenance(): Promise<MaintenanceRecord[]> {
  return apiClient.request("/platform/maintenance");
},
};
  

export const vendorService = {
  /** GET /vendor/overview */
  overview(): Promise<VendorOverview> {
    return withMock(() => mockVendorOverview, "/vendor/overview");
  },
  /** GET /vendor/vehicles */
  vehicles(): Promise<Vehicle[]> {
  return apiClient.request("/vendor/vehicles");
},
  /** GET /vendor/bookings */
  bookings(): Promise<Booking[]> {
  return apiClient.request("/vendor/bookings");
},
  /** GET /vendor/maintenance */
  maintenance(): Promise<MaintenanceRecord[]> {
  return apiClient.request("/vendor/maintenance");
},
createMaintenance(data: {
  vehicle_id: number;
  maintenance_type: string;
  description?: string;
  maintenance_date: string;
  cost: number;
  status: string;
}) {
  return apiClient.request("/vendor/maintenance", {
    method: "POST",
    body: data,
  });
},
 /** PUT /vendor/maintenance/{id}/complete */
  markServiced(id: string) {
    return apiClient.request(`/vendor/maintenance/${id}/complete`, {
      method: "PUT",
    });
  },
  /** GET /vendor/earnings */
  earnings(): Promise<Payment[]> {
  return apiClient.request("/vendor/earnings");
},
};

export const adminService = {
  /** GET /admin/overview */
  overview(): Promise<AdminOverview> {
    return apiClient.request("/admin/overview");
  },
  
  /** GET /admin/users */
  users(): Promise<PlatformUser[]> {
  return apiClient.request<any[]>("/admin/users").then((users) =>
    users.map((user) => ({
      ...user,
      joinedAt: user.createdAt,
    }))
  );
},

  /** GET /admin/vendors */
  vendors(): Promise<Vendor[]> {
  return apiClient.request("/admin/vendors");
},
updateUserStatus(
  id: string,
  status: "active" | "pending" | "suspended",
) {
  return apiClient.request(`/admin/users/${id}/status?status=${status}`, {
    method: "PUT",
  });
},
  /** GET /admin/vehicles */
  vehicles(): Promise<Vehicle[]> {
  return apiClient.request("/vehicles").then((data: any) => data.items);
},

/** GET /admin/bookings */
async bookings(): Promise<Booking[]> {
  const [bookings, users, vehiclesResponse, payments, vendors] =
  await Promise.all([
    apiClient.request<any[]>("/admin/bookings"),
    apiClient.request<any[]>("/admin/users"),
    apiClient.request<any>("/vehicles"),
    apiClient.request<any[]>("/admin/payments"),
    apiClient.request<any[]>("/admin/vendors"),
  ]);
  const vehicles = vehiclesResponse.items ?? vehiclesResponse;
  const vendorList = vendors;

  return bookings.map((booking): Booking => {
    const userId = booking.userId ?? booking.user_id;
    const vehicleId = booking.vehicleId ?? booking.vehicle_id;

    const user = users.find(
      (u) => String(u.id) === String(userId)
    );

    const vehicle = vehicles.find(
      (v: any) => String(v.id) === String(vehicleId)
    );

    const payment = payments.find(
      (p) =>
        String(p.bookingId ?? p.booking_id) ===
        String(booking.id)
    );

    const startDate =
      booking.startDate ?? booking.start_date;

    const endDate =
      booking.endDate ?? booking.end_date;

    const totalAmount =
      booking.totalAmount ??
      booking.total_amount ??
      booking.total;

    return {
      id: String(booking.id),

      reference:
        booking.reference ??
        `RF-${booking.id}`,

      vehicleId: String(vehicleId),

      vehicleName:
        booking.vehicleName ??
        vehicle?.name ??
        `Vehicle ${vehicleId}`,

      vehicleImage:
        booking.vehicleImage ??
        vehicle?.imageUrl ??
        "",

      customerName:
        booking.customerName ??
        user?.name ??
        `User ${userId}`,

      vendorName:
  booking.vendorName ??
  vehicle?.vendor?.name ??
  (() => {
    const vendorId =
      vehicle?.vendorId ??
      vehicle?.vendor_id ??
      vehicle?.vendor?.id;

    const vendor = vendorList.find(
      (v: any) => String(v.id) === String(vendorId)
    );

    return vendor?.name ?? "—";
  })(),

      pickupLocation:
        booking.pickupLocation ??
        vehicle?.location ??
        "—",

      startDate: String(startDate),

      endDate: String(endDate),

      status: booking.status as BookingStatus,

      paymentStatus: (
        booking.paymentStatus ??
        payment?.paymentStatus ??
        "pending"
      ) as PaymentStatus,

      total: Number(totalAmount),

      currency:
        booking.currency ??
        vehicle?.currency ??
        "INR",
    };
  });
},

/** GET /admin/payments */
async payments(): Promise<Payment[]> {
  const [payments, bookings] = await Promise.all([
    apiClient.request<any[]>("/admin/payments"),
    this.bookings(),
  ]);

  return payments.map((payment): Payment => {
    const booking = bookings.find(
      (booking) =>
        String(booking.id) === String(payment.bookingId)
    );

    return {
      id: String(payment.id),

      bookingRef: `RF-${payment.bookingId}`,

      payer: booking?.customerName ?? "—",

      method: payment.paymentMethod || "—",

      amount: Number(payment.amount),

      currency: "INR",

      status: payment.paymentStatus as PaymentStatus,

      date: payment.createdAt,
    };
  });
},

  /** GET /admin/maintenance */
  maintenance(): Promise<MaintenanceRecord[]> {
  return apiClient.request("/admin/maintenance");
},
};
