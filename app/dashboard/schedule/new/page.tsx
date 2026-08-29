"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SessionForm } from "@/components/sessions/SessionForm";
import { RecordFormPage } from "@/components/shared/RecordFormPage";

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";

  if (!eventId) {
    return (
      <RecordFormPage title="Add Session" backHref="/dashboard/schedule" backLabel="Back to schedule">
        <p className="text-sm text-red-600">
          No event selected. Go back to the Schedule list and select an event first.
        </p>
      </RecordFormPage>
    );
  }

  return (
    <RecordFormPage
      title="Add Session"
      subtitle="Add a new session to this event's schedule."
      backHref={`/dashboard/schedule?eventId=${eventId}`}
      backLabel="Back to schedule"
    >
      <SessionForm
        eventId={eventId}
        onSaved={() => router.push(`/dashboard/schedule?eventId=${eventId}`)}
        onCancel={() => router.push(`/dashboard/schedule?eventId=${eventId}`)}
      />
    </RecordFormPage>
  );
}
