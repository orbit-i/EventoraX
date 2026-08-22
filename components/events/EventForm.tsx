"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormSection } from "@/components/shared/FormSection";
import { ApiError } from "@/lib/api";
import { fromDatetimeLocal } from "@/lib/date";
import { EventFormValues, EventStatus, EVENT_STATUS_LABELS } from "@/types/event";

const formSchema = z
  .object({
    title: z.string().min(1, "Name is required"),
    organizer: z.string().optional(),
    mode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
    startDateTime: z.string().min(1, "Start date & time is required"),
    endDateTime: z.string().min(1, "End date & time is required"),
    location: z.string().optional(),
    description: z.string().optional(),
    topic: z.string().optional(),
    maxAttendees: z.string().optional(),
    ticketPrice: z.string().optional(),
    registrationOpen: z.boolean(),
    meetingLink: z.string().optional(),
    certTemplateId: z.string().optional(),
    autoIssueCert: z.boolean(),
    status: z
      .enum(["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "ARCHIVED"])
      .optional(),
  })
  .refine(
    (vals) =>
      !vals.startDateTime ||
      !vals.endDateTime ||
      new Date(vals.endDateTime) > new Date(vals.startDateTime),
    { message: "End must be after start", path: ["endDateTime"] }
  );

export type EventFormInternalValues = z.infer<typeof formSchema>;

export function EventForm({
  defaultValues,
  submitLabel,
  showStatus = false,
  onSubmit,
  children,
}: {
  defaultValues: Partial<EventFormInternalValues>;
  submitLabel: string;
  showStatus?: boolean;
  onSubmit: (values: EventFormValues) => Promise<void>;
  children?: React.ReactNode;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EventFormInternalValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "OFFLINE",
      registrationOpen: true,
      autoIssueCert: false,
      ...defaultValues,
    },
  });

  const mode = watch("mode");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleFormSubmit(data: EventFormInternalValues) {
    setFormError(null);
    const payload: EventFormValues = {
      title: data.title.trim(),
      organizer: data.organizer?.trim() || undefined,
      mode: data.mode,
      startDateTime: fromDatetimeLocal(data.startDateTime),
      endDateTime: fromDatetimeLocal(data.endDateTime),
      location: data.location?.trim() || undefined,
      description: data.description?.trim() || undefined,
      topic: data.topic?.trim() || undefined,
      maxAttendees: data.maxAttendees ? Number(data.maxAttendees) : undefined,
      ticketPrice: data.ticketPrice?.trim() || undefined,
      registrationOpen: data.registrationOpen,
      meetingLink: data.meetingLink?.trim() || undefined,
      certTemplateId: data.certTemplateId?.trim() || undefined,
      autoIssueCert: data.autoIssueCert,
      status: data.status,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) {
          Object.entries(err.fieldErrors).forEach(([field, message]) => {
            setError(field as keyof EventFormInternalValues, { message });
          });
        }
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="max-w-2xl space-y-8">
      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <FormSection title="Basic details" description="What the event is called and how it runs.">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="title">Event name *</Label>
          <Input id="title" {...register("title")} placeholder="e.g. Annual Tech Symposium" />
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="organizer">Organizer</Label>
          <Input id="organizer" {...register("organizer")} placeholder="e.g. CS Department" />
        </div>

        <div className="space-y-1.5">
          <Label>Mode *</Label>
          <Controller
            control={control}
            name="mode"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="OFFLINE">Offline</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {showStatus && (
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(EVENT_STATUS_LABELS) as EventStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{EVENT_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
      </FormSection>

      <FormSection title="Date & location" description="When and where it's happening.">
        <div className="space-y-1.5">
          <Label htmlFor="startDateTime">Start date & time *</Label>
          <Input id="startDateTime" type="datetime-local" {...register("startDateTime")} />
          {errors.startDateTime && (
            <p className="text-sm text-red-600">{errors.startDateTime.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endDateTime">End date & time *</Label>
          <Input id="endDateTime" type="datetime-local" {...register("endDateTime")} />
          {errors.endDateTime && (
            <p className="text-sm text-red-600">{errors.endDateTime.message}</p>
          )}
        </div>

        {mode !== "OFFLINE" && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="meetingLink">Meeting link</Label>
            <Input id="meetingLink" {...register("meetingLink")} placeholder="https://zoom.us/..." />
          </div>
        )}

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="location">Venue</Label>
          <Input id="location" {...register("location")} placeholder="e.g. Main Auditorium" />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="topic">Topic</Label>
          <Input id="topic" {...register("topic")} />
        </div>
      </FormSection>

      <FormSection title="Capacity & certificate" description="Limits, pricing, and completion rules.">
        <div className="space-y-1.5">
          <Label htmlFor="maxAttendees">Max attendees</Label>
          <Input id="maxAttendees" type="number" min="0" {...register("maxAttendees")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ticketPrice">Ticket price</Label>
          <Input id="ticketPrice" type="number" step="0.01" min="0" {...register("ticketPrice")} placeholder="0.00" />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="certTemplateId">Certificate template</Label>
          <Input id="certTemplateId" disabled placeholder="Certificate templates coming soon" />
          <p className="text-xs text-slate-400">Populates once the Certificates module ships.</p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-[#e9e4ff] p-3">
          <div>
            <Label>Registration open</Label>
            <p className="text-xs text-slate-400">Allow new sign-ups</p>
          </div>
          <Controller
            control={control}
            name="registrationOpen"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-[#e9e4ff] p-3">
          <div>
            <Label>Auto-issue certificate</Label>
            <p className="text-xs text-slate-400">On attendance</p>
          </div>
          <Controller
            control={control}
            name="autoIssueCert"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </FormSection>

      <FormSection title="Description">
        <div className="space-y-1.5 sm:col-span-2">
          <Textarea id="description" rows={4} {...register("description")} />
        </div>
      </FormSection>

      {children}

      <Button type="submit" disabled={isSubmitting} className="bg-[#7c3aed] hover:bg-[#6d28d9]">
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}