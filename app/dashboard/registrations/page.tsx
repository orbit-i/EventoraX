"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, buildQuery } from "@/lib/api";
import { useDebouncedValue } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/layout/Pagination";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard, StatCardSkeleton } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeletonRows } from "@/components/shared/Skeletons";
import { Users, UserCheck, UserX, ClipboardList, XCircle } from "lucide-react";
import type {
  Registration,
  RegistrationStatus,
  EventOption,
  CategoryOption,
} from "@/types/registration";

const STATUS_OPTIONS: { value: RegistrationStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "REGISTERED", label: "Registered" },
  { value: "ATTENDED", label: "Attended" },
  { value: "ABSENT", label: "Absent" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_BADGE_VARIANT: Record<RegistrationStatus, string> = {
  REGISTERED: "bg-blue-50 text-blue-700 border border-blue-200",
  ATTENDED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  ABSENT: "bg-red-50 text-red-700 border border-red-200",
  CANCELLED: "bg-slate-100 text-slate-500 border border-slate-200",
};

const LIMIT = 20;

export default function RegistrationsPage() {
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>(
    () => searchParams.get("eventId") ?? ""
  );

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState<string>("ALL");

  const [status, setStatus] = useState<RegistrationStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const [page, setPage] = useState(1);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<{
    total: number;
    attended: number;
    absent: number;
    cancelled: number;
  } | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [attendanceLoadingId, setAttendanceLoadingId] = useState<string | null>(null);

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
    if (!selectedEventId) {
      setCategories([]);
      setCategoryId("ALL");
      return;
    }
    (async () => {
      try {
        const res = await api.getList<CategoryOption>(
          `/categories${buildQuery({ eventId: selectedEventId })}`
        );
        setCategories(res.data);
        setCategoryId("ALL");
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    })();
  }, [selectedEventId]);

  useEffect(() => {
    setPage(1);
  }, [selectedEventId, status, categoryId, debouncedSearch]);

  async function loadRegistrations() {
    if (!selectedEventId) {
      setRegistrations([]);
      setTotal(0);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const query = buildQuery({
        eventId: selectedEventId,
        status: status === "ALL" ? undefined : status,
        categoryId: categoryId === "ALL" ? undefined : categoryId,
        search: debouncedSearch || undefined,
        page,
        limit: LIMIT,
      });
      const res = await api.getList<Registration>(`/registrations${query}`);
      setRegistrations(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      console.error("Failed to load registrations", err);
      setError(err?.message ?? "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId, status, categoryId, debouncedSearch, page]);

  // Stats strip — parallel counts for the selected event. Depends on
  // refetchKey so it never goes stale after attendance/bulk actions.
  useEffect(() => {
    if (!selectedEventId) {
      setStats(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [all, attended, absent, cancelledRes] = await Promise.all([
          api.getList<Registration>(`/registrations${buildQuery({ eventId: selectedEventId, limit: 1 })}`),
          api.getList<Registration>(
            `/registrations${buildQuery({ eventId: selectedEventId, status: "ATTENDED", limit: 1 })}`
          ),
          api.getList<Registration>(
            `/registrations${buildQuery({ eventId: selectedEventId, status: "ABSENT", limit: 1 })}`
          ),
          api.getList<Registration>(
            `/registrations${buildQuery({ eventId: selectedEventId, status: "CANCELLED", limit: 1 })}`
          ),
        ]);
        if (cancelled) return;
        setStats({
          total: all.meta.total,
          attended: attended.meta.total,
          absent: absent.meta.total,
          cancelled: cancelledRes.meta.total,
        });
      } catch {
        // Non-critical — skip stats silently on error.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedEventId, refetchKey]);

  const noEventSelected = !selectedEventId;

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      registrations.forEach((r) => next.add(r.id));
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const allOnPageSelected =
    registrations.length > 0 && registrations.every((r) => selectedIds.has(r.id));

  async function markAttendance(id: string, newStatus: "ATTENDED" | "ABSENT") {
    setAttendanceLoadingId(id);
    try {
      await api.patch(`/registrations/${id}/attendance`, { status: newStatus });
      await loadRegistrations();
      setRefetchKey((k) => k + 1);
    } catch (err: any) {
      alert(err?.message ?? "Failed to update attendance.");
    } finally {
      setAttendanceLoadingId(null);
    }
  }

  async function handleBulkMarkAttended() {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      await api.post("/registrations/bulk", {
        action: "mark_attended",
        ids: Array.from(selectedIds),
      });
      clearSelection();
      await loadRegistrations();
      setRefetchKey((k) => k + 1);
    } catch (err: any) {
      alert(err?.message ?? "Bulk action failed.");
    } finally {
      setBulkActionLoading(false);
    }
  }

  function handleBulkExport() {
    if (!selectedEventId) return;
    const idsParam = selectedIds.size > 0 ? Array.from(selectedIds).join(",") : undefined;
    const url = api.rawUrl(
      `/registrations/export${buildQuery({
        eventId: selectedEventId,
        format: "csv",
        status: status === "ALL" ? undefined : status,
        ids: idsParam,
      })}`
    );
    window.location.href = url;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Registrations"
        subtitle="View and manage attendee registrations."
        actions={
          <>
            <Button
              variant="outline"
              disabled={noEventSelected}
              render={<Link href={`/dashboard/registrations/import?eventId=${selectedEventId}`} />}
              nativeButton={false}
              className="flex-1 sm:flex-none"
            >
              Import CSV
            </Button>
            <Button
              disabled={noEventSelected}
              render={<Link href={`/dashboard/registrations/new?eventId=${selectedEventId}`} />}
              nativeButton={false}
              className="flex-1 sm:flex-none"
            >
              Add Attendee
            </Button>
          </>
        }
      />

      {!noEventSelected && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats ? (
            <>
              <StatCard label="Total" value={stats.total} icon={ClipboardList} accent="purple" />
              <StatCard label="Attended" value={stats.attended} icon={UserCheck} accent="emerald" />
              <StatCard label="Absent" value={stats.absent} icon={UserX} accent="slate" />
              <StatCard label="Cancelled" value={stats.cancelled} icon={XCircle} accent="blue" />
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
          value={status}
          onValueChange={(v) => setStatus((v ?? "ALL") as RegistrationStatus | "ALL")}
          disabled={noEventSelected}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryId}
          onValueChange={(v) => setCategoryId(v ?? "ALL")}
          disabled={noEventSelected || categories.length === 0}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search name, email, ref no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={noEventSelected}
          className="w-full sm:w-64"
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#f3f0ff] border border-[#e9e4ff]">
          <span className="text-sm font-medium text-slate-700">{selectedIds.size} selected</span>
          <Button size="sm" onClick={handleBulkMarkAttended} disabled={bulkActionLoading}>
            {bulkActionLoading ? "Working..." : "Mark Attended"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkExport}>
            Export Selected
          </Button>
          <Button size="sm" variant="ghost" onClick={clearSelection}>
            Clear Selection
          </Button>
        </div>
      )}

      {noEventSelected ? (
        <EmptyState
          icon={Users}
          title="No event selected"
          description="Select an event above to view its registrations."
        />
      ) : error ? (
        <div className="text-center text-red-600 py-16 border rounded-md">{error}</div>
      ) : (
        <div className="rounded-xl border border-[#e9e4ff] bg-white overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allOnPageSelected}
                    onCheckedChange={(checked) => (checked ? selectAllOnPage() : clearSelection())}
                  />
                </TableHead>
                <TableHead>Ref No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Department</TableHead>
                <TableHead className="hidden xl:table-cell">Roll No</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden xl:table-cell">Registered Via</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead>Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeletonRows columns={12} rows={6} />
              ) : registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-10">
                    <EmptyState icon={Users} title="No registrations found" />
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Checkbox checked={selectedIds.has(r.id)} onCheckedChange={() => toggleRow(r.id)} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{r.refNo}</TableCell>
                    <TableCell>
                      {r.name}
                      <p className="mt-0.5 text-xs text-slate-400 md:hidden">{r.email}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{r.email}</TableCell>
                    <TableCell className="hidden lg:table-cell">{r.phone ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{r.department ?? "—"}</TableCell>
                    <TableCell className="hidden xl:table-cell">{r.rollNo ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{r.category?.label ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_VARIANT[r.status]}`}>
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">{r.registeredVia}</TableCell>
                    <TableCell className="hidden lg:table-cell">{new Date(r.registrationDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={attendanceLoadingId === r.id || r.status === "ATTENDED"}
                          onClick={() => markAttendance(r.id, "ATTENDED")}
                        >
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={attendanceLoadingId === r.id || r.status === "ABSENT"}
                          onClick={() => markAttendance(r.id, "ABSENT")}
                        >
                          Absent
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!noEventSelected && total > LIMIT && (
        <Pagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
      )}
    </div>
  );
}
