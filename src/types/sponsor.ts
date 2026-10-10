// Shape returned by /api/v1/sponsors
export type SponsorTier = "PLATINUM" | "GOLD" | "SILVER" | "BRONZE"

export const TIER_ORDER: SponsorTier[] = ["PLATINUM", "GOLD", "SILVER", "BRONZE"]

export interface Sponsor {
  id: string
  eventId: string
  name: string
  website: string | null
  logo: string | null
  tier: SponsorTier
  displayPublic: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}