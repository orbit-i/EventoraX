"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SpeakerForm } from "../../../../components/speakers/SpeakerForm";

export default function NewSpeakerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";

  if (!eventId) {
    return (
      <div className="p-6">
        <p className="text-red-600">No event selected. Go back and select an event first.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Add Speaker</h1>
      <SpeakerForm
        eventId={eventId}
        onSaved={() => router.push(`/dashboard/speakers?eventId=${eventId}`)}
        onCancel={() => router.push(`/dashboard/speakers?eventId=${eventId}`)}
      />
    </div>
  );
}