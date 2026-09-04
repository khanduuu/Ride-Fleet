import { apiClient, withMock, type Query } from "./api-client";
import { mockReviews, mockVehicles } from "./mock-data";
import type {
  Paginated,
  PricingBreakdown,
  Review,
  Vehicle,
  VehicleQuery,
} from "@/types";

function applyFilters(query: VehicleQuery): Vehicle[] {
  let items = [...mockVehicles];
  const {
    q,
    location,
    types,
    fuels,
    transmissions,
    seats,
    minPrice,
    maxPrice,
    sort,
  } = query;

  if (q) {
    const needle = q.toLowerCase();
    items = items.filter(
      (v) =>
        v.name.toLowerCase().includes(needle) ||
        v.type.toLowerCase().includes(needle) ||
        v.location.toLowerCase().includes(needle),
    );
  }
  if (location) {
    const needle = location.toLowerCase();
    items = items.filter((v) => v.location.toLowerCase().includes(needle));
  }
  if (types?.length) items = items.filter((v) => types.includes(v.type));
  if (fuels?.length) items = items.filter((v) => fuels.includes(v.specs.fuel));
  if (transmissions?.length)
    items = items.filter((v) => transmissions.includes(v.specs.transmission));
  if (seats?.length)
    items = items.filter((v) => seats.some((s) => (s === 7 ? v.specs.seats >= 7 : v.specs.seats === s)));
  if (typeof minPrice === "number")
    items = items.filter((v) => v.pricePerDay >= minPrice);
  if (typeof maxPrice === "number")
    items = items.filter((v) => v.pricePerDay <= maxPrice);

  switch (sort) {
    case "price_asc":
      items.sort((a, b) => a.pricePerDay - b.pricePerDay);
      break;
    case "price_desc":
      items.sort((a, b) => b.pricePerDay - a.pricePerDay);
      break;
    case "rating_desc":
      items.sort((a, b) => b.rating - a.rating);
      break;
    default:
      items.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  }
  return items;
}

export const vehiclesService = {
  /** GET /vehicles */
  list(query: VehicleQuery = {}): Promise<Paginated<Vehicle>> {
  return apiClient.request<Paginated<Vehicle>>("/vehicles", {
    method: "GET",
    query: query as Query,
  });
},

create(data: {
  brand: string;
  model: string;
  vehicle_type: string;
  registration_number: string;
  price_per_day: number;
  fuel_type?: string;
  transmission?: string;
  seats?: number;
  location?: string;
  image_url?: string;
}) {
  return apiClient.request("/vehicles", {
    method: "POST",
    body: data,
  });
},
update(id: string, data: {
  brand: string;
  model: string;
  vehicle_type: string;
  price_per_day: number;
  fuel_type?: string;
  transmission?: string;
  seats?: number;
  location?: string;
}) {
  return apiClient.request(`/vehicles/${id}`, {
    method: "PUT",
    body: data,
  });
},

remove(id: string) {
  return apiClient.request(`/vehicles/${id}`, {
    method: "DELETE",
  });
},

  /** GET /vehicles/{id} */
  getById(id: string): Promise<Vehicle | null> {
  return apiClient.request(`/vehicles/${id}`);
},

  /** GET /vehicles/popular */
  popular(limit = 3): Promise<Vehicle[]> {
  return apiClient
    .request<any>("/vehicles")
    .then((data) => (data.items ?? data).slice(0, limit));
},

recommended(limit = 3): Promise<Vehicle[]> {
  return apiClient
    .request<any>("/vehicles")
    .then((data) => (data.items ?? data).slice(0, limit));
},

  /** GET /vehicles/{id}/reviews */
  reviews(id: string): Promise<Review[]> {
    return withMock(() => mockReviews[id] ?? [], `/vehicles/${id}/reviews`);
  },

  /**
   * GET /pricing/quote — dynamic pricing is computed server side.
   * The fixture below is display data, not a pricing rule.
   */
  quote(input: {
  vehicleId: string;
  startDate: string;
  endDate: string;
}): Promise<PricingBreakdown> {
  return apiClient.request<PricingBreakdown>("/pricing/quote", {
    method: "POST",
    body: {
      vehicleId: Number(input.vehicleId),
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
},

  /** GET /me/favourites */
  
favourites(): Promise<Vehicle[]> {
  return apiClient.request<Vehicle[]>("/me/favourites", {
    method: "GET",
  });
},

/** POST /me/favourites/{vehicleId} */
addFavourite(vehicleId: string) {
  return apiClient.request(`/me/favourites/${vehicleId}`, {
    method: "POST",
  });
},

/** DELETE /me/favourites/{vehicleId} */
removeFavourite(vehicleId: string) {
  return apiClient.request(`/me/favourites/${vehicleId}`, {
    method: "DELETE",
  });
},
};
