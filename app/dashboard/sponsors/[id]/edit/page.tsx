"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { SponsorForm } from "../../../../../components/sponsors/SponsorForm";
import type { Sponsor } from "@/types/sponsor";
import { Loader2 } from "lucide-react";

export default function EditSponsorPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sponsorId = params.id as string;
  const eventId = searchParams.get("eventId") ?? "";

  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Sponsor>(`/sponsors/${sponsorId}`);
        setSponsor(res);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load sponsor.");
      } finally {
        setLoading(false);
      }
    })();
  }, [sponsorId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading sponsor...
      </div>
    );
  }

  if (error || !sponsor) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error ?? "Sponsor not found."}</p>
      </div>
    );
  }

  const backEventId = eventId || sponsor.eventId;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Edit Sponsor</h1>
      <SponsorForm
        eventId={backEventId}
        initialSponsor={sponsor}
        onSaved={() => router.push(`/dashboard/sponsors?eventId=${backEventId}`)}
        onCancel={() => router.push(`/dashboard/sponsors?eventId=${backEventId}`)}
      />
    </div>
  );
}