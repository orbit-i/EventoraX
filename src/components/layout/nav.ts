import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Building2,
  FileText,
  Gauge,
  Megaphone,
  ShieldCheck,
  Wallet,
  Wrench,
  Layers,
  UserCog,
  Award,
  BarChart3,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Handshake,
  Code2,
  IdCard,
  LayoutDashboard,
  LifeBuoy,
  ListOrdered,
  Mic2,
  ScanLine,
  Settings,
  Ticket,
  Users,
} from "lucide-react"
import type { Permission } from "@/lib/permissions"

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Only highlight on an exact match (for "/dashboard") */
  end?: boolean
  /** Hide from people without this permission */
  need?: Permission
}

export interface NavGroup {
  title?: string
  items: NavItem[]
}

/** The dashboard menu, in order. */
export const NAV: NavGroup[] = [
  { items: [{ to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true }] },
  {
    title: "Events",
    items: [
      { to: "/dashboard/events", label: "Events", icon: CalendarDays },
      { to: "/dashboard/registrations", label: "Registrations", icon: ClipboardList },
      { to: "/dashboard/speakers", label: "Speakers", icon: Mic2 },
      { to: "/dashboard/sponsors", label: "Sponsors", icon: Handshake },
      { to: "/dashboard/schedule", label: "Schedule", icon: ListOrdered },
    ],
  },
  {
    title: "Credentials",
    items: [
      { to: "/dashboard/certificates", label: "Certificates", icon: Award },
      { to: "/dashboard/tickets", label: "Tickets", icon: Ticket, end: true },
      { to: "/dashboard/tickets/scan", label: "Check-in scanner", icon: ScanLine, need: "write" },
      { to: "/dashboard/idcards", label: "ID cards", icon: IdCard },
    ],
  },
  {
    title: "Insights",
    items: [
      { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/dashboard/activity", label: "Activity log", icon: Activity, need: "manage" },
    ],
  },
  {
    title: "Organization",
    items: [
      { to: "/dashboard/team", label: "Team", icon: Users },
      { to: "/dashboard/billing", label: "Billing", icon: CreditCard, need: "manage" },
      { to: "/dashboard/api", label: "API", icon: Code2, need: "manage" },
      { to: "/dashboard/settings", label: "Settings", icon: Settings },
      { to: "/dashboard/contact", label: "Help & support", icon: LifeBuoy },
    ],
  },
]
/** The superadmin (platform owner) menu. */
export const SUPERADMIN_NAV: NavGroup[] = [
  { items: [{ to: "/superadmin", label: "Dashboard", icon: Gauge, end: true }] },
  {
    title: "Customers",
    items: [
      { to: "/superadmin/tenants", label: "Tenants", icon: Building2 },
      { to: "/superadmin/users", label: "Users", icon: UserCog },
      { to: "/superadmin/certificates", label: "Certificates", icon: Award },
    ],
  },
  {
    title: "Money",
    items: [
      { to: "/superadmin/revenue", label: "Revenue & payments", icon: Wallet },
      { to: "/superadmin/plans", label: "Plans & pricing", icon: Layers },
    ],
  },
  {
    title: "Insights",
    items: [
      { to: "/superadmin/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/superadmin/security", label: "Security & activity", icon: ShieldCheck },
    ],
  },
  {
    title: "Platform",
    items: [
      { to: "/superadmin/announcements", label: "Announcements", icon: Megaphone },
      { to: "/superadmin/emails", label: "Email templates", icon: FileText },
      { to: "/superadmin/settings", label: "System settings", icon: Settings },
      { to: "/superadmin/maintenance", label: "Maintenance", icon: Wrench },
    ],
  },
]
