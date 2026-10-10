/**
 * The one place the frontend talks to the backend.
 *
 * - Adds the login token to every request.
 * - Understands both response shapes the API uses:
 *     { data, error, meta }  (everything else)   and   plain objects (/auth routes).
 * - Turns every failure into an ApiError with a readable message.
 * - Tells the app to log out when the server says the session is no longer valid.
 */

const API_BASE: string = import.meta.env.VITE_API_URL ?? "/api/v1"
const TOKEN_KEY = "evx_token"

export interface ListMeta {
  total: number
  page: number
  limit: number
}

export class ApiError extends Error {
  status: number
  code: string
  fieldErrors?: Record<string, string>

  constructor(message: string, status: number, code: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

/** "Remember me" → localStorage (survives closing the browser); otherwise sessionStorage. */
export const tokenStore = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  },
  set(token: string, remember: boolean) {
    tokenStore.clear()
    ;(remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
  },
  /** Swap in a new token, keeping the same storage (used after changing password). */
  replace(token: string) {
    if (localStorage.getItem(TOKEN_KEY)) localStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.setItem(TOKEN_KEY, token)
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  },
}

// ── "Session ended" notifications (AuthContext listens and logs the user out) ──
const unauthorizedListeners = new Set<() => void>()

export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

interface ErrorBody {
  error?: string | { code?: string; message?: string; fieldErrors?: Record<string, string> } | null
  code?: string
  fieldErrors?: Record<string, string>
}

interface RequestOptions {
  method?: string
  body?: unknown
  /** false = don't send the token (login, register, public pages) */
  auth?: boolean
  signal?: AbortSignal
}

async function rawRequest(path: string, opts: RequestOptions): Promise<{ res: Response; sentToken: boolean }> {
  const headers: Record<string, string> = {}
  const token = opts.auth === false ? null : tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let body: BodyInit | undefined
  if (opts.body instanceof FormData) {
    body = opts.body // the browser sets the multipart boundary itself
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json"
    body = JSON.stringify(opts.body)
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body,
      signal: opts.signal,
    })
    return { res, sentToken: token !== null }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err
    throw new ApiError("Cannot reach the server. Is the backend running?", 0, "NETWORK_ERROR")
  }
}

async function toApiError(res: Response, sentToken: boolean): Promise<ApiError> {
  const body = (await res.json().catch(() => ({}))) as ErrorBody
  const nested = body.error && typeof body.error === "object" ? body.error : undefined
  const message =
    nested?.message ?? (typeof body.error === "string" ? body.error : undefined) ?? `Request failed (${res.status})`
  const code = nested?.code ?? body.code ?? "UNKNOWN_ERROR"
  const fieldErrors = nested?.fieldErrors ?? body.fieldErrors

  // A logged-in request was rejected → the session is over everywhere in the app.
  if (res.status === 401 && sentToken) {
    unauthorizedListeners.forEach((listener) => listener())
  }
  return new ApiError(message, res.status, code, fieldErrors)
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<{ data: T; meta?: ListMeta }> {
  const { res, sentToken } = await rawRequest(path, opts)
  if (!res.ok) throw await toApiError(res, sentToken)

  const body: unknown = res.status === 204 ? null : await res.json().catch(() => null)
  if (body && typeof body === "object" && "data" in body && "error" in body) {
    const envelope = body as { data: T; meta?: ListMeta }
    return { data: envelope.data, meta: envelope.meta }
  }
  return { data: body as T }
}

function fileNameFrom(res: Response, fallback: string): string {
  const header = res.headers.get("content-disposition") ?? ""
  const match = /filename="?([^";]+)"?/i.exec(header)
  return match?.[1] ?? fallback
}

export const api = {
  get: async <T>(path: string, opts?: RequestOptions) => (await request<T>(path, opts)).data,

  /** For paginated lists: returns { data, meta } */
  list: async <T>(path: string, opts?: RequestOptions) => {
    const result = await request<T[]>(path, opts)
    return { data: result.data ?? [], meta: result.meta ?? { total: 0, page: 1, limit: 20 } }
  },
    /** Same as list() — the name used by the pages ported from the events module. */
  getList: async <T>(path: string, opts?: RequestOptions) => {
    const result = await request<T[]>(path, opts)
    return { data: result.data ?? [], meta: result.meta ?? { total: 0, page: 1, limit: 20 } }
  },
  post: async <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    (await request<T>(path, { ...opts, method: "POST", body })).data,

  patch: async <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    (await request<T>(path, { ...opts, method: "PATCH", body })).data,

  delete: async <T>(path: string, opts?: RequestOptions) =>
    (await request<T>(path, { ...opts, method: "DELETE" })).data,

  /** Upload one file as multipart form data (field name "file" by default). */
  upload: async <T>(path: string, file: File, field = "file") => {
    const form = new FormData()
    form.append(field, file)
    return (await request<T>(path, { method: "POST", body: form })).data
  },

  /** Download a file (CSV, Excel, PDF...) with the login token and save it. */
  download: async (path: string, fallbackName: string) => {
    const { res, sentToken } = await rawRequest(path, {})
    if (!res.ok) throw await toApiError(res, sentToken)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileNameFrom(res, fallbackName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}

/** Builds "?a=1&b=2", skipping empty values. */
export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ""
}

/** Readable message from anything thrown. */
export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  return err instanceof ApiError ? err.message : fallback
}