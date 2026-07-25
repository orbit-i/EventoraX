"use client";

import { useEffect, useState } from "react";
import { api, buildQuery, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryOption, RegisteredVia, RegistrationStatus } from "@/types/registration";

const VIA_OPTIONS: RegisteredVia[] = ["WEB", "ADMIN", "CSV_IMPORT", "API"];
const STATUS_OPTIONS: RegistrationStatus[] = ["REGISTERED", "ATTENDED", "ABSENT", "CANCELLED"];

interface RegistrationFormProps {
  eventId: string;
  onSaved: () => void;
  onCancel: () => void;
}

export function RegistrationForm({ eventId, onSaved, onCancel }: RegistrationFormProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState<string>("NONE");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [registeredVia, setRegisteredVia] = useState<RegisteredVia>("ADMIN");
  const [status, setStatus] = useState<RegistrationStatus>("REGISTERED");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getList<CategoryOption>(
          `/categories${buildQuery({ eventId })}`
        );
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    })();
  }, [eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await api.post("/registrations", {
        eventId,
        categoryId: categoryId === "NONE" ? undefined : categoryId,
        name,
        email,
        phone: phone || undefined,
        department: department || undefined,
        rollNo: rollNo || undefined,
        registeredVia,
        status,
      });
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="name">Name *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        {fieldErrors.name && <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {fieldErrors.email && <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="department">Department</Label>
        <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="rollNo">Roll No</Label>
        <Input id="rollNo" value={rollNo} onChange={(e) => setRollNo(e.target.value)} />
      </div>

      <div>
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "NONE")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">No category</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Registered Via</Label>
        <Select
          value={registeredVia}
          onValueChange={(v) => setRegisteredVia((v ?? "ADMIN") as RegisteredVia)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VIA_OPTIONS.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Status</Label>
        <Select
          value={status}
          onValueChange={(v) => setStatus((v ?? "REGISTERED") as RegistrationStatus)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Attendee"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}