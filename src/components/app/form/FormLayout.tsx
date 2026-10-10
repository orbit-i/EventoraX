import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

/** A titled card that groups related fields. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-[#e9e4ff] bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-[#0f172a]">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-[#64748b]">{description}</p>}
      </div>
      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  )
}

/** Makes a field span both columns inside a FormSection. */
export function FullWidth({ children }: { children: ReactNode }) {
  return <div className="md:col-span-2">{children}</div>
}

/** On/off setting with a label and explanation. */
export function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-4">
      <span>
        <span className="block text-sm font-medium text-[#0f172a]">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-[#64748b]">{description}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </label>
  )
}

/** Save / Cancel row at the end of a form (sits in the page flow, same width as the sections). */
export function FormFooter({
  submitting,
  onCancel,
  submitLabel = "Save",
  dirty,
}: {
  submitting: boolean
  onCancel: () => void
  submitLabel?: string
  dirty?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-[#e9e4ff] bg-white px-5 py-3 shadow-sm">
      {dirty && <p className="mr-auto text-xs text-amber-600">You have unsaved changes</p>}
      <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
        Cancel
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitting && <Loader2 className="animate-spin" />}
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </div>
  )
}
