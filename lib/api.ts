/**
 * Central API client for EventoraX.
 *
 * Every backend route returns { data, error } (and { meta } for lists).
 * This wrapper unwraps that envelope and throws a typed ApiError on failure,
 * so pages/components can just `await` and try/catch without repeating the
 * envelope-checking logic everywhere.
 *
 * AUTH NOTE: there is no real auth yet (backend uses a hardcoded tenant
 * stub). When real auth lands, this is the ONLY file that should need to
 * change — add the auth header/cookie handling inside `request()`.
 */

const BASE_URL = "/api/v1";

export interface ApiEnvelope<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  } | null;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export class ApiError extends Error {
  code: string;
  fieldErrors?: Record<string, string>;
  status: number;

  constructor(
    message: string,
    code: string,
    status: number,
    fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export interface ListResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      // Don't force Content-Type when sending FormData (multipart needs
      // the browser to set its own boundary).
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  // Some endpoints (export) are not JSON — callers use rawUrl() for those
  // instead of going through request(), so we can safely assume JSON here.
  const json: ApiEnvelope<T> = await res.json();

  if (!res.ok || json.error) {
    throw new ApiError(
      json.error?.message ?? "Something went wrong. Please try again.",
      json.error?.code ?? "UNKNOWN_ERROR",
      res.status,
      json.error?.fieldErrors
    );
  }

  return json.data as T;
}

async function requestList<T>(
  path: string,
  options: RequestInit = {}
): Promise<ListResult<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  const json: ApiEnvelope<T[]> = await res.json();

  if (!res.ok || json.error) {
    throw new ApiError(
      json.error?.message ?? "Something went wrong. Please try again.",
      json.error?.code ?? "UNKNOWN_ERROR",
      res.status,
      json.error?.fieldErrors
    );
  }

  return {
    data: json.data ?? [],
    meta: json.meta ?? { total: 0, page: 1, limit: 20 },
  };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  getList: <T>(path: string) => requestList<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  /** For non-JSON endpoints like export — return a full URL to link/redirect to. */
  rawUrl: (path: string) => `${BASE_URL}${path}`,
};

/** Builds a query string from an object, skipping empty/undefined values. */
export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
