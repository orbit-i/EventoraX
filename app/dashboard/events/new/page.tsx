"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/events/EventForm";
import { CategoryInputCreate } from "@/components/events/CategoryInputCreate";
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
    <div className="max-w-2xl space-y-5">
      <Link href="/dashboard/events" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>

      <div>
        <h2 className="text-xl font-semibold text-slate-900">Create event</h2>
        <p className="text-sm text-slate-500">Fill in the details below.</p>
      </div>

      <EventForm
        defaultValues={{ startDateTime: "", endDateTime: "" }}
        submitLabel="Create event"
        onSubmit={handleCreate}
      >
        <CategoryInputCreate value={categories} onChange={setCategories} />
      </EventForm>
    </div>
  );
}