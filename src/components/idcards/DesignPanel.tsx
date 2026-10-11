import { Link } from "react-router"
import { Check, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Panel } from "@/components/app/Panel"
import { SwitchField } from "@/components/app/form/FormLayout"
import { usePdfUrl, openPdf } from "@/components/certificates/pdf"
import { useAuth } from "@/context/AuthContext"
import { errorMessage } from "@/lib/api"
import type { IdCardDesign, IdCardOptions, IdCardTemplate } from "@/types/idcard"
import { designQuery } from "./design"

/** Small drawing that hints at each template's shape (the real design is in the preview). */
function TemplateThumb({ template, brand }: { template: IdCardTemplate; brand: string }) {
  const lines = (light = false) => (
    <div className="flex flex-col items-center gap-1">
      <div className={cn("h-1.5 w-10 rounded-full", light ? "bg-white" : "bg-slate-700")} />
      <div className={cn("h-1 w-6 rounded-full", light ? "bg-white/60" : "bg-slate-300")} />
      <div className={cn("mt-1.5 h-4 w-4 rounded-sm", light ? "bg-white" : "bg-slate-800")} />
    </div>
  )
  const base = "relative flex aspect-[0.63] w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white"
  switch (template) {
    case "sidebar":
      return (
        <div className={cn(base, "pl-[22%]")}>
          <div className="absolute inset-y-0 left-0 w-[20%]" style={{ backgroundColor: brand }} />
          {lines()}
        </div>
      )
    case "minimal":
      return (
        <div className={base}>
          <div className="absolute inset-x-0 top-0 h-[3%]" style={{ backgroundColor: brand }} />
          {lines()}
        </div>
      )
    case "bold":
      return (
        <div className={base} style={{ backgroundColor: brand }}>
          <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-white/15" />
          {lines(true)}
        </div>
      )
    default:
      return (
        <div className={cn(base, "pt-[30%]")}>
          <div className="absolute inset-x-0 top-0 h-[24%]" style={{ backgroundColor: brand }} />
          <div className="absolute left-1/2 top-[16%] h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white bg-slate-100" />
          {lines()}
        </div>
      )
  }
}

/** Choose the card template, fields, logo and print layout — with a live preview of the real PDF. */
export function DesignPanel({
  eventId,
  options,
  optionsLoading,
  design,
  onChange,
}: {
  eventId: string
  options: IdCardOptions | null
  optionsLoading: boolean
  design: IdCardDesign
  onChange: (design: IdCardDesign) => void
}) {
  const { organization } = useAuth()
  const brand = organization?.primaryColor || "#7c3aed"
  const preview = usePdfUrl(`/idcards/preview${designQuery(design, { eventId, layout: "single" })}`)

  function toggleField(key: IdCardDesign["fields"][number], on: boolean) {
    const order = options?.fields.map((f) => f.key) ?? []
    const next = on ? [...design.fields, key] : design.fields.filter((f) => f !== key)
    onChange({ ...design, fields: order.filter((f) => next.includes(f)) })
  }

  async function previewSheet() {
    try {
      await openPdf(`/idcards/preview${designQuery(design, { eventId, layout: "sheet" })}`)
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't open the preview."))
    }
  }

  return (
    <Panel
      title="Card design"
      description="Applies to every card you download. Your choice is remembered on this device."
      className="mb-6"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#0f172a]">Template</p>
            {optionsLoading ? (
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="aspect-[0.63] rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3" role="radiogroup" aria-label="Template">
                {(options?.templates ?? []).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="radio"
                    aria-checked={design.template === t.key}
                    title={t.description}
                    onClick={() => onChange({ ...design, template: t.key })}
                    className={cn(
                      "relative rounded-xl border p-1.5 text-left transition",
                      design.template === t.key ? "border-[#7c3aed] ring-2 ring-[#7c3aed]/30" : "border-[#e9e4ff] hover:border-[#c4b5fd]"
                    )}
                  >
                    <TemplateThumb template={t.key} brand={brand} />
                    <span className="mt-1 flex items-center gap-1 truncate text-xs font-medium text-[#334155]">
                      {t.name}
                      {design.template === t.key && <Check className="h-3 w-3 text-[#7c3aed]" />}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-[#94a3b8]">{options?.templates.find((t) => t.key === design.template)?.description}</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-[#0f172a]">Fields on the card</p>
            <p className="mb-2 text-xs text-[#64748b]">The attendee's name and the event are always printed.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(options?.fields ?? []).map((f) => (
                <label key={f.key} className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#e9e4ff] bg-[#faf8ff] px-3 py-2.5">
                  <Checkbox checked={design.fields.includes(f.key)} onCheckedChange={(c) => toggleField(f.key, c === true)} className="mt-0.5" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[#0f172a]">{f.name}</span>
                    {f.description && <span className="block text-xs text-[#64748b]">{f.description}</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SwitchField
              label="Organization logo"
              description={organization?.logoUrl ? "Printed at the top of the card." : "No logo yet. Add one in Settings → Branding."}
              checked={design.logo}
              onCheckedChange={(logo) => onChange({ ...design, logo })}
            />
            <div className="rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-4">
              <span className="block text-sm font-medium text-[#0f172a]">Print layout</span>
              <div className="mt-2 flex gap-1 rounded-lg bg-white p-1 ring-1 ring-[#e9e4ff]" role="radiogroup" aria-label="Print layout">
                {(
                  [
                    { value: "sheet", label: "9 per A4 page" },
                    { value: "single", label: "One per page" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={design.layout === o.value}
                    onClick={() => onChange({ ...design, layout: o.value })}
                    className={cn(
                      "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition",
                      design.layout === o.value ? "bg-[#7c3aed] text-white" : "text-[#64748b] hover:bg-[#f5f3ff]"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <span className="mt-1.5 block text-xs text-[#64748b]">
                {design.layout === "sheet" ? "Normal printer. Cut along the crop marks." : "For ID card printers (54 × 86 mm)."}
              </span>
            </div>
          </div>
          {!organization?.logoUrl && design.logo && (
            <p className="text-xs text-[#64748b]">
              Tip: <Link to="/dashboard/settings?tab=branding" className="font-medium text-[#7c3aed] hover:underline">upload your logo</Link> (PNG or JPEG) to print it on cards.
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-[#0f172a]">Preview</p>
          <div className="relative mx-auto aspect-[0.63] w-full max-w-[220px] overflow-hidden rounded-xl border border-[#e9e4ff] bg-[#faf8ff]">
            {preview.url && <iframe title="ID card preview" src={`${preview.url}#toolbar=0&navpanes=0&view=Fit`} className="h-full w-full" />}
            {preview.loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" />
              </div>
            )}
            {preview.error && <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-rose-600">{preview.error}</p>}
          </div>
          <p className="mt-2 text-center text-xs text-[#94a3b8]">Sample attendee</p>
          <Button variant="ghost" size="sm" className="mt-1 w-full" onClick={() => void previewSheet()}>
            <ExternalLink /> Preview a full page
          </Button>
        </div>
      </div>
    </Panel>
  )
}
