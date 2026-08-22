"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FormSection } from "@/components/shared/FormSection";
import type { Speaker } from "@/types/speaker";

interface SpeakerFormProps {
  eventId: string;
  initialSpeaker?: Speaker;
  onSaved: () => void;
  onCancel: () => void;
}

export function SpeakerForm({ eventId, initialSpeaker, onSaved, onCancel }: SpeakerFormProps) {
  const isEdit = !!initialSpeaker;

  const [firstName, setFirstName] = useState(initialSpeaker?.firstName ?? "");
  const [lastName, setLastName] = useState(initialSpeaker?.lastName ?? "");
  const [title, setTitle] = useState(initialSpeaker?.title ?? "");
  const [company, setCompany] = useState(initialSpeaker?.company ?? "");
  const [sessionTopic, setSessionTopic] = useState(initialSpeaker?.sessionTopic ?? "");
  const [bio, setBio] = useState(initialSpeaker?.bio ?? "");
  const [photo, setPhoto] = useState(initialSpeaker?.photo ?? "");
  const [linkedin, setLinkedin] = useState(initialSpeaker?.linkedin ?? "");
  const [displayPublic, setDisplayPublic] = useState(initialSpeaker?.displayPublic ?? false);

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
        firstName,
        lastName,
        title: title || undefined,
        company: company || undefined,
        sessionTopic: sessionTopic || undefined,
        bio: bio || undefined,
        photo: photo || undefined,
        linkedin: linkedin || undefined,
        displayPublic,
      };
      if (isEdit) {
        await api.patch(`/speakers/${initialSpeaker!.id}`, body);
      } else {
        await api.post("/speakers", { eventId, ...body });
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

      <FormSection title="Basic info" description="Who they are.">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          {fieldErrors.firstName && (
            <p className="text-sm text-red-600">{fieldErrors.firstName}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          {fieldErrors.lastName && (
            <p className="text-sm text-red-600">{fieldErrors.lastName}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="e.g. Senior Engineer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company">Company</Label>
          <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
      </FormSection>

      <FormSection title="Bio & session" description="What they're speaking about.">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="sessionTopic">Session Topic</Label>
          <Input
            id="sessionTopic"
            value={sessionTopic}
            onChange={(e) => setSessionTopic(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short biography for the public event page..."
          />
        </div>
      </FormSection>

      <FormSection title="Photo, links & visibility">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="photo">Photo URL</Label>
          <Input
            id="photo"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            placeholder="https://..."
          />
          {photo && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={photo}
                alt="Preview"
                className="w-12 h-12 rounded-full object-cover border"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
              <span className="text-xs text-muted-foreground">Preview</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="linkedin">LinkedIn URL</Label>
          <Input
            id="linkedin"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-[#e9e4ff] p-3 sm:col-span-2">
          <div>
            <Label htmlFor="displayPublic">Show on public event page</Label>
            <p className="text-xs text-muted-foreground">
              Visible to attendees viewing the public event listing.
            </p>
          </div>
          <Switch id="displayPublic" checked={displayPublic} onCheckedChange={setDisplayPublic} />
        </div>
      </FormSection>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Speaker"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}