import { useCallback, useState } from "react"
import { buildQuery } from "@/lib/api"
import type { IdCardDesign, IdCardField, IdCardLayout, IdCardTemplate } from "@/types/idcard"

const STORAGE_KEY = "evx_idcard_design"
const TEMPLATES: IdCardTemplate[] = ["classic", "sidebar", "minimal", "bold"]
const FIELDS: IdCardField[] = ["category", "department", "rollNo", "email", "qr"]

export const DEFAULT_DESIGN: IdCardDesign = { template: "classic", fields: ["category", "department", "rollNo", "qr"], logo: true, layout: "sheet" }

function load(): IdCardDesign {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<IdCardDesign> | null
    if (!raw) return DEFAULT_DESIGN
    return {
      template: TEMPLATES.includes(raw.template as IdCardTemplate) ? (raw.template as IdCardTemplate) : DEFAULT_DESIGN.template,
      fields: Array.isArray(raw.fields) ? FIELDS.filter((f) => raw.fields!.includes(f)) : DEFAULT_DESIGN.fields,
      logo: typeof raw.logo === "boolean" ? raw.logo : true,
      layout: raw.layout === "single" ? "single" : "sheet",
    }
  } catch {
    return DEFAULT_DESIGN
  }
}

/** The card design is a personal preference, so it's remembered in this browser (not in the URL). */
export function useIdCardDesign(): [IdCardDesign, (design: IdCardDesign) => void] {
  const [design, setDesign] = useState<IdCardDesign>(load)
  const update = useCallback((next: IdCardDesign) => {
    setDesign(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // storage blocked (private window) — the choice just isn't remembered
    }
  }, [])
  return [design, update]
}

/** The design (plus extra values) as a query string for /idcards/preview and /idcards/pdf. */
export function designQuery(design: IdCardDesign, extra: Record<string, string | undefined> & { layout?: IdCardLayout } = {}) {
  return buildQuery({
    template: design.template,
    fields: design.fields.join(",") || "none",
    logo: design.logo ? "1" : "0",
    layout: design.layout,
    ...extra,
  })
}
