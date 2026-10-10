import { useState } from "react"
import { toast } from "sonner"
import { FormSection, FullWidth, SwitchField } from "@/components/app/form/FormLayout"
import { useAuth } from "@/context/AuthContext"
import { errorMessage } from "@/lib/api"
import { saveOrg } from "./shared"

type PrefKey = "newRegistration" | "attendance" | "certificate"

const PREFS: { key: PrefKey; label: string; description: string }[] = [
  { key: "newRegistration", label: "New registrations", description: "Email the admins when someone registers for an event." },
  { key: "attendance", label: "Attendance updates", description: "A short summary after check-ins are marked for an event." },
  { key: "certificate", label: "Certificates issued", description: "Email the admins when a batch of certificates has been sent." },
]

/** Switches save straight away (no Save button), with Undo. */
export function NotificationsTab() {
  const { organization, refresh } = useAuth()
  const saved = (organization?.notificationPrefs ?? {}) as Partial<Record<PrefKey, boolean>>
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({
    newRegistration: saved.newRegistration ?? true,
    attendance: saved.attendance ?? true,
    certificate: saved.certificate ?? true,
  })
  const [savingKey, setSavingKey] = useState<PrefKey | null>(null)

  async function toggle(key: PrefKey, value: boolean, isUndo = false) {
    setPrefs((p) => ({ ...p, [key]: value })) // show the change immediately
    setSavingKey(key)
    try {
      await saveOrg({ notificationPrefs: { [key]: value } })
      await refresh()
      const label = PREFS.find((p) => p.key === key)!.label
      const msg = `${label} emails ${value ? "turned on" : "turned off"}`
      if (isUndo) toast.success(msg)
      else toast.success(msg, { action: { label: "Undo", onClick: () => void toggle(key, !value, true) } })
    } catch (err) {
      setPrefs((p) => ({ ...p, [key]: !value })) // put it back
      toast.error(errorMessage(err, "Couldn't save that setting."))
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <FormSection title="Email notifications" description="Choose what the organization's admins are emailed about. Changes save automatically.">
      {PREFS.map((p) => (
        <FullWidth key={p.key}>
          <SwitchField label={p.label} description={p.description} checked={prefs[p.key]} onCheckedChange={(v) => void toggle(p.key, v)} disabled={savingKey === p.key} />
        </FullWidth>
      ))}
    </FormSection>
  )
}
