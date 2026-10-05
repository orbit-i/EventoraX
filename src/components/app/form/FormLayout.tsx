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

/** Save / Cancel bar that stays visible at the bottom while scrolling a long form. */
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
    <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex items-center justify-between gap-3 border-t border-[#e9e4ff] bg-white/90 px-6 py-4 backdrop-blur">
      <p className="text-xs text-[#94a3b8]">{dirty ? "You have unsaved changes" : ""}</p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </div>
  )
}