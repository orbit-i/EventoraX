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
import { GripVertical, Loader2, ArrowLeft, Save, Mic2, MapPin } from "lucide-react";
import type { Session } from "@/types/session";

function formatTimeRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const dateStr = s.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeFmt = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${timeFmt(s)} – ${timeFmt(e)}`;
}

function SortableSessionRow({ session, index }: { session: Session; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: session.id,
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
      className="flex items-start gap-3 border rounded-lg bg-white p-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0 touch-none mt-1"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <span className="w-6 text-center text-sm font-medium text-muted-foreground shrink-0 mt-1">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{session.title}</p>
        <p className="text-sm text-muted-foreground">
          {formatTimeRange(session.startTime, session.endTime)}
        </p>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          {session.speaker && (
            <span className="flex items-center gap-1">
              <Mic2 className="w-3.5 h-3.5" />
              {session.speaker.firstName} {session.speaker.lastName}
            </span>
          )}
          {session.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {session.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScheduleReorderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";

  const [sessions, setSessions] = useState<Session[]>([]);
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
        const res = await api.getList<Session>(
          `/sessions?${new URLSearchParams({ eventId, limit: "100" }).toString()}`
        );
        const sorted = [...res.data].sort((a, b) => a.displayOrder - b.displayOrder);
        setSessions(sorted);
        setOriginalOrder(sorted.map((s) => s.id));
      } catch (err: any) {
        setError(err?.message ?? "Failed to load schedule.");
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSessions((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setSaved(false);
  }

  const currentOrder = sessions.map((s) => s.id);
  const isDirty = JSON.stringify(currentOrder) !== JSON.stringify(originalOrder);

  function resetOrder() {
    const map = new Map(sessions.map((s) => [s.id, s]));
    setSessions(originalOrder.map((id) => map.get(id)!).filter(Boolean));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const items = sessions.map((s, index) => ({ id: s.id, displayOrder: index }));
      await api.post("/reorder", { type: "sessions", items });
      setOriginalOrder(sessions.map((s) => s.id));
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
      <div>
        <button
          onClick={() => router.push(`/dashboard/schedule?eventId=${eventId}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Schedule
        </button>
        <h1 className="text-2xl font-semibold">Reorder Schedule</h1>
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
          <Loader2 className="w-5 h-5 animate-spin" /> Loading schedule...
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border rounded-md">
          No sessions to reorder for this event.
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Drag the handle to reorder. Note: this only changes display order, not the actual
            start/end times — edit a session individually to change its time.
          </p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sessions.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sessions.map((s, i) => (
                  <SortableSessionRow key={s.id} session={s} index={i} />
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