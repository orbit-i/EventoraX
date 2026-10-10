import { useEffect, type ReactNode } from "react"
import { Link } from "react-router"
import { Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import type { Organization } from "@/types/auth"

/** Every settings tab gets this: report unsaved changes up to the page (one guard for all tabs). */
export interface TabProps {
  onDirtyChange: (dirty: boolean) => void
}

export function useReportDirty(dirty: boolean, onDirtyChange: (dirty: boolean) => void) {
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])
}

/** Save / Discard row at the bottom of a settings card. */
export function SaveBar({ dirty, submitting, onDiscard, label = "Save changes" }: { dirty: boolean; submitting: boolean; onDiscard: () => void; label?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#f1f5f9] pt-4">
      {dirty && <span className="mr-auto text-xs text-amber-600">You have unsaved changes</span>}
      <Button type="button" variant="outline" onClick={onDiscard} disabled={!dirty || submitting}>
        Discard
      </Button>
      <Button type="submit" disabled={!dirty || submitting}>
        {submitting && <Loader2 className="animate-spin" />}
        {submitting ? "Saving…" : label}
      </Button>
    </div>
  )
}

/** PATCH /org/me with only the given fields. */
export function saveOrg(fields: Record<string, unknown>) {
  return api.patch<Organization>("/org/me", fields)
}

export function hasFeature(org: Organization | null, feature: string): boolean {
  return (org?.plan?.features as Record<string, unknown> | null)?.[feature] === true
}

/** Grey overlay note for Enterprise-only settings. */
export function EnterpriseLock({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-[#ddd6fe] bg-[#faf8ff] p-3 text-sm text-[#64748b]">
      <Lock className="h-4 w-4 shrink-0 text-[#7c3aed]" />
      <span className="flex-1">{children}</span>
      <Button asChild size="sm" variant="outline">
        <Link to="/dashboard/billing">See plans</Link>
      </Button>
    </div>
  )
}
