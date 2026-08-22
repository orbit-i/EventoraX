import { cn } from "@/lib/utils";
import {
  EVENT_MODE_LABELS,
  EVENT_STATUS_LABELS,
  EventMode,
  EventStatus,
} from "@/types/event";

const STATUS_STYLES: Record<EventStatus, { badge: string; dot: string }> = {
  DRAFT: { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  PUBLISHED: { badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  ONGOING: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  COMPLETED: { badge: "bg-[#f3f0ff] text-[#6d28d9] border-[#e9e4ff]", dot: "bg-[#7c3aed]" },
  ARCHIVED: { badge: "bg-slate-50 text-slate-400 border-slate-200", dot: "bg-slate-300" },
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        style.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {EVENT_STATUS_LABELS[status]}
    </span>
  );
}

export function EventModeBadge({ mode }: { mode: EventMode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
      {EVENT_MODE_LABELS[mode]}
    </span>
  );
}