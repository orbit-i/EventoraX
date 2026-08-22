"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormSection } from "@/components/shared/FormSection";
import type { Sponsor, SponsorTier } from "@/types/sponsor";

const TIER_OPTIONS: SponsorTier[] = ["PLATINUM", "GOLD", "SILVER", "BRONZE"];

interface SponsorFormProps {
  eventId: string;
  initialSponsor?: Sponsor;
  onSaved: () => void;
  onCancel: () => void;
}

export function SponsorForm({ eventId, initialSponsor, onSaved, onCancel }: SponsorFormProps) {
  const isEdit = !!initialSponsor;

  const [name, setName] = useState(initialSponsor?.name ?? "");
  const [website, setWebsite] = useState(initialSponsor?.website ?? "");
  const [logo, setLogo] = useState(initialSponsor?.logo ?? "");
  const [tier, setTier] = useState<SponsorTier>(initialSponsor?.tier ?? "BRONZE");
  const [displayPublic, setDisplayPublic] = useState(initialSponsor?.displayPublic ?? false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      const body = {
        name,
        website: website || undefined,
        logo: logo || undefined,
        tier,
        displayPublic,
      };
      if (isEdit) {
        await api.patch(`/sponsors/${initialSponsor!.id}`, body);
      } else {
        await api.post("/sponsors", { eventId, ...body });
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      <FormSection title="Sponsor details">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Sponsor Name *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          {fieldErrors.name && <p className="text-sm text-red-600">{fieldErrors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="logo">Logo URL</Label>
          <Input
            id="logo"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {logo && (
          <div className="sm:col-span-2 flex items-center gap-2">
            <img
              src={logo}
              alt="Preview"
              className="w-12 h-12 rounded-md object-contain border bg-white"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
            <span className="text-xs text-muted-foreground">Preview</span>
          </div>
        )}
      </FormSection>

      <FormSection title="Tier & visibility">
        <div className="space-y-1.5">
          <Label>Tier</Label>
          <Select value={tier} onValueChange={(v) => setTier((v ?? "BRONZE") as SponsorTier)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIER_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-[#e9e4ff] p-3">
          <div>
            <Label htmlFor="displayPublic">Show on public event page</Label>
            <p className="text-xs text-muted-foreground">Visible on the public sponsor listing.</p>
          </div>
          <Switch id="displayPublic" checked={displayPublic} onCheckedChange={setDisplayPublic} />
        </div>
      </FormSection>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Sponsor"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}