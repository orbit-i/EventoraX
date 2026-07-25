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
import { Globe, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import type { Sponsor, SponsorTier } from "@/types/sponsor";
import type { EventOption } from "@/types/registration";

const LIMIT = 20;

const TIER_STYLES: Record<SponsorTier, string> = {
  PLATINUM: "bg-slate-200 text-slate-800",
  GOLD: "bg-amber-100 text-amber-800",
  SILVER: "bg-gray-200 text-gray-700",
  BRONZE: "bg-orange-100 text-orange-800",
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/sponsors/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadSponsors();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete sponsor.");
    } finally {
      setDeleting(false);
    }
  }

  const noEventSelected = !selectedEventId;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sponsors</h1>
        <Button
          disabled={noEventSelected}
          render={<Link href={`/dashboard/sponsors/new?eventId=${selectedEventId}`} />}
          nativeButton={false}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Sponsor
        </Button>
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

        <Select
          value={tier}
          onValueChange={(v) => setTier((v ?? "ALL") as SponsorTier | "ALL")}
          disabled={noEventSelected}
        >
          <SelectTrigger className="w-44">
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
        <div className="text-center text-muted-foreground py-16 border rounded-md">
          Select an event above to view its sponsors.
        </div>
      ) : error ? (
        <div className="text-center text-red-600 py-16 border rounded-md">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading sponsors...</span>
        </div>
      ) : sponsors.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border rounded-md">
          No sponsors yet for this event.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sponsors.map((s) => (
            <div
              key={s.id}
              className="border rounded-lg bg-white p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                {s.logo ? (
                  <img
                    src={s.logo}
                    alt={s.name}
                    className="w-12 h-12 rounded-md object-contain border shrink-0 bg-white"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-[#f3f0ff] text-[#7c3aed] font-semibold flex items-center justify-center shrink-0">
                    {s.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{s.name}</p>
                  <span
                    className={"inline-block text-xs px-2 py-0.5 rounded-full mt-1 " + TIER_STYLES[s.tier]}
                  >
                    {s.tier}
                  </span>
                </div>
                {s.displayPublic && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
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
                    render={
                      <Link href={`/dashboard/sponsors/${s.id}/edit?eventId=${selectedEventId}`} />
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
            <DialogTitle>Delete Sponsor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This
            cannot be undone.
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