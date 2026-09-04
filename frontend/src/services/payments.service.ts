import { apiClient } from "./api-client";

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  booking_id: number;
}

export interface VerifyPaymentData {
  booking_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const paymentsService = {
  createOrder(bookingId: string): Promise<CreateOrderResponse> {
    return apiClient.request<CreateOrderResponse>(
      "/payments/create-order",
      {
        method: "POST",
        body: {
          booking_id: Number(bookingId),
        },
      },
    );
  },

  verify(data: VerifyPaymentData) {
    return apiClient.request("/payments/verify", {
      method: "POST",
      body: data,
    });
  },
};