"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EventForm } from "@/components/events/EventForm";
import { CategoryManagerEdit } from "@/components/events/CategoryManagerEdit";
import { RecordFormPage } from "@/components/shared/RecordFormPage";
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

  return (
    <RecordFormPage
      title="Edit event"
      backHref={`/dashboard/events/${id}`}
      backLabel="Back to event"
      loading={loading}
      loadingLabel="Loading event…"
      error={error}
    >
      {event && (
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
          onCancel={() => router.push(`/dashboard/events/${id}`)}
        >
          <CategoryManagerEdit eventId={id} />
        </EventForm>
      )}
    </RecordFormPage>
  );
}
