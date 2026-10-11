// Shapes returned by /api/v1/superadmin/*
import type { OrgStatus, Role } from "./auth"
import type { MonthCount } from "./dashboard"

export interface PlatformActivity {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  ipAddress?: string | null
  user: { id: string; name: string; role?: Role; email?: string } | null
  organization?: { id: string; name: string } | null
}

export interface PlatformDashboard {
  tenants: { total: number; trial: number; active: number; expired: number; suspended: number; newThisMonth: number }
  revenue: { month: string; year: string; allTime: string }
  totals: { events: number; registrations: number; certificates: number; users: number }
  signups: MonthCount[]
  alerts: {
    pendingPayments: {
      count: number
      items: { id: string; amount: string; method: string; createdAt: string; organization: { id: string; name: string }; plan: { name: string } | null }[]
    }
    recentlyExpired: { id: string; name: string; subscriptionEndsAt: string; plan: { name: string } | null }[]
    expiringSoon: { id: string; name: string; status: OrgStatus; subscriptionEndsAt: string }[]
    errors24h: number
    failedLogins24h: number
  }
  recentActivity: PlatformActivity[]
}

export interface PlanRow {
  id: string
  name: string
  price: string
  currency: string
  maxAdmins: number | null
  maxManagers: number | null
  description: string | null
  features: Record<string, boolean | number> | null
  isVisible: boolean
  sortOrder: number
  createdAt: string
  tenantCount: number
}

export interface TenantRow {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  logoUrl: string | null
  status: OrgStatus
  subscriptionEndsAt: string
  suspendedAt: string | null
  createdAt: string
  plan: { id: string; name: string } | null
  _count: { users: number; events: number }
}

export interface TenantStats {
  total: number
  trial: number
  active: number
  expired: number
  suspended: number
}

export interface TenantDetail {
  organization: {
    id: string
    name: string
    slug: string
    email: string | null
    phone: string | null
    logoUrl: string | null
    primaryColor: string | null
    whiteLabelName: string | null
    customDomain: string | null
    status: OrgStatus
    suspendedAt: string | null
    suspendedReason: string | null
    subscriptionEndsAt: string
    createdAt: string
    plan: { id: string; name: string; price: string; maxAdmins: number | null; maxManagers: number | null } | null
  }
  usage: {
    events: number
    archivedEvents: number
    registrations: number
    attended: number
    certificates: number
    ticketsCheckedIn: number
    idCards: number
    team: { admin: number; manager: number; viewer: number }
    pendingInvites: number
    lastActivityAt: string | null
    totalPaid: string
  }
  users: { id: string; name: string; email: string; role: Role; isActive: boolean; emailVerified: boolean; lastLoginAt: string | null; createdAt: string }[]
  recentEvents: { id: string; title: string; status: string; startDateTime: string; registrations: number }[]
  payments: {
    id: string
    amount: string
    method: string
    status: string
    referenceNo: string | null
    createdAt: string
    confirmedAt: string | null
    periodEnd: string | null
    plan: { id: string; name: string } | null
  }[]
  activity: PlatformActivity[]
}

export interface CreatedTenant {
  organization: { id: string; name: string }
  admin: { id: string; name: string; email: string }
  temporaryPassword: string
}
