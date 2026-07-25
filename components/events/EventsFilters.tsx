"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_MODE_LABELS, EVENT_STATUS_LABELS, EventMode, EventStatus } from "@/types/event";

export interface EventsFiltersValue {
  search: string;
  status: EventStatus | "ALL";
  mode: EventMode | "ALL";
}

export function EventsFilters({
  value,
  onChange,
}: {
  value: EventsFiltersValue;
  onChange: (next: EventsFiltersValue) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search events by name..."
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          className="pl-9"
        />
      </div>

      <Select
        value={value.status}
        onValueChange={(status) =>
          onChange({ ...value, status: status as EventStatus | "ALL" })
        }
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {(Object.keys(EVENT_STATUS_LABELS) as EventStatus[]).map((status) => (
            <SelectItem key={status} value={status}>
              {EVENT_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.mode}
        onValueChange={(mode) =>
          onChange({ ...value, mode: mode as EventMode | "ALL" })
        }
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All modes</SelectItem>
          {(Object.keys(EVENT_MODE_LABELS) as EventMode[]).map((mode) => (
            <SelectItem key={mode} value={mode}>
              {EVENT_MODE_LABELS[mode]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
