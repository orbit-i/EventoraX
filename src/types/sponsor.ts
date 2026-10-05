export type SponsorTier = "PLATINUM" | "GOLD" | "SILVER" | "BRONZE";

export interface Sponsor {
  id: string;
  tenantId: string;
  eventId: string;
  name: string;
  website: string | null;
  logo: string | null;
  tier: SponsorTier;
  displayPublic: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const TIER_ORDER: SponsorTier[] = ["PLATINUM", "GOLD", "SILVER", "BRONZE"];