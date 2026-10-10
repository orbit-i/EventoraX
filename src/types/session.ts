// Shape returned by /api/v1/sessions
export interface Session {
  id: string
  eventId: string
  speakerId: string | null
  title: string
  startTime: string
  endTime: string
  location: string | null
  displayPublic: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
  speaker: { id: string; firstName: string; lastName: string; photo: string | null } | null
}