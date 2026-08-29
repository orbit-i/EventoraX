"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SpeakerForm } from "@/components/speakers/SpeakerForm";
import { RecordFormPage } from "@/components/shared/RecordFormPage";

export default function NewSpeakerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";

  if (!eventId) {
    return (
      <RecordFormPage title="Add Speaker" backHref="/dashboard/speakers" backLabel="Back to speakers">
        <p className="text-sm text-red-600">
          No event selected. Go back to the Speakers list and select an event first.
        </p>
      </RecordFormPage>
    );
  }

  return (
    <RecordFormPage
      title="Add Speaker"
      subtitle="Add a new speaker to this event."
      backHref={`/dashboard/speakers?eventId=${eventId}`}
      backLabel="Back to speakers"
    >
      <SpeakerForm
        eventId={eventId}
        onSaved={() => router.push(`/dashboard/speakers?eventId=${eventId}`)}
        onCancel={() => router.push(`/dashboard/speakers?eventId=${eventId}`)}
      />
    </RecordFormPage>
  );
}
