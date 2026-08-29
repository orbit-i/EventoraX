"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { SponsorForm } from "@/components/sponsors/SponsorForm";
import { RecordFormPage } from "@/components/shared/RecordFormPage";
import type { Sponsor } from "@/types/sponsor";

export default function EditSponsorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sponsorId = params.id;
  const eventIdParam = searchParams.get("eventId") ?? "";

  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<Sponsor>(`/sponsors/${sponsorId}`);
        if (!cancelled) setSponsor(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load sponsor.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sponsorId]);

  const backEventId = eventIdParam || sponsor?.eventId || "";

  return (
    <RecordFormPage
      title="Edit Sponsor"
      backHref={`/dashboard/sponsors?eventId=${backEventId}`}
      backLabel="Back to sponsors"
      loading={loading}
      loadingLabel="Loading sponsor…"
      error={error}
    >
      {sponsor && (
        <SponsorForm
          eventId={backEventId}
          initialSponsor={sponsor}
          onSaved={() => router.push(`/dashboard/sponsors?eventId=${backEventId}`)}
          onCancel={() => router.push(`/dashboard/sponsors?eventId=${backEventId}`)}
        />
      )}
    </RecordFormPage>
  );
}
