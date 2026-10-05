import { useState, type KeyboardEvent } from "react"
import { Check, Loader2, Pencil, Plus, Tag, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { api, errorMessage } from "@/lib/api"
import type { EventCategory } from "@/types/event"

const MAX_CATEGORIES = 30
const SUGGESTIONS = ["General", "VIP", "Student", "Speaker", "Faculty", "Press"]

/**
 * Attendee categories for an event (General, VIP, Student…).
 * - "local" mode (new event): edits a list that is saved together with the event.
 * - "live" mode (existing event): every change is saved straight away.
 */
export function CategoriesEditor(
  props:
    | { mode: "local"; value: string[]; onChange: (labels: string[]) => void }
    | { mode: "live"; eventId: string; categories: EventCategory[]; onChanged: () => void }
) {
  const confirm = useConfirm()
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string; label: string } | null>(null)

  const labels = props.mode === "local" ? props.value : props.categories.map((c) => c.label)
  const exists = (label: string) => labels.some((l) => l.toLowerCase() === label.toLowerCase())

  async function add(raw: string) {
    const label = raw.trim()
    if (!label) return
    if (label.length > 50) return toast.error("Category names can be at most 50 characters")
    if (exists(label)) return toast.error(`"${label}" already exists`)
    if (labels.length >= MAX_CATEGORIES) return toast.error(`An event can have up to ${MAX_CATEGORIES} categories`)

    if (props.mode === "local") {
      props.onChange([...props.value, label])
      setDraft("")
      return
    }
    setBusy("new")
    try {
      await api.post("/categories", { eventId: props.eventId, label })
      setDraft("")
      props.onChanged()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function remove(label: string) {
    if (props.mode === "local") return props.onChange(props.value.filter((l) => l !== label))

    const category = props.categories.find((c) => c.label === label)
    if (!category) return
    const used = category._count?.registrations ?? 0
    if (used > 0) {
      const ok = await confirm({
        title: `Remove "${label}"?`,
        description: `${used} attendee(s) are in this category. They'll stay registered but without a category.`,
        confirmLabel: "Remove category",
        tone: "danger",
      })
      if (!ok) return
    }
    setBusy(category.id)
    try {
      await api.delete(`/categories/${category.id}`)
      props.onChanged()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function rename() {
    if (!editing || props.mode !== "live") return
    const label = editing.label.trim()
    const current = props.categories.find((c) => c.id === editing.id)
    if (!label || label === current?.label) return setEditing(null)
    if (exists(label)) return toast.error(`"${label}" already exists`)
    setBusy(editing.id)
    try {
      await api.patch(`/categories/${editing.id}`, { label })
      setEditing(null)
      props.onChanged()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      void add(draft)
    }
  }

  const unusedSuggestions = SUGGESTIONS.filter((s) => !exists(s))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {labels.length === 0 && (
          <p className="text-sm text-[#94a3b8]">No categories yet — everyone will be "General".</p>
        )}
        {(props.mode === "live" ? props.categories : props.value.map((label) => ({ id: label, label, eventId: "" } as EventCategory))).map(
          (c) =>
            editing?.id === c.id ? (
              <span key={c.id} className="inline-flex items-center gap-1 rounded-full border border-[#c4b5fd] bg-white py-0.5 pl-2 pr-1">
                <input
                  autoFocus
                  value={editing.label}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.preventDefault(), void rename())
                    if (e.key === "Escape") setEditing(null)
                  }}
                  className="w-28 bg-transparent text-sm outline-none"
                  aria-label="Category name"
                />
                <button type="button" onClick={() => void rename()} className="rounded-full p-1 text-emerald-600 hover:bg-emerald-50" aria-label="Save name">
                  <Check className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e9e4ff] bg-[#f5f3ff] py-1 pl-3 pr-1.5 text-sm font-medium text-[#5b21b6]"
              >
                <Tag className="h-3.5 w-3.5" />
                {c.label}
                {props.mode === "live" && (c._count?.registrations ?? 0) > 0 && (
                  <span className="text-xs font-normal text-[#8b5cf6]">· {c._count?.registrations}</span>
                )}
                {busy === c.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    {props.mode === "live" && (
                      <button
                        type="button"
                        onClick={() => setEditing({ id: c.id, label: c.label })}
                        className="rounded-full p-0.5 hover:bg-[#ede9fe]"
                        aria-label={`Rename ${c.label}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void remove(c.label)}
                      className="rounded-full p-0.5 hover:bg-[#ede9fe]"
                      aria-label={`Remove ${c.label}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </span>
            )
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type a category and press Enter"
          className="h-10 max-w-xs bg-white"
          maxLength={50}
          aria-label="New category"
        />
        <Button type="button" variant="outline" onClick={() => void add(draft)} disabled={!draft.trim() || busy === "new"}>
          {busy === "new" ? <Loader2 className="animate-spin" /> : <Plus />} Add
        </Button>
      </div>

      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#94a3b8]">
          Suggestions:
          {unusedSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void add(s)}
              className="rounded-full border border-dashed border-[#d8d0ff] px-2 py-0.5 text-[#7c3aed] hover:bg-[#f5f3ff]"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
      {props.mode === "live" && <p className="text-xs text-[#94a3b8]">Changes to categories are saved immediately.</p>}
    </div>
  )
}