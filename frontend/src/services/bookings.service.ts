import { withMock , apiClient } from "./api-client";
import { mockBookings, mockPayments, mockReviews, mockVehicles } from "./mock-data";
import type { Booking, CustomerOverview, Payment, Review } from "@/types";

export interface BookingDraft {
  vehicleId: string;
  pickupLocation: string;
  startDate: string;
  endDate: string;
}

export const bookingsService = {
  /** GET /bookings */
  list(): Promise<Booking[]> {
  return apiClient.request<Booking[]>("/bookings", {
    method: "GET",
  });
},

  /** GET /bookings/{id} */
  getByReference(reference: string): Promise<Booking | null> {
    return withMock(
      () => mockBookings.find((b) => b.reference === reference) ?? null,
      `/bookings/${reference}`,
    );
  },

  /** POST /bookings */
 create(draft: BookingDraft): Promise<Booking> {
  return apiClient.request("/bookings", {
    method: "POST",
    body: {
      vehicle_id: Number(draft.vehicleId),
      pickup_location: draft.pickupLocation,
      start_date: draft.startDate.split("T")[0],
      end_date: draft.endDate.split("T")[0],
    },
  });
},
  /** GET /me/overview */
  customerOverview(): Promise<CustomerOverview> {
  return apiClient.request<CustomerOverview>("/me/overview");
},

  /** GET /me/payments */
  payments(): Promise<Payment[]> {
  return apiClient.request<Payment[]>("/me/payments", {
    method: "GET",
  });
},

  cancel(id: string) {
  return apiClient.request(`/bookings/${id}/cancel`, {
    method: "PUT",
  });
},
  /** GET /me/reviews */
myReviews(): Promise<Review[]> {
  return apiClient.request<Review[]>("/me/reviews", {
    method: "GET",
  });
},

createReview(data: {
  bookingId: string;
  rating: number;
  comment: string;
}) {
  return apiClient.request("/reviews", {
    method: "POST",
    body: {
      booking_id: Number(data.bookingId),
      rating: data.rating,
      comment: data.comment,
    },
  });
},

};

