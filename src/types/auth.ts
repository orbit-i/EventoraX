export type Role = "superAdmin" | "admin" | "manager" | "viewer"
export type OrgStatus = "trial" | "active" | "expired" | "suspended"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  organizationId: string | null
  emailVerified: boolean
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
  subscriptionEndsAt: string
  plan: Plan | null
}

export interface MeResponse {
  user: AuthUser
  organization: Organization | null
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

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