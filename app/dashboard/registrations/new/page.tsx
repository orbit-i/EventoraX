"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RegistrationForm } from "@/components/registrations/RegistrationForm";

export default function AddAttendeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";

  if (!eventId) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          No event selected. Go back to the Registrations list and select an event first.
        </p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/registrations")}>
          Back to Registrations
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Add Attendee</h1>
      <RegistrationForm
        eventId={eventId}
        onSaved={() => router.push(`/dashboard/registrations?eventId=${eventId}`)}
        onCancel={() => router.push(`/dashboard/registrations?eventId=${eventId}`)}
      />
    </div>
  );
}