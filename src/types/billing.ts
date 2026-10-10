// Shapes returned by /api/v1/billing
import type { OrgStatus, Plan } from "./auth"

export type PaymentMethod = "JAZZCASH" | "EASYPAISA" | "BANK_TRANSFER" | "OTHER"

export interface Payment {
  id: string
  amount: string
  currency: string
  method: PaymentMethod
  status: "PENDING" | "CONFIRMED" | "REJECTED"
  referenceNo: string | null
  proofUrl: string | null
  notes: string | null
  periodStart: string | null
  periodEnd: string | null
  confirmedAt: string | null
  createdAt: string
  plan: { id: string; name: string } | null
}

/** Empty strings mean "not set up yet". */
export interface PaymentAccounts {
  jazzcash: string
  easypaisa: string
  bankIban: string
}

/** GET /billing */
export interface BillingOverview {
  organization: { status: OrgStatus; subscriptionEndsAt: string; plan: Plan | null }
  plans: (Plan & { isVisible: boolean; sortOrder: number })[]
  paymentAccounts: PaymentAccounts
  support: { whatsapp: string; email: string }
  pendingPayment: Payment | null
  paymentCount: number
}
