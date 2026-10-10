import { useState } from "react"
import { Link } from "react-router"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ChevronDown, Clock, Loader2, Mail, MessageCircle, Send, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TextField, TextareaField } from "@/components/ui/form-fields"
import { PageHeader } from "@/components/app/PageHeader"
import { Panel } from "@/components/app/Panel"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { useAuth } from "@/context/AuthContext"
import { useApi } from "@/hooks/useApi"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"
import { useCan } from "@/lib/permissions"
import { api } from "@/lib/api"
import { whatsappLink } from "@/lib/contact"
import type { ContactInfo } from "@/types/dashboard"

const MESSAGE_MAX = 5000

// Same limits as the backend (POST /support).
const schema = z.object({
  subject: z.string().trim().min(3, "Add a short subject").max(150, "Keep the subject under 150 characters"),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least a sentence (10+ characters)")
    .max(MESSAGE_MAX, `Keep the message under ${MESSAGE_MAX.toLocaleString()} characters`),
})
type Values = z.infer<typeof schema>

interface Faq {
  q: string
  a: React.ReactNode
  /** Only shown to admins */
  manage?: boolean
}

const FAQS: Faq[] = [
  {
    q: "How do I add many attendees at once?",
    a: (
      <>
        Go to <Link to="/dashboard/registrations/import" className="text-[#7c3aed] hover:underline">Registrations → Import CSV</Link>. Upload a
        spreadsheet with name and email columns; you'll see a preview with any problems before anything is saved.
      </>
    ),
  },
  {
    q: "What can managers and viewers do?",
    a: "Admins can do everything, including team, billing and settings. Managers can create and edit events, attendees, speakers, sponsors and the schedule. Viewers can look at everything but can't change anything.",
  },
  {
    q: "How do I invite a teammate?",
    manage: true,
    a: (
      <>
        Open <Link to="/dashboard/team" className="text-[#7c3aed] hover:underline">Team</Link> and click Invite. They get an email link that is
        valid for 7 days. Your plan decides how many admins and managers you can have.
      </>
    ),
  },
  {
    q: "How do I renew or upgrade my plan?",
    manage: true,
    a: (
      <>
        Open <Link to="/dashboard/billing" className="text-[#7c3aed] hover:underline">Billing</Link>, pay through JazzCash, Easypaisa or a bank
        transfer, then submit the transaction ID with a screenshot of the receipt. We confirm payments within one working day.
      </>
    ),
  },
  {
    q: "What happens when my plan or trial ends?",
    a: "Nothing is deleted. You can still see the overview, billing, settings and this help page, but other pages are locked until the plan is renewed.",
  },
  {
    q: "Why can't I edit an archived event?",
    a: "Events that already have registrations are archived instead of deleted, so their history is kept. Archived events are read-only — restore one from its page to edit it again.",
  },
]

function ContactCard({ info, loading }: { info: ContactInfo | null; loading: boolean }) {
  const { organization } = useAuth()
  if (loading) return <Skeleton className="h-56 rounded-2xl" />

  const hasDirect = Boolean(info?.whatsapp || info?.email)
  return (
    <Panel title="Talk to us" description="Prefer a quick chat? Reach the EventoraX team directly.">
      <div className="space-y-3">
        {info?.whatsapp && (
          <a
            href={whatsappLink(info.whatsapp, `Hi EventoraX team, I'm from ${organization?.name ?? "my organization"}. `)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#128C7E]"
          >
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
          </a>
        )}
        {info?.email && (
          <a href={`mailto:${info.email}`} className="flex items-center gap-3 rounded-xl border border-[#e9e4ff] p-3 text-sm hover:bg-[#faf8ff]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f3ff] text-[#7c3aed]">
              <Mail className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-[#64748b]">Email</span>
              <span className="block truncate font-medium text-[#0f172a]">{info.email}</span>
            </span>
          </a>
        )}
        {!hasDirect && <p className="text-sm text-[#64748b]">Use the form and we'll reply to your email address.</p>}
        <div className="flex items-start gap-3 rounded-xl bg-[#faf8ff] p-3 text-sm">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#7c3aed]" />
          <div>
            <p className="font-medium text-[#0f172a]">Support hours</p>
            <p className="text-[#64748b]">{info?.hours || "Monday to Friday, office hours (PKT)"}</p>
            <p className="mt-1 text-xs text-[#94a3b8]">We usually reply within one working day.</p>
          </div>
        </div>
      </div>
    </Panel>
  )
}

export default function ContactPage() {
  const { user } = useAuth()
  const can = useCan()
  const info = useApi<ContactInfo>("/contact/info")
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { subject: "", message: "" } })
  const message = useWatch({ control, name: "message" })

  useUnsavedChanges(isDirty && !sent)

  async function onSubmit(values: Values) {
    setFormError(null)
    try {
      await api.post("/support", values)
      reset({ subject: "", message: "" })
      setSent(true)
      toast.success("Message sent")
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  return (
    <>
      <PageHeader
        title="Help & support"
        description="Questions, problems or ideas — we're here to help."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Help & support" }]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Send us a message" description={user ? `We'll reply to ${user.email}.` : undefined}>
            {sent ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-[#0f172a]">Message sent</h3>
                <p className="mt-1 max-w-sm text-sm text-[#64748b]">Thanks! We usually reply within one working day.</p>
                <Button variant="outline" className="mt-5" onClick={() => setSent(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                {formError && <FormError message={formError} />}
                <TextField label="Subject" required placeholder="e.g. CSV import shows an error" error={errors.subject?.message} {...register("subject")} />
                <div>
                  <TextareaField
                    label="Message"
                    required
                    rows={7}
                    placeholder="Tell us what happened and what you expected. Include the event name if it's about a specific event."
                    error={errors.message?.message}
                    {...register("message")}
                  />
                  <p className="mt-1 text-right text-xs tabular-nums text-[#94a3b8]">
                    {(message ?? "").length.toLocaleString()} / {MESSAGE_MAX.toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
                    {isSubmitting ? "Sending…" : "Send message"}
                  </Button>
                </div>
              </form>
            )}
          </Panel>

          <Panel title="Common questions">
            <div className="divide-y divide-[#f1f5f9]">
              {FAQS.filter((f) => !f.manage || can("manage")).map((f) => (
                <details key={f.q} className="group py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-[#0f172a] [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#94a3b8] transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{f.a}</p>
                </details>
              ))}
            </div>
          </Panel>
        </div>

        <div>
          <ContactCard info={info.data} loading={info.initialLoading} />
        </div>
      </div>
    </>
  )
}
