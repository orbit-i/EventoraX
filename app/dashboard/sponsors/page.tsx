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
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/shared/Avatar";
import { StatCard, StatCardSkeleton } from "@/components/shared/StatCard";
import { CardGridSkeleton, EmptyState } from "@/components/shared/EmptyState";
import { Globe, Pencil, Trash2, Plus, Handshake, Medal, Award, Eye } from "lucide-react";
import type { Sponsor, SponsorTier } from "@/types/sponsor";
import type { EventOption } from "@/types/registration";

const LIMIT = 20;

const TIER_STYLES: Record<SponsorTier, string> = {
  PLATINUM: "bg-slate-100 text-slate-700 border border-slate-200",
  GOLD: "bg-amber-50 text-amber-700 border border-amber-200",
  SILVER: "bg-gray-100 text-gray-600 border border-gray-200",
  BRONZE: "bg-orange-50 text-orange-700 border border-orange-200",
};

const TIER_OPTIONS: { value: SponsorTier | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Tiers" },
  { value: "PLATINUM", label: "Platinum" },
  { value: "GOLD", label: "Gold" },
  { value: "SILVER", label: "Silver" },
  { value: "BRONZE", label: "Bronze" },
];

export default function SponsorsPage() {
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>(
    () => searchParams.get("eventId") ?? ""
  );

  const [tier, setTier] = useState<SponsorTier | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<{
    total: number;
    public: number;
    platinum: number;
    gold: number;
  } | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<Sponsor | null>(null);
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
  }, [selectedEventId, tier]);

  async function loadSponsors() {
    if (!selectedEventId) {
      setSponsors([]);
      setTotal(0);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const query = buildQuery({
        eventId: selectedEventId,
        tier: tier === "ALL" ? undefined : tier,
        page,
        limit: LIMIT,
      });
      const res = await api.getList<Sponsor>(`/sponsors${query}`);
      setSponsors(res.data.sort((a, b) => a.displayOrder - b.displayOrder));
      setTotal(res.meta.total);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load sponsors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSponsors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId, tier, page]);

  // Stats strip — total, public-facing, and each headline tier shown as
  // its own card (never lumped together). Depends on refetchKey so it
  // never goes stale after a delete.
  useEffect(() => {
    if (!selectedEventId) {
      setStats(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [all, publicRes, platinum, gold] = await Promise.all([
          api.getList<Sponsor>(`/sponsors${buildQuery({ eventId: selectedEventId, limit: 1 })}`),
          api.getList<Sponsor>(
            `/sponsors${buildQuery({ eventId: selectedEventId, displayPublic: "true", limit: 1 })}`
          ),
          api.getList<Sponsor>(
            `/sponsors${buildQuery({ eventId: selectedEventId, tier: "PLATINUM", limit: 1 })}`
          ),
          api.getList<Sponsor>(
            `/sponsors${buildQuery({ eventId: selectedEventId, tier: "GOLD", limit: 1 })}`
          ),
        ]);
        if (cancelled) return;
        setStats({
          total: all.meta.total,
          public: publicRes.meta.total,
          platinum: platinum.meta.total,
          gold: gold.meta.total,
        });
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
      await api.delete(`/sponsors/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadSponsors();
      setRefetchKey((k) => k + 1);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete sponsor.");
    } finally {
      setDeleting(false);
    }
  }

  const noEventSelected = !selectedEventId;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sponsors"
        subtitle="Manage sponsors for each event."
        actions={
          <Button
            disabled={noEventSelected}
            render={<Link href={`/dashboard/sponsors/new?eventId=${selectedEventId}`} />}
            nativeButton={false}
            className="gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Sponsor
          </Button>
        }
      />

      {!noEventSelected && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats ? (
            <>
              <StatCard label="Total sponsors" value={stats.total} icon={Handshake} accent="purple" />
              <StatCard label="Public" value={stats.public} icon={Eye} accent="emerald" />
              <StatCard label="Platinum" value={stats.platinum} icon={Medal} accent="slate" />
              <StatCard label="Gold" value={stats.gold} icon={Award} accent="blue" />
            </>
          ) : (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
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

        <Select
          value={tier}
          onValueChange={(v) => setTier((v ?? "ALL") as SponsorTier | "ALL")}
          disabled={noEventSelected}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            {TIER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {noEventSelected ? (
        <EmptyState
          icon={Handshake}
          title="No event selected"
          description="Select an event above to view its sponsors."
        />
      ) : error ? (
        <div className="text-center text-red-600 py-16 border rounded-md">{error}</div>
      ) : loading ? (
        <CardGridSkeleton count={6} />
      ) : sponsors.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No sponsors yet"
          description="Add your first sponsor for this event."
          action={
            <Button
              size="sm"
              render={<Link href={`/dashboard/sponsors/new?eventId=${selectedEventId}`} />}
              nativeButton={false}
            >
              Add Sponsor
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sponsors.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-[#e9e4ff] bg-white p-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3">
                <Avatar name={s.name} src={s.logo} shape="square" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{s.name}</p>
                  <span
                    className={"inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-medium " + TIER_STYLES[s.tier]}
                  >
                    {s.tier}
                  </span>
                </div>
                {s.displayPublic && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    Public
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#e9e4ff]">
                {s.website ? (
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#7c3aed] hover:text-[#6d28d9]"
                    aria-label="Website"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                ) : (
                  <span />
                )}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    render={<Link href={`/dashboard/sponsors/${s.id}/edit?eventId=${selectedEventId}`} />}
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
            <DialogTitle>Delete Sponsor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This cannot be undone.
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
