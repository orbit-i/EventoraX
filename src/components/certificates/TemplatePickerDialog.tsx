import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/AuthContext"
import { useApi } from "@/hooks/useApi"
import { buildQuery } from "@/lib/api"
import type { TemplatesResponse } from "@/types/certificate"
import { usePdfUrl } from "./pdf"

/** Small drawing that hints at each layout's shape (the real design is in the preview). */
function LayoutThumb({ layout, primary, accent }: { layout: string; primary: string; accent: string }) {
  const lines = (
    <div className="flex flex-col items-center gap-1">
      <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: primary }} />
      <div className="h-1 w-8 rounded-full" style={{ backgroundColor: accent }} />
      <div className="mt-1 h-1 w-14 rounded-full bg-slate-300" />
      <div className="h-1 w-10 rounded-full bg-slate-200" />
    </div>
  )
  const base = "relative flex aspect-[1.414] w-full items-center justify-center overflow-hidden rounded-lg bg-white"
  switch (layout) {
    case "modern":
      return (
        <div className={base}>
          <div className="absolute inset-y-0 left-0 w-1/5" style={{ backgroundColor: primary }} />
          <div className="absolute inset-y-0 left-[20%] w-[3%]" style={{ backgroundColor: accent }} />
          <div className="ml-[20%]">{lines}</div>
        </div>
      )
    case "bold":
      return (
        <div className={base}>
          <div className="absolute inset-x-0 top-0 h-1/3" style={{ backgroundColor: primary }} />
          <div className="absolute inset-x-0 top-1/3 h-[3%]" style={{ backgroundColor: accent }} />
          <div className="mt-8">{lines}</div>
        </div>
      )
    case "framed":
      return (
        <div className={base} style={{ backgroundColor: primary }}>
          <div className="absolute inset-[7%] flex items-center justify-center rounded-sm bg-white">{lines}</div>
        </div>
      )
    case "wave":
      return (
        <div className={base}>
          <div className="absolute -left-4 -right-4 -top-6 h-10 rounded-[50%]" style={{ backgroundColor: primary }} />
          <div className="absolute -bottom-6 -left-4 -right-4 h-8 rounded-[50%]" style={{ backgroundColor: primary }} />
          {lines}
        </div>
      )
    case "ribbon":
    case "geometric":
      return (
        <div className={base}>
          <div className="absolute -left-3 -top-3 h-10 w-10 rotate-45" style={{ backgroundColor: primary }} />
          <div className="absolute -bottom-3 -right-3 h-10 w-10 rotate-45" style={{ backgroundColor: layout === "ribbon" ? primary : accent }} />
          {lines}
        </div>
      )
    case "minimal":
      return (
        <div className={cn(base, "justify-start pl-[12%]")}>
          <div className="absolute bottom-[10%] left-[7%] top-[10%] w-[2px]" style={{ backgroundColor: accent }} />
          <div className="absolute inset-x-0 bottom-0 h-[4%]" style={{ backgroundColor: primary }} />
          {lines}
        </div>
      )
    default: // classic, elegant, academic
      return (
        <div className={cn(base, layout !== "classic" && "bg-[#fffdf7]")}>
          <div className="absolute inset-[5%] rounded-sm border-2" style={{ borderColor: layout === "academic" ? accent : primary }} />
          <div className="absolute inset-[9%] rounded-sm border" style={{ borderColor: accent }} />
          {lines}
        </div>
      )
  }
}

/** Choose one of 60 certificate designs, with a live preview of the real PDF. */
export function TemplatePickerDialog({
  open,
  onOpenChange,
  eventId,
  value,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  value: string | null
  onSave: (templateKey: string) => Promise<void>
}) {
  const { organization } = useAuth()
  const catalogue = useApi<TemplatesResponse>(open ? "/certificates/templates" : null)
  const [layout, setLayout] = useState("classic")
  const [variant, setVariant] = useState("royal")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const [l, v] = (value ?? "classic-royal").split("-")
    setLayout(l || "classic")
    setVariant(v || "royal")
  }, [open, value])

  const key = `${layout}-${variant}`
  const preview = usePdfUrl(open ? `/certificates/preview${buildQuery({ eventId, templateKey: key })}` : null)
  const brand = { primary: organization?.primaryColor || "#5b21b6", accent: organization?.accentColor || "#c9a227" }
  const variants = [...(catalogue.data?.variants ?? []), { key: "brand", name: "Your brand", ...brand }]
  const colours = variants.find((v) => v.key === variant) ?? brand

  async function save() {
    setSaving(true)
    try {
      await onSave(key)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Certificate design</DialogTitle>
          <DialogDescription>Pick a layout and a colour. Your logo, signatory and signature come from Settings → Certificates.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-[#0f172a]">Layout</p>
              {catalogue.initialLoading ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <Skeleton key={i} className="aspect-[1.414] rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5" role="radiogroup" aria-label="Layout">
                  {(catalogue.data?.layouts ?? []).map((l) => (
                    <button
                      key={l.key}
                      type="button"
                      role="radio"
                      aria-checked={layout === l.key}
                      title={l.description}
                      onClick={() => setLayout(l.key)}
                      className={cn(
                        "rounded-xl border p-1.5 text-left transition",
                        layout === l.key ? "border-[#7c3aed] ring-2 ring-[#7c3aed]/30" : "border-[#e9e4ff] hover:border-[#c4b5fd]"
                      )}
                    >
                      <LayoutThumb layout={l.key} primary={colours.primary} accent={colours.accent} />
                      <span className="mt-1 block truncate text-xs font-medium text-[#334155]">{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-[#94a3b8]">{catalogue.data?.layouts.find((l) => l.key === layout)?.description}</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-[#0f172a]">Colour</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
                {variants.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    role="radio"
                    aria-checked={variant === v.key}
                    onClick={() => setVariant(v.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs font-medium transition",
                      variant === v.key ? "border-[#7c3aed] bg-[#f5f3ff] text-[#5b21b6]" : "border-[#e9e4ff] text-[#475569] hover:border-[#c4b5fd]"
                    )}
                  >
                    <span className="flex h-6 w-6 overflow-hidden rounded-full ring-1 ring-black/5">
                      <span className="w-1/2" style={{ backgroundColor: v.primary }} />
                      <span className="w-1/2" style={{ backgroundColor: v.accent }} />
                    </span>
                    {v.name}
                    {variant === v.key && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
              {variant === "brand" && <p className="mt-2 text-xs text-[#94a3b8]">Uses the colours from Settings → Branding.</p>}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-[#0f172a]">Preview</p>
            <div className="relative aspect-[1.414] overflow-hidden rounded-xl border border-[#e9e4ff] bg-[#faf8ff]">
              {preview.url && <iframe title="Certificate preview" src={`${preview.url}#toolbar=0&navpanes=0&view=Fit`} className="h-full w-full" />}
              {preview.loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" />
                </div>
              )}
              {preview.error && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-rose-600">{preview.error}</p>}
            </div>
            <p className="mt-2 text-xs text-[#94a3b8]">The preview uses a sample name. Real certificates show each attendee's name, a unique verify code and QR.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || key === value}>
            {saving && <Loader2 className="animate-spin" />} Use this design
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
