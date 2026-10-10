// Shapes returned by /api/v1/team
export type TeamRole = "admin" | "manager" | "viewer"

export interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamRole
  emailVerified: boolean
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface PendingInvite {
  id: string
  email: string
  role: TeamRole
  createdAt: string
  expiresAt: string
  invitedBy: { id: string; name: string } | null
}

/** limit null = unlimited. "used" counts members AND pending invites. */
export interface SeatUsage {
  used: number
  limit: number | null
}

export interface TeamResponse {
  members: TeamMember[]
  pendingInvites: PendingInvite[]
  seats: { admin: SeatUsage; manager: SeatUsage }
}
