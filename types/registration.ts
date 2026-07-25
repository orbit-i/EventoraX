export type RegistrationStatus = "REGISTERED" | "ATTENDED" | "ABSENT" | "CANCELLED";
export type RegisteredVia = "WEB" | "ADMIN" | "CSV_IMPORT" | "API";

export interface RegistrationCategory {
  id: string;
  label: string;
}

export interface Registration {
  id: string;
  tenantId: string;
  eventId: string;
  categoryId: string | null;
  refNo: string;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  rollNo: string | null;
  registeredVia: RegisteredVia;
  status: RegistrationStatus;
  registrationDate: string;
  ticketId: string | null;
  createdAt: string;
  updatedAt: string;
  category?: RegistrationCategory | null;
}

export interface EventOption {
  id: string;
  title: string;
}

export interface CategoryOption {
  id: string;
  label: string;
}

export interface CsvParseResult {
  headers: string[];
  preview: string[][];
  totalRows: number;
}

export interface CsvImportRow {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  rollNo?: string;
  categoryLabel?: string;
}

export interface CsvImportResult {
  inserted: number;
  skipped: number;
  total: number;
  errors: { row: number; email: string; reason: string }[];
}
