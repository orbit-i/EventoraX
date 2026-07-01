import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  json,
  boolean,
  decimal,
  date,
  time,
} from "drizzle-orm/mysql-core";

// ========================
// USERS (existing auth table)
// ========================
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ========================
// PLANS (Pro, Enterprise, etc.)
// ========================
export const plans = mysqlTable("plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  billingPeriod: mysqlEnum("billing_period", ["monthly", "yearly"]).default("yearly").notNull(),
  currency: varchar("currency", { length: 10 }).default("PKR").notNull(),
  maxAdmins: int("max_admins").default(3).notNull(),
  maxManagers: int("max_managers").default(7).notNull(),
  maxEvents: int("max_events").default(0).notNull(), // 0 = unlimited
  maxAttendees: int("max_attendees").default(0).notNull(),
  features: json("features").$type<string[]>(),
  isActive: boolean("is_active").default(true).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  trialDays: int("trial_days").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Plan = typeof plans.$inferSelect;

// ========================
// ORGANIZATIONS (Tenants)
// ========================
export const organizations = mysqlTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  logo: text("logo"),
  website: varchar("website", { length: 255 }),
  address: text("address"),
  primaryColor: varchar("primary_color", { length: 50 }).default("#3B82F6"),
  accentColor: varchar("accent_color", { length: 50 }).default("#60A5FA"),
  whiteLabelName: varchar("white_label_name", { length: 255 }),
  customDomain: varchar("custom_domain", { length: 255 }),
  planId: bigint("plan_id", { mode: "number", unsigned: true }).references(() => plans.id),
  status: mysqlEnum("status", ["trial", "active", "expired", "suspended"]).default("trial").notNull(),
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Organization = typeof organizations.$inferSelect;

// ========================
// ORGANIZATION MEMBERS
// ========================
export const organizationMembers = mysqlTable("organization_members", {
  id: serial("id").primaryKey(),
  organizationId: bigint("organization_id", { mode: "number", unsigned: true }).notNull().references(() => organizations.id),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id),
  role: mysqlEnum("org_role", ["admin", "manager", "viewer"]).default("manager").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  invitedBy: bigint("invited_by", { mode: "number", unsigned: true }).references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ========================
// EVENTS
// ========================
export const events = mysqlTable("events", {
  id: serial("id").primaryKey(),
  organizationId: bigint("organization_id", { mode: "number", unsigned: true }).notNull().references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  mode: mysqlEnum("mode", ["physical", "online", "hybrid"]).default("physical").notNull(),
  description: text("description"),
  topic: varchar("topic", { length: 255 }),
  categories: json("categories").$type<string[]>(),
  venue: varchar("venue", { length: 255 }),
  meetingLink: text("meeting_link"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  startTime: time("start_time"),
  endTime: time("end_time"),
  organizer: varchar("organizer", { length: 255 }),
  maxAttendees: int("max_attendees").default(0),
  ticketPrice: decimal("ticket_price", { precision: 10, scale: 2 }).default("0"),
  certificateTemplateId: int("certificate_template_id"),
  autoIssueCert: boolean("auto_issue_cert").default(false),
  registrationOpen: boolean("registration_open").default(true).notNull(),
  status: mysqlEnum("event_status", ["draft", "upcoming", "active", "completed", "archived"]).default("draft").notNull(),
  image: text("image"),
  createdBy: bigint("created_by", { mode: "number", unsigned: true }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Event = typeof events.$inferSelect;

// ========================
// REGISTRATIONS / ATTENDEES
// ========================
export const registrations = mysqlTable("registrations", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number", unsigned: true }).notNull().references(() => events.id),
  organizationId: bigint("organization_id", { mode: "number", unsigned: true }).notNull().references(() => organizations.id),
  refNo: varchar("ref_no", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  department: varchar("department", { length: 255 }),
  rollNo: varchar("roll_no", { length: 100 }),
  category: mysqlEnum("category", ["general", "vip", "speaker", "sponsor", "student", "staff"]).default("general").notNull(),
  status: mysqlEnum("reg_status", ["registered", "attended", "absent", "cancelled"]).default("registered").notNull(),
  registeredVia: mysqlEnum("registered_via", ["web", "csv", "manual"]).default("web").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Registration = typeof registrations.$inferSelect;

// ========================
// CERTIFICATES
// ========================
export const certificates = mysqlTable("certificates", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number", unsigned: true }).notNull().references(() => events.id),
  organizationId: bigint("organization_id", { mode: "number", unsigned: true }).notNull().references(() => organizations.id),
  registrationId: bigint("registration_id", { mode: "number", unsigned: true }).references(() => registrations.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  organizationName: varchar("organization_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  issueDate: date("issue_date").notNull(),
  verifyCode: varchar("verify_code", { length: 64 }).notNull().unique(),
  sha256Hash: varchar("sha256_hash", { length: 64 }).notNull(),
  templateId: int("template_id").default(1),
  status: mysqlEnum("cert_status", ["active", "revoked"]).default("active").notNull(),
  revokeReason: text("revoke_reason"),
  downloadCount: int("download_count").default(0),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Certificate = typeof certificates.$inferSelect;

// ========================
// TICKETS (QR Tickets)
// ========================
export const tickets = mysqlTable("tickets", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number", unsigned: true }).notNull().references(() => events.id),
  organizationId: bigint("organization_id", { mode: "number", unsigned: true }).notNull().references(() => organizations.id),
  registrationId: bigint("registration_id", { mode: "number", unsigned: true }).notNull().references(() => registrations.id),
  ticketNo: varchar("ticket_no", { length: 50 }).notNull().unique(),
  attendeeName: varchar("attendee_name", { length: 255 }).notNull(),
  eventName: varchar("event_name", { length: 255 }).notNull(),
  type: mysqlEnum("ticket_type", ["free", "paid", "vip"]).default("free").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  usedAt: timestamp("used_at"),
  qrCode: text("qr_code"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Ticket = typeof tickets.$inferSelect;

// ========================
// SPEAKERS
// ========================
export const speakers = mysqlTable("speakers", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number", unsigned: true }).notNull().references(() => events.id),
  organizationId: bigint("organization_id", { mode: "number", unsigned: true }).notNull().references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  company: varchar("company", { length: 255 }),
  topic: varchar("topic", { length: 255 }),
  bio: text("bio"),
  photo: text("photo"),
  linkedIn: varchar("linkedin", { length: 255 }),
  displayOrder: int("display_order").default(0),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Speaker = typeof speakers.$inferSelect;

// ========================
// SPONSORS
// ========================
export const sponsors = mysqlTable("sponsors", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number", unsigned: true }).notNull().references(() => events.id),
  organizationId: bigint("organization_id", { mode: "number", unsigned: true }).notNull().references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  logo: text("logo"),
  website: varchar("website", { length: 255 }),
  tier: mysqlEnum("tier", ["platinum", "gold", "silver", "bronze"]).default("bronze").notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Sponsor = typeof sponsors.$inferSelect;

// ========================
// SCHEDULES / AGENDA
// ========================
export const schedules = mysqlTable("schedules", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number", unsigned: true }).notNull().references(() => events.id),
  organizationId: bigint("organization_id", { mode: "number", unsigned: true }).notNull().references(() => organizations.id),
  title: varchar("title", { length: 255 }).notNull(),
  speakerId: bigint("speaker_id", { mode: "number", unsigned: true }).references(() => speakers.id),
  speakerName: varchar("speaker_name", { length: 255 }),
  timeStart: time("time_start").notNull(),
  timeEnd: time("time_end").notNull(),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  displayOrder: int("display_order").default(0),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Schedule = typeof schedules.$inferSelect;

// ========================
// PAYMENTS
// ========================
export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  organizationId: bigint("organization_id", { mode: "number", unsigned: true }).notNull().references(() => organizations.id),
  planId: bigint("plan_id", { mode: "number", unsigned: true }).notNull().references(() => plans.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("PKR").notNull(),
  method: mysqlEnum("method", ["jazzcash", "easypaisa", "bank_transfer", "card"]).default("jazzcash").notNull(),
  status: mysqlEnum("payment_status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  transactionRef: varchar("transaction_ref", { length: 255 }),
  notes: text("notes"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Payment = typeof payments.$inferSelect;

// ========================
// ACTIVITY LOGS
// ========================
export const activityLogs = mysqlTable("activity_logs", {
  id: serial("id").primaryKey(),
  organizationId: bigint("organization_id", { mode: "number", unsigned: true }).references(() => organizations.id),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  userName: varchar("user_name", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: bigint("entity_id", { mode: "number", unsigned: true }),
  details: json("details"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;

// ========================
// EMAIL TEMPLATES
// ========================
export const emailTemplates = mysqlTable("email_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  isSystem: boolean("is_system").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;

// ========================
// SYSTEM SETTINGS
// ========================
export const systemSettings = mysqlTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  category: varchar("category", { length: 100 }).default("general").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type SystemSetting = typeof systemSettings.$inferSelect;

// ========================
// ANNOUNCEMENTS
// ========================
export const announcements = mysqlTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  target: mysqlEnum("target", ["all", "pro", "enterprise", "specific"]).default("all").notNull(),
  targetOrgs: json("target_orgs").$type<number[]>(),
  isEmail: boolean("is_email").default(true).notNull(),
  isInApp: boolean("is_in_app").default(true).notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  status: mysqlEnum("announcement_status", ["draft", "scheduled", "sent"]).default("draft").notNull(),
  createdBy: bigint("created_by", { mode: "number", unsigned: true }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Announcement = typeof announcements.$inferSelect;
