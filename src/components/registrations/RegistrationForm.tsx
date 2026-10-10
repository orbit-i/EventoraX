import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { TextField, SelectField } from "@/components/ui/form-fields"
import { FormSection, FormFooter } from "@/components/app/form/FormLayout"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"
import { useApi } from "@/hooks/useApi"
import { api, ApiError, buildQuery } from "@/lib/api"
import { statusOptions } from "@/lib/status"
import type { EventCategory } from "@/types/event"
import type { Registration } from "@/types/registration"

const NO_CATEGORY = ""

const schema = z.object({
  name: z.string().trim().min(2, "Enter the attendee's full name").max(200),
  email: z.string().trim().toLowerCase().min(1, "Email is required").email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+?[\d\s-]{7,20}$/.test(v), "Enter a valid phone number"),
  department: z.string().trim().max(100),
  rollNo: z.string().trim().max(50),
  categoryId: z.string(),
  status: z.enum(["REGISTERED", "ATTENDED", "ABSENT", "CANCELLED"]),
})
type Values = z.infer<typeof schema>

/** Add or edit one attendee. Returns to the registrations list for that event when saved. */
export function RegistrationForm({ eventId, registration }: { eventId: string; registration?: Registration }) {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [goTo, setGoTo] = useState<string | null>(null)
  const categories = useApi<EventCategory[]>(`/categories${buildQuery({ eventId })}`)
  const backTo = `/dashboard/registrations?eventId=${eventId}`

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: registration?.name ?? "",
      email: registration?.email ?? "",
      phone: registration?.phone ?? "",
      department: registration?.department ?? "",
      rollNo: registration?.rollNo ?? "",
      categoryId: registration?.categoryId ?? NO_CATEGORY,
      status: registration?.status ?? "REGISTERED",
    },
  })

  useUnsavedChanges(isDirty && goTo === null)
  useEffect(() => {
    if (goTo) navigate(goTo)
  }, [goTo, navigate])

  async function onSubmit(v: Values) {
    setFormError(null)
    const payload = {
      name: v.name,
      email: v.email,
      phone: v.phone || null,
      department: v.department || null,
      rollNo: v.rollNo || null,
      categoryId: v.categoryId || null,
      status: v.status,
    }
    try {
      if (registration) {
        await api.patch(`/registrations/${registration.id}`, payload)
        toast.success(`${v.name} updated`)
      } else {
        await api.post("/registrations", { ...payload, eventId })
        toast.success(`${v.name} added — their ticket was created`)
      }
      setGoTo(backTo)
    } catch (err) {
      if (err instanceof ApiError && err.code === "DUPLICATE") {
        setError("email", { type: "server", message: "This email is already registered for this event" })
        setFormError("This person is already registered.")
      } else {
        setFormError(applyServerErrors(err, setError))
      }
    }
  }

  const categoryOptions = [
    { value: NO_CATEGORY, label: "General (no category)" },
    ...(categories.data ?? []).map((c) => ({ value: c.id, label: c.label })),
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {formError && <FormError message={formError} />}

      <FormSection title="Attendee" description="Their ticket and certificate use these details.">
        <TextField label="Full name" required autoComplete="off" error={errors.name?.message} {...register("name")} />
        <TextField label="Email" type="email" required autoComplete="off" error={errors.email?.message} {...register("email")} />
        <TextField label="Phone" type="tel" placeholder="+92 300 1234567" error={errors.phone?.message} {...register("phone")} />
        <TextField label="Department" placeholder="Computer Science" error={errors.department?.message} {...register("department")} />
        <TextField label="Roll / registration no." error={errors.rollNo?.message} {...register("rollNo")} />
      </FormSection>

      <FormSection title="Registration" description="Category and current status.">
        <SelectField
          label="Category"
          options={categoryOptions}
          disabled={categories.initialLoading}
          helper={(categories.data ?? []).length === 0 ? "This event has no categories yet." : undefined}
          {...register("categoryId")}
        />
        <SelectField
          label="Status"
          options={statusOptions("registration")}
          helper="Cancelled frees the seat. Absent keeps it."
          {...register("status")}
        />
      </FormSection>

      <FormFooter
        submitting={isSubmitting}
        onCancel={() => navigate(backTo)}
        submitLabel={registration ? "Save changes" : "Add attendee"}
        dirty={isDirty}
      />
    </form>
  )
}