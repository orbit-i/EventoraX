import { useState } from "react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/app/PageHeader"
import { SegmentedTabs } from "@/components/app/SegmentedTabs"
import { AccountTab } from "@/components/settings/AccountTab"
import { OrganizationTab } from "@/components/settings/OrganizationTab"
import { BrandingTab } from "@/components/settings/BrandingTab"
import { CertificatesTab } from "@/components/settings/CertificatesTab"
import { NotificationsTab } from "@/components/settings/NotificationsTab"
import { DangerZoneTab } from "@/components/settings/DangerZoneTab"
import { useUrlState } from "@/hooks/useUrlState"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"
import { useCan } from "@/lib/permissions"

type TabKey = "account" | "organization" | "branding" | "certificates" | "notifications" | "danger"

const TABS: { key: TabKey; label: string; adminOnly: boolean }[] = [
  { key: "account", label: "My account", adminOnly: false },
  { key: "organization", label: "Organization", adminOnly: true },
  { key: "branding", label: "Branding", adminOnly: true },
  { key: "certificates", label: "Certificates", adminOnly: true },
  { key: "notifications", label: "Notifications", adminOnly: true },
  { key: "danger", label: "Danger zone", adminOnly: true },
]

export default function SettingsPage() {
  const can = useCan()
  const tabs = TABS.filter((t) => !t.adminOnly || can("manage"))
  const { values, set } = useUrlState({ tab: "account" })
  const active = (tabs.find((t) => t.key === values.tab)?.key ?? "account") as TabKey

  // Every tab stays mounted (hidden when inactive), so switching tabs keeps your edits.
  // One unsaved-changes guard covers all of them.
  const [dirty, setDirty] = useState<Partial<Record<TabKey, boolean>>>({})
  const [reporters] = useState(
    () =>
      Object.fromEntries(
        TABS.map((t) => [t.key, (value: boolean) => setDirty((d) => (Boolean(d[t.key]) === value ? d : { ...d, [t.key]: value }))])
      ) as Record<TabKey, (dirty: boolean) => void>
  )
  useUnsavedChanges(Object.values(dirty).some(Boolean))

  const panels: Record<TabKey, React.ReactNode> = {
    account: <AccountTab onDirtyChange={reporters.account} />,
    organization: <OrganizationTab onDirtyChange={reporters.organization} />,
    branding: <BrandingTab onDirtyChange={reporters.branding} />,
    certificates: <CertificatesTab onDirtyChange={reporters.certificates} />,
    notifications: <NotificationsTab />,
    danger: <DangerZoneTab />,
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description={can("manage") ? "Your account and your organization's details, branding and preferences." : "Your profile, password and sessions."}
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Settings" }]}
      />

      {tabs.length > 1 && (
        <SegmentedTabs
          value={active}
          onChange={(tab) => set({ tab })}
          options={tabs.map((t) => ({ value: t.key, label: t.label, dot: Boolean(dirty[t.key]) }))}
          className="mb-6"
        />
      )}

      <div className="max-w-4xl">
        {tabs.map((t) => (
          <div key={t.key} role="tabpanel" hidden={t.key !== active} className={cn(t.key !== active && "hidden")}>
            {panels[t.key]}
          </div>
        ))}
      </div>
    </>
  )
}
