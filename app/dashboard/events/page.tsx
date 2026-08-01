"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventsFilters, EventsFiltersValue } from "@/components/events/EventsFilters";
import { EventsTable } from "@/components/events/EventsTable";
import { Pagination } from "@/components/layout/Pagination";
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

  const debouncedSearch = useDebouncedValue(filters.search, 400);

  // Reset to page 1 whenever filters change.
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Events</h2>
          <p className="text-sm text-slate-500">
            Manage every event in one place.
          </p>
        </div>
        <Button
          className="bg-[#7c3aed] hover:bg-[#6d28d9] w-full sm:w-auto"
          nativeButton={false}
          render={
          <Link href="/dashboard/events/new">
          <Plus className="mr-1.5 h-4 w-4" /> Create event
          </Link>
          }
        />
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
            <Pagination
              page={page}
              limit={LIMIT}
              total={total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
