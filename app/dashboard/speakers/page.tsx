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
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/shared/Avatar";
import { StatCard, StatCardSkeleton } from "@/components/shared/StatCard";
import { CardGridSkeleton, EmptyState } from "@/components/shared/EmptyState";
import { ExternalLink, Pencil, Trash2, UserPlus, Users, Eye } from "lucide-react";
import type { Speaker, EventOption } from "@/types/speaker";

const LIMIT = 20;

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

  const [stats, setStats] = useState<{ total: number; public: number } | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

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

  // Stats strip — real event-wide counts (not just the current page),
  // refreshed whenever refetchKey bumps (i.e. after a delete).
  useEffect(() => {
    if (!selectedEventId) {
      setStats(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [all, publicRes] = await Promise.all([
          api.getList<Speaker>(`/speakers${buildQuery({ eventId: selectedEventId, limit: 1 })}`),
          api.getList<Speaker>(
            `/speakers${buildQuery({ eventId: selectedEventId, displayPublic: "true", limit: 1 })}`
          ),
        ]);
        if (cancelled) return;
        setStats({ total: all.meta.total, public: publicRes.meta.total });
      } catch {
        // Non-critical — skip stats silently on error.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedEventId, refetchKey]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/speakers/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadSpeakers();
      setRefetchKey((k) => k + 1);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete speaker.");
    } finally {
      setDeleting(false);
    }
  }

  const noEventSelected = !selectedEventId;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Speakers"
        subtitle="Manage speakers for each event."
        actions={
          <>
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
          </>
        }
      />

      {!noEventSelected && (
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          {stats ? (
            <>
              <StatCard label="Total speakers" value={stats.total} icon={Users} accent="purple" />
              <StatCard label="Public" value={stats.public} icon={Eye} accent="blue" />
            </>
          ) : (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={selectedEventId} onValueChange={(v) => setSelectedEventId(v ?? "")}>
          <SelectTrigger className="w-full sm:w-64">
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
          className="w-full sm:w-72"
        />
      </div>

      {noEventSelected ? (
        <EmptyState
          icon={Users}
          title="No event selected"
          description="Select an event above to view its speakers."
        />
      ) : error ? (
        <div className="text-center text-red-600 py-16 border rounded-md">{error}</div>
      ) : loading ? (
        <CardGridSkeleton count={6} />
      ) : speakers.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No speakers yet"
          description="Add your first speaker for this event."
          action={
            <Button
              size="sm"
              render={<Link href={`/dashboard/speakers/new?eventId=${selectedEventId}`} />}
              nativeButton={false}
            >
              Add Speaker
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {speakers.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-[#e9e4ff] bg-white p-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3">
                <Avatar name={`${s.firstName} ${s.lastName}`} src={s.photo} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-sm text-slate-500 truncate">
                    {[s.title, s.company].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                {s.displayPublic && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    Public
                  </span>
                )}
              </div>

              {s.sessionTopic && (
                <p className="text-sm text-slate-600">
                  <span className="text-slate-400">Topic: </span>
                  {s.sessionTopic}
                </p>
              )}

              {s.bio && <p className="text-sm text-slate-500 line-clamp-2">{s.bio}</p>}

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
                    render={<Link href={`/dashboard/speakers/${s.id}/edit?eventId=${selectedEventId}`} />}
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
            <Button onClick={confirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
