"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { RegistrationForm } from "@/components/registrations/RegistrationForm";
import { RecordFormPage } from "@/components/shared/RecordFormPage";

export default function AddAttendeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";

  if (!eventId) {
    return (
      <RecordFormPage
        title="Add Attendee"
        backHref="/dashboard/registrations"
        backLabel="Back to registrations"
      >
        <p className="text-sm text-red-600">
          No event selected. Go back to the Registrations list and select an event first.
        </p>
      </RecordFormPage>
    );
  }

  return (
    <RecordFormPage
      title="Add Attendee"
      subtitle="Register a new attendee for this event."
      backHref={`/dashboard/registrations?eventId=${eventId}`}
      backLabel="Back to registrations"
    >
      <RegistrationForm
        eventId={eventId}
        onSaved={() => router.push(`/dashboard/registrations?eventId=${eventId}`)}
        onCancel={() => router.push(`/dashboard/registrations?eventId=${eventId}`)}
      />
    </RecordFormPage>
  );
}
