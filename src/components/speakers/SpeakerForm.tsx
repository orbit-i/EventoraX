import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { TextField, TextareaField } from "@/components/ui/form-fields"
import { FormSection, FullWidth, SwitchField, FormFooter } from "@/components/app/form/FormLayout"
import { ImageUploadField } from "@/components/app/form/ImageUploadField"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"
import { api } from "@/lib/api"
import type { Speaker } from "@/types/speaker"

const URL_RE = /^https?:\/\/\S+$/i
const BIO_MAX = 2000

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  title: z.string().trim().max(150),
  company: z.string().trim().max(150),
  sessionTopic: z.string().trim().max(200),
  bio: z.string().trim().max(BIO_MAX, `Keep the bio under ${BIO_MAX} characters`),
  photo: z.string().nullable(),
  linkedin: z
    .string()
    .trim()
    .refine((v) => v === "" || URL_RE.test(v), "Paste the full profile link, e.g. https://linkedin.com/in/name"),
  displayPublic: z.boolean(),
})
type Values = z.infer<typeof schema>

/** Add or edit a speaker. Returns to the speakers list when saved. */
export function SpeakerForm({ eventId, speaker }: { eventId: string; speaker?: Speaker }) {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [goTo, setGoTo] = useState<string | null>(null)
  const backTo = `/dashboard/speakers?eventId=${eventId}`

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: speaker?.firstName ?? "",
      lastName: speaker?.lastName ?? "",
      title: speaker?.title ?? "",
      company: speaker?.company ?? "",
      sessionTopic: speaker?.sessionTopic ?? "",
      bio: speaker?.bio ?? "",
      photo: speaker?.photo ?? null,
      linkedin: speaker?.linkedin ?? "",
      displayPublic: speaker?.displayPublic ?? true,
    },
  })
  const bio = useWatch({ control, name: "bio" })

  useUnsavedChanges(isDirty && goTo === null)
  useEffect(() => {
    if (goTo) navigate(goTo)
  }, [goTo, navigate])

  async function onSubmit(v: Values) {
    setFormError(null)
    const payload = {
      firstName: v.firstName,
      lastName: v.lastName,
      title: v.title || null,
      company: v.company || null,
      sessionTopic: v.sessionTopic || null,
      bio: v.bio || null,
      photo: v.photo,
      linkedin: v.linkedin || null,
      displayPublic: v.displayPublic,
    }
    try {
      if (speaker) await api.patch(`/speakers/${speaker.id}`, payload)
      else await api.post("/speakers", { ...payload, eventId })
      toast.success(speaker ? "Speaker updated" : `${v.firstName} ${v.lastName} added`)
      setGoTo(backTo)
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {formError && <FormError message={formError} />}

      <FormSection title="Speaker" description="Shown on the event page and in the schedule.">
        <FullWidth>
          <Controller
            control={control}
            name="photo"
            render={({ field }) => (
              <ImageUploadField label="Photo" kind="speaker" shape="circle" value={field.value} onChange={field.onChange} helper="A square headshot works best · PNG, JPG or WEBP · up to 2 MB" />
            )}
          />
        </FullWidth>
        <TextField label="First name" required error={errors.firstName?.message} {...register("firstName")} />
        <TextField label="Last name" required error={errors.lastName?.message} {...register("lastName")} />
        <TextField label="Job title" placeholder="Professor of AI" error={errors.title?.message} {...register("title")} />
        <TextField label="Organization" placeholder="NUST" error={errors.company?.message} {...register("company")} />
        <FullWidth>
          <TextField label="Talk / session topic" placeholder="The future of generative AI" error={errors.sessionTopic?.message} {...register("sessionTopic")} />
        </FullWidth>
        <FullWidth>
          <TextareaField
            label="Bio"
            rows={5}
            placeholder="A short introduction attendees will read."
            helper={`${bio.length}/${BIO_MAX}`}
            error={errors.bio?.message}
            {...register("bio")}
          />
        </FullWidth>
        <FullWidth>
          <TextField label="LinkedIn profile" placeholder="https://linkedin.com/in/…" error={errors.linkedin?.message} {...register("linkedin")} />
        </FullWidth>
      </FormSection>

      <FormSection title="Visibility">
        <FullWidth>
          <Controller
            control={control}
            name="displayPublic"
            render={({ field }) => (
              <SwitchField
                label="Show on the public event page"
                description="Turn off while details are being confirmed."
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </FullWidth>
      </FormSection>

      <FormFooter submitting={isSubmitting} onCancel={() => navigate(backTo)} submitLabel={speaker ? "Save changes" : "Add speaker"} dirty={isDirty} />
    </form>
  )
}