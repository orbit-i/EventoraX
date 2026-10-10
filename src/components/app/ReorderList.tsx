import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowDown, ArrowUp, GripVertical, Loader2, RotateCcw, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"

function SortableRow({
  id,
  index,
  count,
  onMove,
  children,
}: {
  id: string
  index: number
  count: number
  onMove: (from: number, to: number) => void
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm",
        isDragging ? "z-10 border-[#a78bfa] shadow-lg" : "border-[#e9e4ff]"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded-lg p-1.5 text-[#94a3b8] hover:bg-[#f5f3ff] hover:text-[#7c3aed] active:cursor-grabbing"
        aria-label="Drag to reorder (or focus and use the arrow keys)"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums text-[#94a3b8]">{index + 1}</span>
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex gap-1">
        <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label="Move up">
          <ArrowUp />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" disabled={index === count - 1} onClick={() => onMove(index, index + 1)} aria-label="Move down">
          <ArrowDown />
        </Button>
      </div>
    </li>
  )
}

/**
 * Drag-and-drop ordering (mouse, touch or keyboard) with Move up / Move down buttons,
 * a sticky Save / Reset bar, and a warning if you leave without saving.
 */
export function ReorderList<T extends { id: string }>({
  items,
  renderItem,
  onSave,
}: {
  items: T[]
  renderItem: (item: T) => ReactNode
  onSave: (ordered: T[]) => Promise<boolean>
}) {
  const [order, setOrder] = useState<T[]>(items)
  const [baseline, setBaseline] = useState<T[]>(items) // last saved order
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setOrder(items)
    setBaseline(items)
  }, [items])

  const dirty = useMemo(() => order.some((item, i) => item.id !== baseline[i]?.id), [order, baseline])
  useUnsavedChanges(dirty && !saving)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const move = (from: number, to: number) => setOrder((prev) => arrayMove(prev, from, to))

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = order.findIndex((i) => i.id === active.id)
    const to = order.findIndex((i) => i.id === over.id)
    if (from >= 0 && to >= 0) move(from, to)
  }

  async function save() {
    setSaving(true)
    const ok = await onSave(order)
    if (ok) setBaseline(order)
    setSaving(false)
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {order.map((item, index) => (
              <SortableRow key={item.id} id={item.id} index={index} count={order.length} onMove={move}>
                {renderItem(item)}
              </SortableRow>
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex items-center justify-between gap-3 border-t border-[#e9e4ff] bg-white/90 px-6 py-4 backdrop-blur">
        <p className="text-xs text-[#94a3b8]">{dirty ? "Order changed — not saved yet" : "Drag items, or use the arrows, to change the order"}</p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!dirty || saving} onClick={() => setOrder(baseline)}>
            <RotateCcw /> Reset
          </Button>
          <Button disabled={!dirty || saving} onClick={() => void save()}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} {saving ? "Saving…" : "Save order"}
          </Button>
        </div>
      </div>
    </>
  )
}