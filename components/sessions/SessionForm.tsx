"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { toDatetimeLocal, fromDatetimeLocal } from "@/lib/date";
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
import type { Session } from "@/types/session";

interface SpeakerOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface SessionFormProps {
  eventId: string;
  initialSession?: Session;
  onSaved: () => void;
  onCancel: () => void;
}

export function SessionForm({ eventId, initialSession, onSaved, onCancel }: SessionFormProps) {
  const isEdit = !!initialSession;

  const [title, setTitle] = useState(initialSession?.title ?? "");
  const [speakerId, setSpeakerId] = useState<string>(initialSession?.speakerId ?? "NONE");
  const [startTime, setStartTime] = useState(
    initialSession ? toDatetimeLocal(initialSession.startTime) : ""
  );
  const [endTime, setEndTime] = useState(
    initialSession ? toDatetimeLocal(initialSession.endTime) : ""
  );
  const [location, setLocation] = useState(initialSession?.location ?? "");
  const [displayPublic, setDisplayPublic] = useState(initialSession?.displayPublic ?? false);

  const [speakers, setSpeakers] = useState<SpeakerOption[]>([]);
  const [speakersLoading, setSpeakersLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        setSpeakersLoading(true);
        const res = await api.getList<SpeakerOption>(
          `/speakers?${new URLSearchParams({ eventId, limit: "100" }).toString()}`
        );
        setSpeakers(res.data);
      } catch (err) {
        console.error("Failed to load speakers", err);
      } finally {
        setSpeakersLoading(false);
      }
    })();
  }, [eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const start = fromDatetimeLocal(startTime);
    const end = fromDatetimeLocal(endTime);
    if (new Date(end) <= new Date(start)) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        title,
        speakerId: speakerId === "NONE" ? undefined : speakerId,
        startTime: start,
        endTime: end,
        location: location || undefined,
        displayPublic,
      };
      if (isEdit) {
        await api.patch(`/sessions/${initialSession!.id}`, body);
      } else {
        await api.post("/sessions", { eventId, ...body });
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="title">Session Title *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        {fieldErrors.title && <p className="text-sm text-red-600 mt-1">{fieldErrors.title}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startTime">Start Time *</Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="endTime">End Time *</Label>
          <Input
            id="endTime"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label>Speaker</Label>
        <Select value={speakerId} onValueChange={(v) => setSpeakerId(v ?? "NONE")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={speakersLoading ? "Loading speakers..." : "No speaker"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">No speaker</SelectItem>
            {speakers.map((sp) => (
              <SelectItem key={sp.id} value={sp.id}>
                {sp.firstName} {sp.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Main Auditorium"
        />
      </div>

      <div className="flex items-center justify-between border rounded-md p-3">
        <div>
          <Label htmlFor="displayPublic">Show on public event page</Label>
          <p className="text-xs text-muted-foreground">Visible on the public schedule listing.</p>
        </div>
        <Switch id="displayPublic" checked={displayPublic} onCheckedChange={setDisplayPublic} />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Session"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}