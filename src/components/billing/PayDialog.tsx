import { useEffect, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SelectField, TextareaField, TextField } from "@/components/ui/form-fields"
import { ImageUploadField } from "@/components/app/form/ImageUploadField"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { api } from "@/lib/api"
import { formatPKR } from "@/lib/format"
import type { BillingOverview, PaymentMethod } from "@/types/billing"
import { METHOD_LABEL, PaymentAccountsList } from "./paymentInfo"

const schema = z.object({
  planId: z.string().min(1, "Choose a plan"),
  method: z.enum(["JAZZCASH", "EASYPAISA", "BANK_TRANSFER", "OTHER"]),
  referenceNo: z.string().trim().min(3, "Enter the transaction / reference number from your receipt").max(100),
  proofUrl: z.string().nullable(),
  notes: z.string().trim().max(1000, "Keep notes under 1,000 characters"),
})
type Values = z.infer<typeof schema>

/** Step 1: pay using the details shown. Step 2: send us the transaction ID and receipt. */
export function PayDialog({
  planId,
  billing,
  onOpenChange,
  onSubmitted,
}: {
  planId: string | null
  billing: BillingOverview
  onOpenChange: (open: boolean) => void
  onSubmitted: () => void
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { planId: "", method: "JAZZCASH", referenceNo: "", proofUrl: null, notes: "" },
  })
  const selectedPlanId = useWatch({ control, name: "planId" })
  const plan = billing.plans.find((p) => p.id === selectedPlanId)

  useEffect(() => {
    if (planId) {
      const a = billing.paymentAccounts
      const method: PaymentMethod = a.jazzcash ? "JAZZCASH" : a.easypaisa ? "EASYPAISA" : a.bankIban ? "BANK_TRANSFER" : "OTHER"
      reset({ planId, method, referenceNo: "", proofUrl: null, notes: "" })
      setFormError(null)
    }
  }, [planId, reset, billing.paymentAccounts])

  async function onSubmit(values: Values) {
    setFormError(null)
    try {
      await api.post("/billing/payments", { ...values, notes: values.notes || null })
      toast.success("Payment submitted", { description: "We'll confirm it within one working day and email you." })
      onOpenChange(false)
      onSubmitted()
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  return (
    <Dialog open={planId !== null} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Pay for {plan?.name ?? "a plan"}</DialogTitle>
          <DialogDescription>
            Send <strong className="text-[#0f172a]">{formatPKR(plan?.price)}</strong> for one year, then tell us the transaction ID. Your plan is
            activated as soon as we confirm the payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#0f172a]">1. Send the payment</p>
          <PaymentAccountsList accounts={billing.paymentAccounts} support={billing.support} />
        </div>

        <form id="pay-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <p className="text-sm font-semibold text-[#0f172a]">2. Tell us about it</p>
          {formError && <FormError message={formError} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Plan"
              required
              options={billing.plans.map((p) => ({ value: p.id, label: `${p.name} — ${formatPKR(p.price)}/year` }))}
              error={errors.planId?.message}
              {...register("planId")}
            />
            <SelectField
              label="Paid with"
              required
              options={(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => ({ value: m, label: METHOD_LABEL[m] }))}
              error={errors.method?.message}
              {...register("method")}
            />
          </div>
          <TextField
            label="Transaction ID / reference number"
            required
            placeholder="e.g. 019283746512"
            helper="Shown in the SMS or app receipt after you pay"
            error={errors.referenceNo?.message}
            {...register("referenceNo")}
          />
          <Controller
            control={control}
            name="proofUrl"
            render={({ field }) => (
              <ImageUploadField
                label="Receipt screenshot (recommended)"
                kind="payment"
                value={field.value}
                onChange={field.onChange}
                helper="Helps us confirm faster · PNG, JPG or WEBP · up to 2 MB"
                error={errors.proofUrl?.message}
              />
            )}
          />
          <TextareaField label="Notes (optional)" rows={2} placeholder="Anything we should know" error={errors.notes?.message} {...register("notes")} />
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="pay-form" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
            {isSubmitting ? "Submitting…" : "Submit payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
