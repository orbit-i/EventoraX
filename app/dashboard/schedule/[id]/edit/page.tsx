"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { SessionForm } from "../../../../../components/sessions/SessionForm";
import type { Session } from "@/types/session";
import { Loader2 } from "lucide-react";

export default function EditSessionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;
  const eventId = searchParams.get("eventId") ?? "";

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Session>(`/sessions/${sessionId}`);
        setSession(res);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load session.");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading session...
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error ?? "Session not found."}</p>
      </div>
    );
  }

  const backEventId = eventId || session.eventId;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Edit Session</h1>
      <SessionForm
        eventId={backEventId}
        initialSession={session}
        onSaved={() => router.push(`/dashboard/schedule?eventId=${backEventId}`)}
        onCancel={() => router.push(`/dashboard/schedule?eventId=${backEventId}`)}
      />
    </div>
  );
}