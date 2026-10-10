import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TextField } from "@/components/ui/form-fields"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { api } from "@/lib/api"
import { emailSchema } from "@/lib/validation"
import type { SeatUsage, TeamResponse, TeamRole } from "@/types/team"
import { ROLE_INFO, seatsLeft } from "./roles"

const schema = z.object({
  email: emailSchema,
  role: z.enum(["admin", "manager", "viewer"]),
})
type Values = z.infer<typeof schema>

/** Invite someone by email. They get a link valid for 7 days. */
export function InviteDialog({
  open,
  onOpenChange,
  seats,
  onInvited,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  seats: TeamResponse["seats"] | undefined
  onInvited: () => void
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", role: "manager" } })

  // Fresh form every time the dialog opens.
  useEffect(() => {
    if (open) {
      reset({ email: "", role: seats && seatsLeft(seats.manager) === 0 ? "viewer" : "manager" })
      setFormError(null)
    }
  }, [open, reset, seats])

  async function onSubmit(values: Values) {
    setFormError(null)
    try {
      await api.post("/team/invite", values)
      toast.success(`Invite sent to ${values.email}`, { description: "The link is valid for 7 days." })
      onOpenChange(false)
      onInvited()
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  const usage = (role: TeamRole): SeatUsage | null => (role === "viewer" || !seats ? null : seats[role])

  return (
    <Dialog open={open} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite a teammate</DialogTitle>
          <DialogDescription>They'll get an email with a link to set their name and password. The link works for 7 days.</DialogDescription>
        </DialogHeader>

        <form id="invite-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {formError && <FormError message={formError} />}
          <TextField label="Email address" type="email" required autoFocus placeholder="name@university.edu.pk" error={errors.email?.message} {...register("email")} />

          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-[#0f172a]">Role</legend>
                <div className="space-y-2" role="radiogroup">
                  {(Object.keys(ROLE_INFO) as TeamRole[]).map((role) => {
                    const seat = usage(role)
                    const left = seat ? seatsLeft(seat) : null
                    const full = left === 0
                    const selected = field.value === role
                    return (
                      <label
                        key={role}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                          selected ? "border-[#7c3aed] bg-[#faf8ff] ring-1 ring-[#7c3aed]" : "border-[#e9e4ff] hover:border-[#c4b5fd]",
                          full && "cursor-not-allowed opacity-60"
                        )}
                      >
                        <input
                          type="radio"
                          name={field.name}
                          value={role}
                          checked={selected}
                          disabled={full}
                          onChange={() => field.onChange(role)}
                          className="mt-1 accent-[#7c3aed]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-[#0f172a]">{ROLE_INFO[role].label}</span>
                            <span className={cn("text-xs", full ? "font-medium text-rose-600" : "text-[#94a3b8]")}>
                              {left === null ? "Unlimited" : full ? "No seats left" : `${left} seat${left === 1 ? "" : "s"} left`}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-xs text-[#64748b]">{ROLE_INFO[role].description}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
                {errors.role?.message && <p className="mt-1.5 text-xs font-medium text-rose-500">{errors.role.message}</p>}
              </fieldset>
            )}
          />
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="invite-form" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
            {isSubmitting ? "Sending…" : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
