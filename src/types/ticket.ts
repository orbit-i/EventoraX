// Shapes returned by /api/v1/tickets
export interface Ticket {
  id: string
  eventId: string
  registrationId: string
  ticketNo: string
  qrCode: string
  type: string | null
  isUsed: boolean
  usedAt: string | null
  usedById: string | null
  emailedAt: string | null
  createdAt: string
  registration: { id: string; name: string; email: string; refNo: string; status: string }
  event: { id: string; title: string; startDateTime: string; endDateTime: string; mode: string; location: string | null; status: string }
}

export interface TicketStats {
  total: number
  used: number
  unused: number
  emailed: number
  /** % checked in */
  rate: number
}

/** POST /tickets/check-in */
export interface CheckInResult {
  result: "CHECKED_IN" | "ALREADY_USED"
  ticketId: string
  name: string
  email: string
  ticketNo: string
  type: string | null
  event: string
  usedAt: string
  usedBy: string | null
}
