"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, buildQuery, ApiError } from "@/lib/api";
import { useDebouncedValue } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ExternalLink, Pencil, Trash2, UserPlus, Loader2 } from "lucide-react";
import type { Speaker, EventOption } from "@/types/speaker";

const LIMIT = 20;

function initials(firstName: string, lastName: string) {
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

export default function SpeakersPage() {
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>(
    () => searchParams.get("eventId") ?? ""
  );

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [page, setPage] = useState(1);

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Speaker | null>(null);
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
  }, [selectedEventId, debouncedSearch]);

  async function loadSpeakers() {
    if (!selectedEventId) {
      setSpeakers([]);
      setTotal(0);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const query = buildQuery({ eventId: selectedEventId, page, limit: LIMIT });
      const res = await api.getList<Speaker>(`/speakers${query}`);
      const filtered = debouncedSearch
        ? res.data.filter((s) =>
            (s.firstName + " " + s.lastName + " " + (s.company ?? "") + " " + (s.sessionTopic ?? ""))
              .toLowerCase()
              .includes(debouncedSearch.toLowerCase())
          )
        : res.data;
      setSpeakers(filtered.sort((a, b) => a.displayOrder - b.displayOrder));
      setTotal(res.meta.total);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load speakers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSpeakers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId, page]);

  useEffect(() => {
    loadSpeakers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/speakers/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadSpeakers();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete speaker.");
    } finally {
      setDeleting(false);
    }
  }

  const noEventSelected = !selectedEventId;

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Speakers</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={noEventSelected}
            render={<Link href={`/dashboard/speakers/reorder?eventId=${selectedEventId}`} />}
            nativeButton={false}
            className="flex-1 sm:flex-none"
          >
            Reorder
          </Button>
          <Button
            disabled={noEventSelected}
            render={<Link href={`/dashboard/speakers/new?eventId=${selectedEventId}`} />}
            nativeButton={false}
            className="gap-2 flex-1 sm:flex-none"
          >
            <UserPlus className="w-4 h-4" />
            Add Speaker
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
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

        <Input
          placeholder="Search name, company, topic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={noEventSelected}
          className="w-72"
        />
      </div>

      {noEventSelected ? (
        <div className="text-center text-muted-foreground py-16 border rounded-md">
          Select an event above to view its speakers.
        </div>
      ) : error ? (
        <div className="text-center text-red-600 py-16 border rounded-md">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading speakers...</span>
        </div>
      ) : speakers.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border rounded-md">
          No speakers yet for this event.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {speakers.map((s) => (
            <div
              key={s.id}
              className="border rounded-lg bg-white p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                {s.photo ? (
                  <img
                    src={s.photo}
                    alt={s.firstName + " " + s.lastName}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#f3f0ff] text-[#7c3aed] font-semibold flex items-center justify-center shrink-0">
                    {initials(s.firstName, s.lastName)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {[s.title, s.company].filter(Boolean).join(" - ") || "N/A"}
                  </p>
                </div>
                {s.displayPublic && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
                    Public
                  </span>
                )}
              </div>

              {s.sessionTopic && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Topic: </span>
                  {s.sessionTopic}
                </p>
              )}

              {s.bio && <p className="text-sm text-muted-foreground line-clamp-2">{s.bio}</p>}

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#e9e4ff]">
                {s.linkedin ? (
                  <a
                    href={s.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#7c3aed] hover:text-[#6d28d9]"
                    aria-label="LinkedIn"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <span />
                )}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    render={
                      <Link href={`/dashboard/speakers/${s.id}/edit?eventId=${selectedEventId}`} />
                    }
                    nativeButton={false}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(s)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
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
            <DialogTitle>Delete Speaker</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {deleteTarget?.firstName} {deleteTarget?.lastName}
            </span>
            ? This cannot be undone.
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