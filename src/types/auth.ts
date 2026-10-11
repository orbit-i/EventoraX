export type Role = "superAdmin" | "admin" | "manager" | "viewer"
export type OrgStatus = "trial" | "active" | "expired" | "suspended"

export interface AuthUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: Role
  organizationId: string | null
  emailVerified: boolean
  /** Two-factor login (authenticator app) is on */
  twoFactorEnabled?: boolean
}

export interface Plan {
  id: string
  name: string
  price: string
  currency: string
  maxAdmins: number | null
  maxManagers: number | null
  features: Record<string, unknown> | null
}

export interface Organization {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  logoUrl: string | null
  primaryColor: string | null
  accentColor: string | null
  whiteLabelName: string | null
  customDomain: string | null
  signatureUrl: string | null
  signatoryName: string | null
  signatoryTitle: string | null
  notificationPrefs: Record<string, boolean> | null
  status: OrgStatus
  suspendedReason?: string | null
  subscriptionEndsAt: string
  plan: Plan | null
}

export interface MeResponse {
  user: AuthUser
  organization: Organization | null
  /** Set when a superadmin is "logged in as" this user */
  impersonator?: { id: string; name: string; email: string } | null
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

/** POST /auth/login when the account has two-factor login: no session yet, a code is needed first. */
export interface TwoFactorChallengeResponse {
  twoFactorRequired: true
  challengeToken: string
}

/** What login() gives back: logged in, or "now enter your 6-digit code". */
export type LoginResult = { user: AuthUser } | { challengeToken: string }

export interface RegisterInput {
  fullName: string
  organizationName: string
  email: string
  phone: string
  password: string
}

export interface AcceptInviteInput {
  token: string
  name: string
  password: string
  phone?: string
}