"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SponsorForm } from "@/components/sponsors/SponsorForm";
import { RecordFormPage } from "@/components/shared/RecordFormPage";

export default function NewSponsorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";

  if (!eventId) {
    return (
      <RecordFormPage title="Add Sponsor" backHref="/dashboard/sponsors" backLabel="Back to sponsors">
        <p className="text-sm text-red-600">
          No event selected. Go back to the Sponsors list and select an event first.
        </p>
      </RecordFormPage>
    );
  }

  return (
    <RecordFormPage
      title="Add Sponsor"
      subtitle="Add a new sponsor to this event."
      backHref={`/dashboard/sponsors?eventId=${eventId}`}
      backLabel="Back to sponsors"
    >
      <SponsorForm
        eventId={eventId}
        onSaved={() => router.push(`/dashboard/sponsors?eventId=${eventId}`)}
        onCancel={() => router.push(`/dashboard/sponsors?eventId=${eventId}`)}
      />
    </RecordFormPage>
  );
}
