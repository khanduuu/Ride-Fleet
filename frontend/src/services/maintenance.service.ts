import { apiClient } from "./api-client";

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  maintenanceType: string;
  description: string;
  maintenanceDate: string;
  cost: number;
  status: "scheduled" | "in_progress" | "completed";
}

export const maintenanceService = {
  list(): Promise<MaintenanceRecord[]> {
    return apiClient.request<MaintenanceRecord[]>("/vendor/maintenance", {
      method: "GET",
    });
  },

  create(data: {
    vehicle_id: number;
    maintenance_type: string;
    description?: string;
    maintenance_date: string;
    cost: number;
    status: "scheduled" | "in_progress" | "completed";
  }): Promise<MaintenanceRecord> {
    return apiClient.request<MaintenanceRecord>("/vendor/maintenance", {
      method: "POST",
      body: data,
    });
  },

  complete(id: string) {
    return apiClient.request(`/vendor/maintenance/${id}/complete`, {
      method: "PUT",
    });
  },
};