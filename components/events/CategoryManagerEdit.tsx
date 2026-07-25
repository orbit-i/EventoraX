"use client";

import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { EventCategory } from "@/types/event";

export function CategoryManagerEdit({ eventId }: { eventId: string }) {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getList<EventCategory>(`/categories?eventId=${eventId}`)
      .then((res) => !cancelled && setCategories(res.data))
      .catch(() => !cancelled && setError("Couldn't load categories."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function addCategory() {
    const label = draft.trim();
    if (!label) return;
    try {
      const created = await api.post<EventCategory>("/categories", { eventId, label });
      setCategories((prev) => [...prev, created]);
      setDraft("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add category.");
    }
  }

  async function removeCategory(id: string) {
    const prev = categories;
    setCategories((c) => c.filter((cat) => cat.id !== id));
    try {
      await api.delete(`/categories/${id}`);
    } catch (err) {
      setCategories(prev);
      setError(err instanceof ApiError ? err.message : "Couldn't remove category.");
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>Categories</Label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCategory();
            }
          }}
          placeholder="Type a category and press Enter"
        />
        <Button type="button" variant="outline" onClick={addCategory}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-slate-400">Loading categories…</p>
      ) : categories.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1 rounded-full bg-[#f3f0ff] px-3 py-1 text-sm text-[#6d28d9]"
            >
              {cat.label}
              <button
                type="button"
                onClick={() => removeCategory(cat.id)}
                className="text-[#6d28d9]/60 hover:text-[#6d28d9]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">No categories yet.</p>
      )}
    </div>
  );
}