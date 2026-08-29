"use client";
import { PageHeader } from "@/components/shared/PageHeader";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, CalendarDays, Rocket, Radio, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventsFilters, EventsFiltersValue } from "@/components/events/EventsFilters";
import { EventsTable } from "@/components/events/EventsTable";
import { Pagination } from "@/components/layout/Pagination";
import { StatCard, StatCardSkeleton } from "@/components/shared/StatCard";
import { api, ApiError, buildQuery } from "@/lib/api";
import { useDebouncedValue } from "@/lib/hooks";
import { EventItem } from "@/types/event";

const LIMIT = 20;

export default function EventsListPage() {
  const [filters, setFilters] = useState<EventsFiltersValue>({
    search: "",
    status: "ALL",
    mode: "ALL",
  });
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const [stats, setStats] = useState<{
    total: number;
    published: number;
    ongoing: number;
    completed: number;
  } | null>(null);

  const debouncedSearch = useDebouncedValue(filters.search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status, filters.mode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const query = buildQuery({
      search: debouncedSearch || undefined,
      status: filters.status === "ALL" ? undefined : filters.status,
      mode: filters.mode === "ALL" ? undefined : filters.mode,
      page,
      limit: LIMIT,
    });

    api
      .getList<EventItem>(`/events${query}`)
      .then((result) => {
        if (cancelled) return;
        setEvents(result.data);
        setTotal(result.meta.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Couldn't load events. Check your connection and try again."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, filters.status, filters.mode, page, refetchKey]);

  // Lightweight parallel count-only fetches for the stats strip.
  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const [all, published, ongoing, completed] = await Promise.all([
          api.getList<EventItem>(`/events${buildQuery({ limit: 1 })}`),
          api.getList<EventItem>(`/events${buildQuery({ status: "PUBLISHED", limit: 1 })}`),
          api.getList<EventItem>(`/events${buildQuery({ status: "ONGOING", limit: 1 })}`),
          api.getList<EventItem>(`/events${buildQuery({ status: "COMPLETED", limit: 1 })}`),
        ]);
        if (cancelled) return;
        setStats({
          total: all.meta.total,
          published: published.meta.total,
          ongoing: ongoing.meta.total,
          completed: completed.meta.total,
        });
      } catch {
        // Stats strip is a nice-to-have; fail silently if it errors.
      }
    }
    loadStats();
    return () => {
      cancelled = true;
    };
  }, [refetchKey]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Events"
        subtitle="Manage every event in one place."
        actions={
          <Button
            className="bg-[#7c3aed] hover:bg-[#6d28d9] w-full sm:w-auto"
            nativeButton={false}
            render={
              <Link href="/dashboard/events/new">
                <Plus className="mr-1.5 h-4 w-4" /> Create event
              </Link>
            }
          />
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats ? (
          <>
            <StatCard label="Total events" value={stats.total} icon={CalendarDays} accent="purple" />
            <StatCard label="Upcoming" value={stats.published} icon={Rocket} accent="blue" />
            <StatCard label="Ongoing" value={stats.ongoing} icon={Radio} accent="emerald" />
            <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} accent="slate" />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        )}
      </div>

      <EventsFilters value={filters} onChange={setFilters} />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          <EventsTable
            events={events}
            loading={loading}
            onChanged={() => setRefetchKey((k) => k + 1)}
          />
          {!loading && (
            <Pagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}