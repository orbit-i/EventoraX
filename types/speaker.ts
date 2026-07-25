import type { EventOption } from "@/types/registration";

export interface Speaker {
  id: string;
  tenantId: string;
  eventId: string;
  firstName: string;
  lastName: string;
  title: string | null;
  company: string | null;
  sessionTopic: string | null;
  bio: string | null;
  photo: string | null;
  linkedin: string | null;
  displayPublic: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type { EventOption };