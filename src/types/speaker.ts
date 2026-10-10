// Shape returned by /api/v1/speakers
export interface Speaker {
  id: string
  eventId: string
  firstName: string
  lastName: string
  title: string | null
  company: string | null
  sessionTopic: string | null
  bio: string | null
  photo: string | null
  linkedin: string | null
  displayPublic: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
  _count?: { sessions: number }
}