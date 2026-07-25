"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { SpeakerForm } from "../../../../../components/speakers/SpeakerForm";
import type { Speaker } from "@/types/speaker";
import { Loader2 } from "lucide-react";

export default function EditSpeakerPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const speakerId = params.id as string;
  const eventId = searchParams.get("eventId") ?? "";

  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Speaker>(`/speakers/${speakerId}`);
        setSpeaker(res);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load speaker.");
      } finally {
        setLoading(false);
      }
    })();
  }, [speakerId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading speaker...
      </div>
    );
  }

  if (error || !speaker) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error ?? "Speaker not found."}</p>
      </div>
    );
  }

  const backEventId = eventId || speaker.eventId;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Edit Speaker</h1>
      <SpeakerForm
        eventId={backEventId}
        initialSpeaker={speaker}
        onSaved={() => router.push(`/dashboard/speakers?eventId=${backEventId}`)}
        onCancel={() => router.push(`/dashboard/speakers?eventId=${backEventId}`)}
      />
    </div>
  );
}