"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/events/EventForm";
import { CategoryManagerEdit } from "@/components/events/CategoryManagerEdit";
import { api, ApiError } from "@/lib/api";
import { toDatetimeLocal } from "@/lib/date";
import { EventFormValues, EventItem } from "@/types/event";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<EventItem>(`/events/${id}`)
      .then((e) => !cancelled && setEvent(e))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : "Couldn't load event."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSave(values: EventFormValues) {
    await api.patch(`/events/${id}`, values);
    router.push(`/dashboard/events/${id}`);
  }

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;
  if (error || !event)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error ?? "Event not found."}
      </div>
    );

  return (
    <div className="max-w-2xl space-y-5">
      <Link href={`/dashboard/events/${id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to event
      </Link>

      <h2 className="text-xl font-semibold text-slate-900">Edit event</h2>

      <EventForm
        defaultValues={{
          title: event.title,
          organizer: event.organizer ?? "",
          mode: event.mode,
          startDateTime: toDatetimeLocal(event.startDateTime),
          endDateTime: toDatetimeLocal(event.endDateTime),
          location: event.location ?? "",
          description: event.description ?? "",
          topic: event.topic ?? "",
          maxAttendees: event.maxAttendees != null ? String(event.maxAttendees) : "",
          ticketPrice: event.ticketPrice ?? "",
          registrationOpen: event.registrationOpen,
          meetingLink: event.meetingLink ?? "",
          certTemplateId: event.certTemplateId ?? "",
          autoIssueCert: event.autoIssueCert,
          status: event.status,
        }}
        submitLabel="Save changes"
        showStatus
        onSubmit={handleSave}
      >
        <CategoryManagerEdit eventId={id} />
      </EventForm>
    </div>
  );
}