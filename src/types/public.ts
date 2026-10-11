// Shapes returned by /api/v1/public/* (no login)

export interface PublicOrgBrand {
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
  accentColor: string | null
}

export interface PublicEventCard {
  id: string
  title: string
  topic: string | null
  mode: "ONLINE" | "OFFLINE" | "HYBRID"
  startDateTime: string
  endDateTime: string
  location: string | null
  status: string
  registrationOpen: boolean
  maxAttendees: number | null
}

export interface PublicOrgPage {
  organization: PublicOrgBrand
  upcoming: PublicEventCard[]
  past: PublicEventCard[]
}

export interface PublicEvent {
  id: string
  title: string
  organizer: string | null
  topic: string | null
  description: string | null
  mode: "ONLINE" | "OFFLINE" | "HYBRID"
  status: string
  startDateTime: string
  endDateTime: string
  location: string | null
  ticketPrice: string | null
  categories: { id: string; label: string }[]
  organization: PublicOrgBrand
  registration: { open: boolean; reason: "OPEN" | "FULL" | "CLOSED" | "ENDED" | "UNAVAILABLE"; seatsLeft: number | null }
  speakers: { id: string; firstName: string; lastName: string; title: string | null; company: string | null; sessionTopic: string | null; bio: string | null; photo: string | null; linkedin: string | null }[]
  sponsors: { id: string; name: string; website: string | null; logo: string | null; tier: "PLATINUM" | "GOLD" | "SILVER" | "BRONZE" }[]
  sessions: { id: string; title: string; startTime: string; endTime: string; location: string | null; speaker: { firstName: string; lastName: string } | null }[]
}

export interface PublicRegistration {
  registered: true
  refNo: string
  ticketNo: string
  qrCode: string
  name: string
  email: string
  eventTitle: string
}
