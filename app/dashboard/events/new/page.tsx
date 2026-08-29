"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EventForm } from "@/components/events/EventForm";
import { CategoryInputCreate } from "@/components/events/CategoryInputCreate";
import { RecordFormPage } from "@/components/shared/RecordFormPage";
import { api } from "@/lib/api";
import { EventFormValues, EventItem } from "@/types/event";

export default function NewEventPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);

  async function handleCreate(values: EventFormValues) {
    const event = await api.post<EventItem>("/events", values);

    await Promise.all(
      categories
        .filter((label) => label.trim())
        .map((label) =>
          api.post("/categories", { eventId: event.id, label: label.trim() }).catch(() => {})
        )
    );

    router.push(`/dashboard/events/${event.id}`);
  }

  return (
    <RecordFormPage
      title="Create event"
      subtitle="Fill in the details below."
      backHref="/dashboard/events"
      backLabel="Back to events"
    >
      <EventForm
        defaultValues={{ startDateTime: "", endDateTime: "" }}
        submitLabel="Create event"
        onSubmit={handleCreate}
        onCancel={() => router.push("/dashboard/events")}
      >
        <CategoryInputCreate value={categories} onChange={setCategories} />
      </EventForm>
    </RecordFormPage>
  );
}
