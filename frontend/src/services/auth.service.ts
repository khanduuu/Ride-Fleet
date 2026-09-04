import { apiClient } from "./api-client";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: "customer" | "vendor" | "admin";
}

export interface LoginResponse {
  message: string;
  access_token: string;
  token_type: string;
}

export const authService = {
  register(data: RegisterData) {
    return apiClient.request<{ message: string; user_id: number }>(
      "/register",
      {
        method: "POST",
        body: data,
      },
    );
  },

  login(email: string, password: string) {
    console.log("LOGIN EMAIL:", email);
    console.log("LOGIN PASSWORD:", password);

    return apiClient.request<LoginResponse>("/login", {
      method: "POST",
      query: {
        email: email.trim(),
        password,
      },
    });
  },
};