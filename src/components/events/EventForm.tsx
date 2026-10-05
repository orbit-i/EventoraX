import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { TextField, SelectField, TextareaField } from "@/components/ui/form-fields"
import { FormSection, FullWidth, SwitchField, FormFooter } from "@/components/app/form/FormLayout"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"
import { api } from "@/lib/api"
import { toDatetimeLocal, fromDatetimeLocal } from "@/lib/date"
import { statusOptions } from "@/lib/status"
import type { EventItem } from "@/types/event"
import { CategoriesEditor } from "./CategoriesEditor"

const URL_RE = /^https?:\/\/\S+$/i

const schema = z
  .object({
    title: z.string().trim().min(3, "Give the event a title (at least 3 characters)").max(200),
    organizer: z.string().trim().max(200),
    topic: z.string().trim().max(200),
    description: z.string().trim().max(10000),
    mode: z.enum(["OFFLINE", "ONLINE", "HYBRID"]),
    status: z.enum(["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "ARCHIVED"]),
    startDateTime: z.string().min(1, "Choose when the event starts"),
    endDateTime: z.string().min(1, "Choose when the event ends"),
    location: z.string().trim().max(255),
    meetingLink: z.string().trim().max(500).refine((v) => v === "" || URL_RE.test(v), "Must be a full link starting with https://"),
    maxAttendees: z.string().trim().refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) > 0), "Enter a whole number above 0, or leave empty for no limit"),
    ticketPrice: z.string().trim().refine((v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) >= 0), "Enter an amount in PKR, e.g. 1500"),
    registrationOpen: z.boolean(),
    autoIssueCert: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.startDateTime && v.endDateTime && new Date(v.endDateTime) <= new Date(v.startDateTime)) {
      ctx.addIssue({ code: "custom", path: ["endDateTime"], message: "The end must be after the start" })
    }
    if (v.mode !== "ONLINE" && !v.location) {
      ctx.addIssue({ code: "custom", path: ["location"], message: "Add the venue for a physical or hybrid event" })
    }
    if (v.mode !== "OFFLINE" && !v.meetingLink) {
      ctx.addIssue({ code: "custom", path: ["meetingLink"], message: "Add the meeting link for an online or hybrid event" })
    }
  })

type Values = z.infer<typeof schema>

function toValues(event?: EventItem): Values {
  return {
    title: event?.title ?? "",
    organizer: event?.organizer ?? "",
    topic: event?.topic ?? "",
    description: event?.description ?? "",
    mode: event?.mode ?? "OFFLINE",
    status: event?.status ?? "DRAFT",
    startDateTime: toDatetimeLocal(event?.startDateTime),
    endDateTime: toDatetimeLocal(event?.endDateTime),
    location: event?.location ?? "",
    meetingLink: event?.meetingLink ?? "",
    maxAttendees: event?.maxAttendees ? String(event.maxAttendees) : "",
    ticketPrice: event?.ticketPrice && Number(event.ticketPrice) > 0 ? String(Number(event.ticketPrice)) : "",
    registrationOpen: event?.registrationOpen ?? true,
    autoIssueCert: event?.autoIssueCert ?? false,
  }
}

const STATUS_CHOICES = statusOptions("event").filter((o) => o.value !== "ARCHIVED")

/** Create or edit an event. On success it opens the event's page. */
export function EventForm({ event, onCategoriesChanged }: { event?: EventItem; onCategoriesChanged?: () => void }) {
  const navigate = useNavigate()
  const isEdit = Boolean(event)
  const archived = event?.status === "ARCHIVED"
  const [formError, setFormError] = useState<string | null>(null)
  const [newCategories, setNewCategories] = useState<string[]>(["General"])
  const [goTo, setGoTo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(event) })

  const mode = useWatch({ control, name: "mode" })
  const startDateTime = useWatch({ control, name: "startDateTime" })

  useUnsavedChanges(isDirty && goTo === null)

  // Navigate only after the "saved" render, so the unsaved-changes guard doesn't fire.
  useEffect(() => {
    if (goTo) navigate(goTo)
  }, [goTo, navigate])

  async function onSubmit(v: Values) {
    setFormError(null)
    const payload = {
      title: v.title,
      organizer: v.organizer || null,
      topic: v.topic || null,
      description: v.description || null,
      mode: v.mode,
      ...(archived ? {} : { status: v.status }),
      startDateTime: fromDatetimeLocal(v.startDateTime),
      endDateTime: fromDatetimeLocal(v.endDateTime),
      location: v.mode === "ONLINE" ? null : v.location || null,
      meetingLink: v.mode === "OFFLINE" ? null : v.meetingLink || null,
      maxAttendees: v.maxAttendees ? Number(v.maxAttendees) : null,
      ticketPrice: v.ticketPrice ? Number(v.ticketPrice) : null,
      registrationOpen: v.registrationOpen,
      autoIssueCert: v.autoIssueCert,
    }
    try {
      if (event) {
        await api.patch(`/events/${event.id}`, payload)
        toast.success("Event updated")
        setGoTo(`/dashboard/events/${event.id}`)
      } else {
        const created = await api.post<EventItem>("/events", { ...payload, categories: newCategories })
        toast.success("Event created")
        setGoTo(`/dashboard/events/${created.id}`)
      }
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {formError && <FormError message={formError} />}

      <FormSection title="Basics" description="What the event is and who is running it.">
        <FullWidth>
          <TextField label="Event title" required placeholder="Annual Tech Symposium 2026" error={errors.title?.message} {...register("title")} />
        </FullWidth>
        <TextField label="Organizer" placeholder="CS Department" error={errors.organizer?.message} {...register("organizer")} />
        <TextField label="Topic" placeholder="AI & Robotics" error={errors.topic?.message} {...register("topic")} />
        <FullWidth>
          <TextareaField
            label="Description"
            rows={5}
            placeholder="What attendees can expect, who it's for, what to bring…"
            error={errors.description?.message}
            {...register("description")}
          />
        </FullWidth>
        <SelectField label="Mode" required options={[
          { value: "OFFLINE", label: "Physical (in person)" },
          { value: "ONLINE", label: "Online" },
          { value: "HYBRID", label: "Hybrid (both)" },
        ]} error={errors.mode?.message} {...register("mode")} />
        {archived ? (
          <TextField label="Status" value="Archived" disabled helper="Restore the event from its page to change the status." readOnly />
        ) : (
          <SelectField
            label="Status"
            options={STATUS_CHOICES}
            helper="Draft events are only visible to your team."
            error={errors.status?.message}
            {...register("status")}
          />
        )}
      </FormSection>

      <FormSection title="Date & place" description="Times are in your local time zone.">
        <TextField label="Starts" type="datetime-local" required error={errors.startDateTime?.message} {...register("startDateTime")} />
        <TextField
          label="Ends"
          type="datetime-local"
          required
          min={startDateTime || undefined}
          error={errors.endDateTime?.message}
          {...register("endDateTime")}
        />
        {mode !== "ONLINE" && (
          <FullWidth>
            <TextField label="Venue" required placeholder="Main Auditorium, NUST H-12" error={errors.location?.message} {...register("location")} />
          </FullWidth>
        )}
        {mode !== "OFFLINE" && (
          <FullWidth>
            <TextField
              label="Meeting link"
              required
              placeholder="https://meet.google.com/…"
              helper="Sent to attendees with their confirmation."
              error={errors.meetingLink?.message}
              {...register("meetingLink")}
            />
          </FullWidth>
        )}
      </FormSection>

      <FormSection title="Registration" description="Who can sign up and how many.">
        <TextField
          label="Maximum attendees"
          inputMode="numeric"
          placeholder="No limit"
          helper="Registration closes automatically when full."
          error={errors.maxAttendees?.message}
          {...register("maxAttendees")}
        />
        <TextField
          label="Ticket price (PKR)"
          inputMode="decimal"
          placeholder="Free"
          error={errors.ticketPrice?.message}
          {...register("ticketPrice")}
        />
        <FullWidth>
          <Controller
            control={control}
            name="registrationOpen"
            render={({ field }) => (
              <SwitchField
                label="Registration open"
                description="Turn off to stop new registrations (organizers can still add attendees)."
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </FullWidth>
      </FormSection>

      <FormSection title="Certificates" description="Certificates for people who attend.">
        <FullWidth>
          <Controller
            control={control}
            name="autoIssueCert"
            render={({ field }) => (
              <SwitchField
                label="Issue certificates automatically"
                description="Attendees get their certificate as soon as they're marked as attended."
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </FullWidth>
        <FullWidth>
          <p className="rounded-xl border border-dashed border-[#d8d0ff] bg-[#faf8ff] px-4 py-3 text-sm text-[#64748b]">
            Choosing a certificate template becomes available with the Certificates module.
          </p>
        </FullWidth>
      </FormSection>

      <FormSection title="Attendee categories" description="Group attendees (e.g. VIP, Student). Used on tickets, ID cards and certificates.">
        <FullWidth>
          {isEdit && event ? (
            <CategoriesEditor
              mode="live"
              eventId={event.id}
              categories={event.categories ?? []}
              onChanged={() => onCategoriesChanged?.()}
            />
          ) : (
            <CategoriesEditor mode="local" value={newCategories} onChange={setNewCategories} />
          )}
        </FullWidth>
      </FormSection>

      <FormFooter
        submitting={isSubmitting}
        onCancel={() => navigate(event ? `/dashboard/events/${event.id}` : "/dashboard/events")}
        submitLabel={isEdit ? "Save changes" : "Create event"}
        dirty={isDirty}
      />
    </form>
  )
}