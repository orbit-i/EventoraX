import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Award,
  BarChart3,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Handshake,
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
      { to: "/dashboard/settings", label: "Settings", icon: Settings },
      { to: "/dashboard/contact", label: "Help & support", icon: LifeBuoy },
    ],
  },
]