"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Copy, Trash2, Users, Mic2, Handshake, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventModeBadge, EventStatusBadge } from "@/components/events/EventBadges";
import { api, ApiError } from "@/lib/api";
import { EventItem } from "@/types/event";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<EventItem>(`/events/${id}`)
      .then(setEvent)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load event."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDuplicate() {
    setBusy(true);
    try {
      const dup = await api.post<EventItem>(`/events/${id}/duplicate`);
      router.push(`/dashboard/events/${dup.id}`);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to duplicate event.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${event?.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.delete(`/events/${id}`);
      router.push("/dashboard/events");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete event.");
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;
  if (error || !event)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error ?? "Event not found."}
      </div>
    );

  const stats = [
    { label: "Registrations", value: event._count?.registrations ?? 0, icon: Users },
    { label: "Speakers", value: event._count?.speakers ?? 0, icon: Mic2 },
    { label: "Sponsors", value: event._count?.sponsors ?? 0, icon: Handshake },
    { label: "Sessions", value: event._count?.sessions ?? 0, icon: ListOrdered },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/events" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900">{event.title}</h2>
            <EventStatusBadge status={event.status} />
            <EventModeBadge mode={event.mode} />
          </div>
          {event.organizer && <p className="mt-1 text-sm text-slate-500">by {event.organizer}</p>}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href={`/dashboard/events/${id}/edit`}>
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Link>
            }
          />
          <Button variant="outline" disabled={busy} onClick={handleDuplicate}>
            <Copy className="mr-1.5 h-4 w-4" /> Duplicate
          </Button>
          <Button variant="destructive" disabled={busy} onClick={handleDelete}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-[#e9e4ff] bg-white p-4">
            <s.icon className="h-4 w-4 text-[#7c3aed]" />
            <p className="mt-2 text-2xl font-semibold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-[#e9e4ff] bg-white p-5 text-sm">
        <Row label="Starts">{formatDateTime(event.startDateTime)}</Row>
        <Row label="Ends">{formatDateTime(event.endDateTime)}</Row>
        {event.location && <Row label="Venue">{event.location}</Row>}
        {event.topic && <Row label="Topic">{event.topic}</Row>}
        {event.meetingLink && (
          <Row label="Meeting link">
            <a href={event.meetingLink} target="_blank" className="text-[#7c3aed] underline">{event.meetingLink}</a>
          </Row>
        )}
        <Row label="Max attendees">{event.maxAttendees ?? "Unlimited"}</Row>
        <Row label="Ticket price">{event.ticketPrice ? `$${event.ticketPrice}` : "Free"}</Row>
        <Row label="Registration">{event.registrationOpen ? "Open" : "Closed"}</Row>
        <Row label="Auto-issue certificate">{event.autoIssueCert ? "Yes" : "No"}</Row>
        {event.description && (
          <div>
            <p className="text-slate-400">Description</p>
            <p className="mt-1 text-slate-700">{event.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#f3f0ff] pb-2 last:border-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right text-slate-700">{children}</span>
    </div>
  );
}