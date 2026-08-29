"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { SpeakerForm } from "@/components/speakers/SpeakerForm";
import { RecordFormPage } from "@/components/shared/RecordFormPage";
import type { Speaker } from "@/types/speaker";

export default function EditSpeakerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const speakerId = params.id;
  const eventIdParam = searchParams.get("eventId") ?? "";

  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<Speaker>(`/speakers/${speakerId}`);
        if (!cancelled) setSpeaker(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load speaker.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [speakerId]);

  const backEventId = eventIdParam || speaker?.eventId || "";

  return (
    <RecordFormPage
      title="Edit Speaker"
      backHref={`/dashboard/speakers?eventId=${backEventId}`}
      backLabel="Back to speakers"
      loading={loading}
      loadingLabel="Loading speaker…"
      error={error}
    >
      {speaker && (
        <SpeakerForm
          eventId={backEventId}
          initialSpeaker={speaker}
          onSaved={() => router.push(`/dashboard/speakers?eventId=${backEventId}`)}
          onCancel={() => router.push(`/dashboard/speakers?eventId=${backEventId}`)}
        />
      )}
    </RecordFormPage>
  );
}
