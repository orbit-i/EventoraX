"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { SessionForm } from "@/components/sessions/SessionForm";
import { RecordFormPage } from "@/components/shared/RecordFormPage";
import type { Session } from "@/types/session";

export default function EditSessionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sessionId = params.id;
  const eventIdParam = searchParams.get("eventId") ?? "";

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<Session>(`/sessions/${sessionId}`);
        if (!cancelled) setSession(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load session.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const backEventId = eventIdParam || session?.eventId || "";

  return (
    <RecordFormPage
      title="Edit Session"
      backHref={`/dashboard/schedule?eventId=${backEventId}`}
      backLabel="Back to schedule"
      loading={loading}
      loadingLabel="Loading session…"
      error={error}
    >
      {session && (
        <SessionForm
          eventId={backEventId}
          initialSession={session}
          onSaved={() => router.push(`/dashboard/schedule?eventId=${backEventId}`)}
          onCancel={() => router.push(`/dashboard/schedule?eventId=${backEventId}`)}
        />
      )}
    </RecordFormPage>
  );
}
