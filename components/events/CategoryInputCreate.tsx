"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CategoryInputCreate({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addCategory() {
    const label = draft.trim();
    if (!label || value.includes(label)) return;
    onChange([...value, label]);
    setDraft("");
  }

  return (
    <div className="space-y-1.5">
      <Label>Categories</Label>
      <p className="text-xs text-slate-400">
        e.g. General, VIP, Student — created once the event is saved.
      </p>
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
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {value.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-full bg-[#f3f0ff] px-3 py-1 text-sm text-[#6d28d9]"
            >
              {label}
              <button
                type="button"
                onClick={() => onChange(value.filter((l) => l !== label))}
                className="text-[#6d28d9]/60 hover:text-[#6d28d9]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}