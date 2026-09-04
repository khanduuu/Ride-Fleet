/**
 * Thin HTTP client for the future FastAPI backend.
 *
 * Every service module goes through `apiClient`. Components never call
 * `fetch` directly. Until `VITE_API_BASE_URL` is configured the services
 * resolve mock fixtures through `withMock`, so swapping to the real REST
 * API is a one-line change per endpoint.
 */

export const API_BASE_URL: string =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "";

export const IS_API_CONFIGURED = API_BASE_URL.length > 0;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type Query = Record<
  string,
  string | number | boolean | undefined | null | string[] | number[]
>;
function buildUrl(path: string, query?: Query): string {
  const url = new URL(
    path.startsWith("/") ? path : `/${path}`,
    API_BASE_URL || "http://localhost",
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, signal } = options;
  const response = await fetch(buildUrl(path, query), {
    method,
    signal: signal ?? null,
    headers: {
  "Content-Type": "application/json",
  Accept: "application/json",
  ...(typeof window !== "undefined" && localStorage.getItem("access_token")
  ? {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    }
  : {}),
},
    body: body === undefined ? null : JSON.stringify(body),
  });

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = undefined;
    }
    throw new ApiError(
      `Request to ${path} failed with ${response.status}`,
      response.status,
      details,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Simulates realistic latency for mock fixtures. */
export function delay(ms = 320): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls the real endpoint when the API base URL is configured, otherwise
 * resolves the provided fixture. Keeps every call site FastAPI-ready.
 */
export async function withMock<T>(
  fixture: () => T | Promise<T>,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (IS_API_CONFIGURED) return request<T>(path, options);
  await delay();
  return fixture();
}

export const apiClient = { request, buildUrl };
