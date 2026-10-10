import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"
import { TextField, SelectField } from "@/components/ui/form-fields"
import { FormSection, FullWidth, SwitchField, FormFooter } from "@/components/app/form/FormLayout"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"
import { useApi } from "@/hooks/useApi"
import { api, buildQuery } from "@/lib/api"
import { fromDatetimeLocal, toDatetimeLocal } from "@/lib/date"
import { formatDateTime, formatDuration } from "@/lib/format"
import type { EventItem } from "@/types/event"
import type { Session } from "@/types/session"
import type { Speaker } from "@/types/speaker"

const NO_SPEAKER = ""

const schema = z
  .object({
    title: z.string().trim().min(2, "Give the session a title").max(200),
    speakerId: z.string(),
    startTime: z.string().min(1, "Choose a start time"),
    endTime: z.string().min(1, "Choose an end time"),
    location: z.string().trim().max(200),
    displayPublic: z.boolean(),
  })
  .refine((v) => !v.startTime || !v.endTime || new Date(v.endTime) > new Date(v.startTime), {
    path: ["endTime"],
    message: "The end must be after the start",
  })
type Values = z.infer<typeof schema>

/** Add or edit a session in the event schedule. */
export function SessionForm({ eventId, session }: { eventId: string; session?: Session }) {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [goTo, setGoTo] = useState<string | null>(null)
  const backTo = `/dashboard/schedule?eventId=${eventId}`

  const eventQ = useApi<EventItem>(`/events/${eventId}`)
  const speakersQ = useApi<Speaker[]>(`/speakers${buildQuery({ eventId, limit: 500 })}`)
  const sessionsQ = useApi<Session[]>(`/sessions${buildQuery({ eventId, limit: 500 })}`)
  const event = eventQ.data

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: session?.title ?? "",
      speakerId: session?.speakerId ?? NO_SPEAKER,
      startTime: toDatetimeLocal(session?.startTime),
      endTime: toDatetimeLocal(session?.endTime),
      location: session?.location ?? "",
      displayPublic: session?.displayPublic ?? true,
    },
  })

  // New session: start at the event's start time once the event has loaded.
  useEffect(() => {
    if (!session && event) {
      const start = new Date(event.startDateTime)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      reset(
        { title: "", speakerId: NO_SPEAKER, startTime: toDatetimeLocal(start.toISOString()), endTime: toDatetimeLocal(end.toISOString()), location: event.location ?? "", displayPublic: true },
        { keepDirty: false }
      )
    }
  }, [event, session, reset])

  const [startTime, endTime, location] = useWatch({ control, name: ["startTime", "endTime", "location"] })

  // Friendly warnings (don't block saving).
  const warnings = useMemo(() => {
    const list: string[] = []
    if (!startTime || !endTime || !event) return list
    const start = new Date(startTime)
    const end = new Date(endTime)
    if (start < new Date(event.startDateTime) || end > new Date(event.endDateTime)) {
      list.push(`This is outside the event's dates (${formatDateTime(event.startDateTime)} – ${formatDateTime(event.endDateTime)}).`)
    }
    const clash = (sessionsQ.data ?? []).find(
      (s) =>
        s.id !== session?.id &&
        location &&
        (s.location ?? "").toLowerCase() === location.toLowerCase() &&
        new Date(s.startTime) < end &&
        new Date(s.endTime) > start
    )
    if (clash) list.push(`"${clash.title}" is in the same room at an overlapping time.`)
    return list
  }, [startTime, endTime, location, event, sessionsQ.data, session?.id])

  const duration = startTime && endTime ? (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000 : 0
  const roomSuggestions = [...new Set([event?.location, ...(sessionsQ.data ?? []).map((s) => s.location)].filter(Boolean) as string[])]

  useUnsavedChanges(isDirty && goTo === null)
  useEffect(() => {
    if (goTo) navigate(goTo)
  }, [goTo, navigate])

  async function onSubmit(v: Values) {
    setFormError(null)
    const payload = {
      title: v.title,
      speakerId: v.speakerId || null,
      startTime: fromDatetimeLocal(v.startTime),
      endTime: fromDatetimeLocal(v.endTime),
      location: v.location || null,
      displayPublic: v.displayPublic,
    }
    try {
      if (session) await api.patch(`/sessions/${session.id}`, payload)
      else await api.post("/sessions", { ...payload, eventId })
      toast.success(session ? "Session updated" : "Session added to the schedule")
      setGoTo(backTo)
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  const speakerOptions = [
    { value: NO_SPEAKER, label: "No speaker (e.g. break, registration)" },
    ...(speakersQ.data ?? []).map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}${s.company ? ` · ${s.company}` : ""}` })),
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {formError && <FormError message={formError} />}

      <FormSection title="Session" description="One item in the event's agenda.">
        <FullWidth>
          <TextField label="Title" required placeholder="Keynote: The Future of AI" error={errors.title?.message} {...register("title")} />
        </FullWidth>
        <FullWidth>
          <SelectField
            label="Speaker"
            options={speakerOptions}
            disabled={speakersQ.initialLoading}
            helper={(speakersQ.data ?? []).length === 0 ? "This event has no speakers yet — add them on the Speakers page." : undefined}
            {...register("speakerId")}
          />
        </FullWidth>
      </FormSection>

      <FormSection title="Time & room">
        <TextField label="Starts" type="datetime-local" required error={errors.startTime?.message} {...register("startTime")} />
        <TextField
          label="Ends"
          type="datetime-local"
          required
          min={startTime || undefined}
          error={errors.endTime?.message}
          helper={duration > 0 ? `Duration: ${formatDuration(duration)}` : undefined}
          {...register("endTime")}
        />
        <FullWidth>
          <TextField label="Room / location" placeholder="Hall A" list="session-rooms" error={errors.location?.message} {...register("location")} />
          <datalist id="session-rooms">
            {roomSuggestions.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </FullWidth>
        {warnings.length > 0 && (
          <FullWidth>
            <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {warnings.map((w) => (
                <p key={w} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {w}
                </p>
              ))}
            </div>
          </FullWidth>
        )}
      </FormSection>

      <FormSection title="Visibility">
        <FullWidth>
          <Controller
            control={control}
            name="displayPublic"
            render={({ field }) => <SwitchField label="Show on the public agenda" checked={field.value} onCheckedChange={field.onChange} />}
          />
        </FullWidth>
      </FormSection>

      <FormFooter submitting={isSubmitting} onCancel={() => navigate(backTo)} submitLabel={session ? "Save changes" : "Add session"} dirty={isDirty} />
    </form>
  )
}