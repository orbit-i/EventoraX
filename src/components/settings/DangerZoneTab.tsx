import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { AlertTriangle, Loader2, Trash2, XOctagon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PasswordField, TextField } from "@/components/ui/form-fields"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import { plural } from "@/lib/format"

type Action = "delete-data" | "close"

const COPY: Record<Action, { title: string; body: string; button: string }> = {
  "delete-data": {
    title: "Delete all event data",
    body: "Permanently deletes every event with its registrations, tickets, certificates, speakers, sponsors and schedule. Your team, settings and billing stay.",
    button: "Delete all event data",
  },
  close: {
    title: "Close this organization",
    body: "Permanently deletes the organization, every team member's account and all data. Everyone is logged out. Any remaining paid time is not refunded.",
    button: "Close organization",
  },
}

/** Type the organization name + your password, then the action runs. */
function ConfirmDangerDialog({ action, onOpenChange }: { action: Action | null; onOpenChange: (open: boolean) => void }) {
  const { organization, refresh, logout } = useAuth()
  const navigate = useNavigate()
  const orgName = organization?.name ?? ""
  const [formError, setFormError] = useState<string | null>(null)

  const schema = z.object({
    confirm: z.string().refine((v) => v.trim() === orgName, `Type "${orgName}" exactly`),
    password: z.string().min(1, "Enter your password"),
  })
  type Values = z.infer<typeof schema>
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { confirm: "", password: "" } })

  useEffect(() => {
    if (action) {
      reset({ confirm: "", password: "" })
      setFormError(null)
    }
  }, [action, reset])

  async function onSubmit(values: Values) {
    if (!action) return
    setFormError(null)
    try {
      if (action === "delete-data") {
        const res = await api.post<{ deletedEvents: number }>("/org/me/delete-data", values)
        toast.success(`Deleted ${plural(res.deletedEvents, "event")} and all their data`)
        onOpenChange(false)
        await refresh()
      } else {
        await api.post("/org/me/close", values)
        onOpenChange(false)
        logout()
        toast.success("Your organization has been closed. Thank you for using EventoraX.")
        navigate("/", { replace: true })
      }
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  const copy = action ? COPY[action] : null
  return (
    <Dialog open={action !== null} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="h-5 w-5" /> {copy?.title}
          </DialogTitle>
          <DialogDescription>{copy?.body} This can't be undone.</DialogDescription>
        </DialogHeader>
        <form id="danger-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError && <FormError message={formError} />}
          <TextField
            label={`Type "${orgName}" to confirm`}
            autoComplete="off"
            autoFocus
            error={errors.confirm?.message}
            {...register("confirm")}
          />
          <PasswordField label="Your password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="danger-form" variant="danger" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {copy?.button}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DangerZoneTab() {
  const [action, setAction] = useState<Action | null>(null)
  const items: { key: Action; icon: typeof Trash2 }[] = [
    { key: "delete-data", icon: Trash2 },
    { key: "close", icon: XOctagon },
  ]

  return (
    <section className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-rose-700">Danger zone</h2>
      <p className="mt-0.5 text-sm text-[#64748b]">These actions are permanent. You'll be asked for the organization name and your password.</p>
      <ul className="mt-5 divide-y divide-rose-100">
        {items.map(({ key, icon: Icon }) => (
          <li key={key} className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[#0f172a]">{COPY[key].title}</p>
              <p className="text-sm text-[#64748b]">{COPY[key].body}</p>
            </div>
            <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800" onClick={() => setAction(key)}>
              <Icon /> {COPY[key].button}
            </Button>
          </li>
        ))}
      </ul>
      <ConfirmDangerDialog action={action} onOpenChange={(open) => !open && setAction(null)} />
    </section>
  )
}
