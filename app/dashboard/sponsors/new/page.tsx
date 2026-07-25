"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SponsorForm } from "../../../../components/sponsors/SponsorForm";

export default function NewSponsorPage() {
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
      <h1 className="text-2xl font-semibold mb-6">Add Sponsor</h1>
      <SponsorForm
        eventId={eventId}
        onSaved={() => router.push(`/dashboard/sponsors?eventId=${eventId}`)}
        onCancel={() => router.push(`/dashboard/sponsors?eventId=${eventId}`)}
      />
    </div>
  );
}