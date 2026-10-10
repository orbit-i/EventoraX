// Shapes returned by the registrations API (/api/v1/registrations).

export type RegistrationStatus = "REGISTERED" | "ATTENDED" | "ABSENT" | "CANCELLED"
export type RegisteredVia = "WEB" | "ADMIN" | "CSV_IMPORT" | "API"

export interface Registration {
  id: string
  eventId: string
  categoryId: string | null
  refNo: string
  name: string
  email: string
  phone: string | null
  department: string | null
  rollNo: string | null
  registeredVia: RegisteredVia
  status: RegistrationStatus
  registrationDate: string
  createdAt: string
  updatedAt: string
  category: { id: string; label: string } | null
  ticket: { id: string; ticketNo: string; isUsed: boolean; usedAt: string | null } | null
}

export type BulkAction = "mark_attended" | "mark_absent" | "mark_registered" | "cancel" | "restore" | "delete"

export interface BulkResult {
  action: BulkAction
  requested: number
  affected: number
  skipped: number
}

/** POST /registrations/csv-import/parse */
export interface CsvParseResult {
  headers: string[]
  preview: string[][]
  totalRows: number
  rows: string[][]
}

export interface CsvImportRow {
  name?: string
  email?: string
  phone?: string
  department?: string
  rollNo?: string
  categoryLabel?: string
}

export type DuplicateStrategy = "first" | "last" | "skip"

export interface ImportIssue {
  row: number
  email: string
  name: string
  reason: string
}

/** POST /registrations/csv-import/confirm (dry run and real import) */
export interface CsvImportReport {
  dryRun: boolean
  total: number
  duplicateStrategy: DuplicateStrategy
  seatsLeft: number | null
  errors: ImportIssue[]
  duplicateGroups: { email: string; rows: number[]; keptRow: number | null }[]
  nameWarnings: { name: string; rows: number[]; emails: string[]; alsoRegistered: boolean }[]
  categoryWarnings: { row: number; email: string; categoryLabel: string }[]
  categoriesToCreate: string[]
  willImport: number
  willSkip: number
  inserted: number
  skipped: number
}
