import { useState } from "react"
import { Link } from "react-router"
import { Check, Copy, Mail, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { whatsappLink } from "@/lib/contact"
import type { PaymentAccounts, PaymentMethod } from "@/types/billing"

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  JAZZCASH: "JazzCash",
  EASYPAISA: "Easypaisa",
  BANK_TRANSFER: "Bank transfer",
  OTHER: "Other",
}

/** Plan feature flags → readable lines for the plan cards (in this order). */
export const FEATURE_LABELS: Record<string, string> = {
  unlimitedEvents: "Unlimited events",
  unlimitedAttendees: "Unlimited attendees",
  qrTicketing: "QR tickets and check-in",
  bulkCertificates: "Bulk certificates",
  analytics: "Analytics",
  emailAutomation: "Email automation",
  auditLogs: "Activity log",
  restApi: "REST API access",
  whiteLabel: "White label",
  customDomain: "Custom domain",
  prioritySupport: "Priority support",
}

export function hasAccounts(accounts: PaymentAccounts | undefined): boolean {
  return Boolean(accounts && (accounts.jazzcash || accounts.easypaisa || accounts.bankIban))
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — the value is still visible to copy by hand */
    }
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e9e4ff] bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-[#94a3b8]">{label}</p>
        <p className="truncate font-mono text-sm font-medium text-[#0f172a]">{value}</p>
      </div>
      <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label={`Copy ${label}`}>
        {copied ? <Check className="text-emerald-600" /> : <Copy />}
      </Button>
    </div>
  )
}

/** Where to send the money. If nothing is configured yet, says how to reach support instead. */
export function PaymentAccountsList({ accounts, support }: { accounts: PaymentAccounts; support: { whatsapp: string; email: string } }) {
  if (!hasAccounts(accounts)) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-medium">Payment details aren't set up yet.</p>
        <p className="mt-1">Contact our team and we'll send you the account details to pay into.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {support.whatsapp && (
            <Button asChild size="sm" className="bg-[#25D366] hover:bg-[#128C7E]">
              <a href={whatsappLink(support.whatsapp, "Hi, I'd like to pay for an EventoraX plan. ")} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> WhatsApp
              </a>
            </Button>
          )}
          {support.email && (
            <Button asChild size="sm" variant="outline">
              <a href={`mailto:${support.email}?subject=EventoraX payment details`}>
                <Mail /> {support.email}
              </a>
            </Button>
          )}
          {!support.whatsapp && !support.email && (
            <Button asChild size="sm" variant="outline">
              <Link to="/dashboard/contact">Contact support</Link>
            </Button>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {accounts.jazzcash && <CopyRow label="JazzCash" value={accounts.jazzcash} />}
      {accounts.easypaisa && <CopyRow label="Easypaisa" value={accounts.easypaisa} />}
      {accounts.bankIban && <CopyRow label="Bank transfer (IBAN)" value={accounts.bankIban} />}
    </div>
  )
}
