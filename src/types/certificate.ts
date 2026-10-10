// Shapes returned by /api/v1/certificates and /api/v1/verify
export type CertType = "PARTICIPATION" | "ACHIEVEMENT" | "APPRECIATION" | "SPEAKER" | "ORGANIZER"

export interface Certificate {
  id: string
  eventId: string
  registrationId: string
  type: CertType
  recipientName: string
  recipientEmail: string
  category: string | null
  templateKey: string
  verifyCode: string
  sha256Hash: string
  status: "ISSUED" | "REVOKED"
  revokedAt: string | null
  revokeReason: string | null
  downloadCount: number
  emailedAt: string | null
  issuedAt: string
  event: { id: string; title: string; startDateTime: string }
}

export interface CertificateStats {
  issued: number
  revoked: number
  emailed: number
  downloads: number
  /** Attended, but no Participation certificate yet */
  awaitingParticipation: number
}

export interface CertTemplate {
  key: string
  layout: string
  layoutName: string
  variant: string
  variantName: string
  primary: string | null
  accent: string | null
}

export interface TemplatesResponse {
  layouts: { key: string; name: string; description: string }[]
  variants: { key: string; name: string; primary: string; accent: string }[]
  templates: CertTemplate[]
}

/** GET /certificates/candidates */
export interface CertCandidate {
  id: string
  name: string
  email: string
  status: "REGISTERED" | "ATTENDED" | "ABSENT"
  category: { label: string } | null
  existing: { id: string; verifyCode: string; status: string } | null
  eligible: boolean
}

/** GET /verify/:code (public) */
export interface VerifyResult {
  valid: boolean
  status: "ISSUED" | "REVOKED" | "TAMPERED"
  verifyCode: string
  recipientName: string
  type: CertType
  category: string | null
  event: { title: string; date: string; location: string | null }
  organization: { name: string; logoUrl: string | null }
  issuedAt: string
  sha256Hash: string
  revokedAt: string | null
  revokeReason: string | null
  verifyUrl: string
}
