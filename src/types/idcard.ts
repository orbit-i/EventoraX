// Shapes returned by /api/v1/idcards

export type IdCardTemplate = "classic" | "sidebar" | "minimal" | "bold"
export type IdCardField = "category" | "department" | "rollNo" | "email" | "qr"
export type IdCardLayout = "sheet" | "single"

export interface IdCardOptions {
  templates: { key: IdCardTemplate; name: string; description: string }[]
  fields: { key: IdCardField; name: string; description?: string }[]
  defaults: { template: IdCardTemplate; fields: IdCardField[] }
}

/** One attendee row on the ID cards page. */
export interface IdCardPerson {
  id: string // registration id
  name: string
  email: string
  department: string | null
  rollNo: string | null
  status: string
  category: { id: string; label: string } | null
  ticketNo: string | null
  lastPrintedAt: string | null
  lastTemplate: string | null
}

export interface IdCardStats {
  total: number
  printed: number
  notPrinted: number
  withDetails: number
}

/** The design chosen on the page (sent as query parameters). */
export interface IdCardDesign {
  template: IdCardTemplate
  fields: IdCardField[]
  logo: boolean
  layout: IdCardLayout
}
