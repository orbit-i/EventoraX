"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, buildQuery, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatTimeRange } from "@/lib/date";
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
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/Skeletons";
import { MapPin, Mic2, Pencil, Trash2, Plus, CalendarClock } from "lucide-react";
import type { Session } from "@/types/session";
import type { EventOption } from "@/types/registration";

const LIMIT = 20;

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
    <div className="p-6 space-y-5">
      <PageHeader
        title="Schedule"
        subtitle="Manage the session agenda for each event."
        actions={
          <>
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
          </>
        }
      />

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
        <EmptyState
          icon={CalendarClock}
          title="No event selected"
          description="Select an event above to view its schedule."
        />
      ) : error ? (
        <div className="text-center text-red-600 py-16 border rounded-md">{error}</div>
      ) : loading ? (
        <ListSkeleton count={4} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No sessions yet"
          description="Add your first session for this event."
          action={
            <Button
              size="sm"
              render={<Link href={`/dashboard/schedule/new?eventId=${selectedEventId}`} />}
              nativeButton={false}
            >
              Add Session
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-[#e9e4ff] bg-white p-4 flex items-center justify-between gap-4 transition-all duration-200 hover:shadow-md"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-900">{s.title}</p>
                  {s.displayPublic && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Public
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">{formatTimeRange(s.startTime, s.endTime)}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
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
            <span className="font-medium text-foreground">{deleteTarget?.title}</span>? This can't be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}