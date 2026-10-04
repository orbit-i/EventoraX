import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { api, ApiError, onUnauthorized, tokenStore } from "@/lib/api"
import type {
  AcceptInviteInput,
  AuthResponse,
  AuthUser,
  MeResponse,
  Organization,
  RegisterInput,
} from "@/types/auth"

type AuthStatus = "loading" | "authenticated" | "guest"

interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  organization: Organization | null
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, remember: boolean) => Promise<AuthUser>
  register: (input: RegisterInput) => Promise<AuthUser>
  acceptInvite: (input: AcceptInviteInput) => Promise<AuthUser>
  logout: () => void
  /** Re-fetch the current user + organization (e.g. after editing settings). */
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const GUEST: AuthState = { status: "guest", user: null, organization: null }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    tokenStore.get() ? { status: "loading", user: null, organization: null } : GUEST
  )

  const loadMe = useCallback(async () => {
    try {
      const me = await api.get<MeResponse>("/auth/me")
      setState({ status: "authenticated", user: me.user, organization: me.organization })
    } catch (err) {
      // Only throw the token away if the server rejected it (not if the server is just down).
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) tokenStore.clear()
      setState(GUEST)
    }
  }, [])

  // On first load: if a token exists, find out who it belongs to.
  useEffect(() => {
    if (tokenStore.get()) void loadMe()
  }, [loadMe])

  // Any request rejected with 401 logs the user out everywhere.
  useEffect(
    () =>
      onUnauthorized(() => {
        tokenStore.clear()
        setState(GUEST)
      }),
    []
  )

  const startSession = useCallback(
    async (token: string, remember: boolean) => {
      tokenStore.set(token, remember)
      await loadMe()
    },
    [loadMe]
  )

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const res = await api.post<AuthResponse>("/auth/login", { email, password, remember }, { auth: false })
      await startSession(res.token, remember)
      return res.user
    },
    [startSession]
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const res = await api.post<AuthResponse>("/auth/register", input, { auth: false })
      await startSession(res.token, true)
      return res.user
    },
    [startSession]
  )

  const acceptInvite = useCallback(
    async (input: AcceptInviteInput) => {
      const res = await api.post<AuthResponse>("/auth/accept-invite", input, { auth: false })
      await startSession(res.token, true)
      return res.user
    },
    [startSession]
  )

  const logout = useCallback(() => {
    tokenStore.clear()
    setState(GUEST)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, register, acceptInvite, logout, refresh: loadMe }),
    [state, login, register, acceptInvite, logout, loadMe]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}

/** Where a user lands after logging in. */
export function homeFor(user: AuthUser): string {
  return user.role === "superAdmin" ? "/superadmin" : "/dashboard"
}