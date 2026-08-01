"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, buildQuery, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/layout/Pagination";
import { MapPin, Mic2, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import type { Session } from "@/types/session";
import type { EventOption } from "@/types/registration";

const LIMIT = 20;

function formatTimeRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay = s.toDateString() === e.toDateString();
  const dateStr = s.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeFmt = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return sameDay
    ? `${dateStr} · ${timeFmt(s)} – ${timeFmt(e)}`
    : `${dateStr} ${timeFmt(s)} – ${e.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${timeFmt(e)}`;
}

export default function SchedulePage() {
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>(
    () => searchParams.get("eventId") ?? ""
  );

  const [page, setPage] = useState(1);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setEventsLoading(true);
        const res = await api.getList<EventOption>(`/events${buildQuery({ limit: 100 })}`);
        setEvents(res.data);
      } catch (err) {
        console.error("Failed to load events", err);
      } finally {
        setEventsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [selectedEventId]);

  async function loadSessions() {
    if (!selectedEventId) {
      setSessions([]);
      setTotal(0);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const query = buildQuery({ eventId: selectedEventId, page, limit: LIMIT });
      const res = await api.getList<Session>(`/sessions${query}`);
      setSessions(res.data.sort((a, b) => a.displayOrder - b.displayOrder));
      setTotal(res.meta.total);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId, page]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/sessions/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadSessions();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete session.");
    } finally {
      setDeleting(false);
    }
  }

  const noEventSelected = !selectedEventId;

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Schedule</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={noEventSelected}
            render={<Link href={`/dashboard/schedule/reorder?eventId=${selectedEventId}`} />}
            nativeButton={false}
            className="flex-1 sm:flex-none"
          >
            Reorder
          </Button>
          <Button
            disabled={noEventSelected}
            render={<Link href={`/dashboard/schedule/new?eventId=${selectedEventId}`} />}
            nativeButton={false}
            className="gap-2 flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            Add Session
          </Button>
        </div>
      </div>

      <Select value={selectedEventId} onValueChange={(v) => setSelectedEventId(v ?? "")}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder={eventsLoading ? "Loading events..." : "Select an event"} />
        </SelectTrigger>
        <SelectContent>
          {events.map((ev) => (
            <SelectItem key={ev.id} value={ev.id}>
              {ev.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {noEventSelected ? (
        <div className="text-center text-muted-foreground py-16 border rounded-md">
          Select an event above to view its schedule.
        </div>
      ) : error ? (
        <div className="text-center text-red-600 py-16 border rounded-md">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading schedule...
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border rounded-md">
          No sessions yet for this event.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="border rounded-lg bg-white p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{s.title}</p>
                  {s.displayPublic && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Public
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatTimeRange(s.startTime, s.endTime)}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {s.speaker && (
                    <span className="flex items-center gap-1">
                      <Mic2 className="w-3.5 h-3.5" />
                      {s.speaker.firstName} {s.speaker.lastName}
                    </span>
                  )}
                  {s.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {s.location}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  render={<Link href={`/dashboard/schedule/${s.id}/edit?eventId=${selectedEventId}`} />}
                  nativeButton={false}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(s)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!noEventSelected && total > LIMIT && (
        <Pagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{deleteTarget?.title}</span>? This
            can't be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}