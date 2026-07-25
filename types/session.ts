export interface SessionSpeakerRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Session {
  id: string;
  tenantId: string;
  eventId: string;
  speakerId: string | null;
  title: string;
  startTime: string;
  endTime: string;
  location: string | null;
  displayPublic: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  speaker?: SessionSpeakerRef | null;
}