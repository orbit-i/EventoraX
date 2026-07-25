import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  EVENT_MODE_LABELS,
  EVENT_STATUS_LABELS,
  EventMode,
  EventStatus,
} from "@/types/event";

const STATUS_STYLES: Record<EventStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  PUBLISHED: "bg-blue-50 text-blue-700 border-blue-200",
  ONGOING: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-[#f3f0ff] text-[#6d28d9] border-[#e9e4ff]",
  ARCHIVED: "bg-slate-50 text-slate-400 border-slate-200",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", STATUS_STYLES[status])}
    >
      {EVENT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function EventModeBadge({ mode }: { mode: EventMode }) {
  return (
    <Badge variant="outline" className="border-slate-200 text-slate-600">
      {EVENT_MODE_LABELS[mode]}
    </Badge>
  );
}
