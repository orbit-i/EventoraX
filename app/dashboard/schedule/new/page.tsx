"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SessionForm } from "../../../../components/sessions/SessionForm";

export default function NewSessionPage() {
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
      <h1 className="text-2xl font-semibold mb-6">Add Session</h1>
      <SessionForm
        eventId={eventId}
        onSaved={() => router.push(`/dashboard/schedule?eventId=${eventId}`)}
        onCancel={() => router.push(`/dashboard/schedule?eventId=${eventId}`)}
      />
    </div>
  );
}