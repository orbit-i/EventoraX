import {
  CalendarDays,
  Users,
  Mic2,
  Handshake,
  ListOrdered,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Events", href: "/dashboard/events", icon: CalendarDays },
  { label: "Registrations", href: "/dashboard/registrations", icon: Users },
  { label: "Speakers", href: "/dashboard/speakers", icon: Mic2 },
  { label: "Sponsors", href: "/dashboard/sponsors", icon: Handshake },
  { label: "Schedule", href: "/dashboard/schedule", icon: ListOrdered },
];