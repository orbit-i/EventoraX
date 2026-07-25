"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { GripVertical, Loader2, ArrowLeft, Save } from "lucide-react";
import type { Speaker } from "@/types/speaker";

function initials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function SortableSpeakerRow({ speaker, index }: { speaker: Speaker; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: speaker.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 border rounded-lg bg-white p-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <span className="w-6 text-center text-sm font-medium text-muted-foreground shrink-0">
        {index + 1}
      </span>

      {speaker.photo ? (
        <img
          src={speaker.photo}
          alt={`${speaker.firstName} ${speaker.lastName}`}
          className="w-9 h-9 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-[#f3f0ff] text-[#7c3aed] text-sm font-semibold flex items-center justify-center shrink-0">
          {initials(speaker.firstName, speaker.lastName)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">
          {speaker.firstName} {speaker.lastName}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {[speaker.title, speaker.company].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>
    </div>
  );
}

export default function SpeakerReorderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [originalOrder, setOriginalOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.getList<Speaker>(
          `/speakers?${new URLSearchParams({ eventId, limit: "100" }).toString()}`
        );
        const sorted = [...res.data].sort((a, b) => a.displayOrder - b.displayOrder);
        setSpeakers(sorted);
        setOriginalOrder(sorted.map((s) => s.id));
      } catch (err: any) {
        setError(err?.message ?? "Failed to load speakers.");
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSpeakers((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setSaved(false);
  }

  const currentOrder = speakers.map((s) => s.id);
  const isDirty = JSON.stringify(currentOrder) !== JSON.stringify(originalOrder);

  function resetOrder() {
    const map = new Map(speakers.map((s) => [s.id, s]));
    setSpeakers(originalOrder.map((id) => map.get(id)!).filter(Boolean));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const items = speakers.map((s, index) => ({ id: s.id, displayOrder: index }));
      await api.post("/reorder", { type: "speakers", items });
      setOriginalOrder(speakers.map((s) => s.id));
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save order.");
    } finally {
      setSaving(false);
    }
  }

  if (!eventId) {
    return (
      <div className="p-6">
        <p className="text-red-600">No event selected. Go back and select an event first.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push(`/dashboard/speakers?eventId=${eventId}`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Speakers
          </button>
          <h1 className="text-2xl font-semibold">Reorder Speakers</h1>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {saved && !isDirty && (
        <div className="p-3 rounded-md bg-green-50 text-green-800 text-sm border border-green-200">
          Order saved.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading speakers...
        </div>
      ) : speakers.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border rounded-md">
          No speakers to reorder for this event.
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Drag the handle to reorder. This affects display order on the public event page.
          </p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={speakers.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {speakers.map((s, i) => (
                  <SortableSpeakerRow key={s.id} speaker={s} index={i} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={!isDirty || saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Order
                </>
              )}
            </Button>
            <Button variant="outline" onClick={resetOrder} disabled={!isDirty || saving}>
              Reset
            </Button>
          </div>
        </>
      )}
    </div>
  );
}