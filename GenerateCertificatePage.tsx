import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EVENTS = [
  { id: "evt_1", name: "React Summit 2026" },
  { id: "evt_2", name: "UX Conf Lahore" },
  { id: "evt_3", name: "DevOps Meetup" },
];

const TEMPLATES = [
  { id: "tpl_1", name: "Classic Gold" },
  { id: "tpl_2", name: "Minimal Blue" },
  { id: "tpl_3", name: "Bold Navy" },
];

interface FormData {
  recipientName: string;
  recipientEmail: string;
  eventId: string;
  templateId: string;
}

const EMPTY_FORM: FormData = {
  recipientName: "",
  recipientEmail: "",
  eventId: "",
  templateId: "",
};

export default function GenerateCertificatePage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);

  const step1Valid = form.recipientName.trim() !== "" && form.recipientEmail.trim() !== "" && form.eventId !== "";
  const step2Valid = form.templateId !== "";

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerate() {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSuccess({ id: "CERT-" + Math.floor(1000 + Math.random() * 9000) });
  }

  function handleReset() {
    setForm(EMPTY_FORM);
    setStep(1);
    setSuccess(null);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Certificate generated</h2>
          <p className="mt-1 text-sm text-slate-500">{form.recipientName}'s certificate is ready.</p>
          <p className="mt-3 font-mono text-xs text-slate-400">{success.id}</p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={handleReset}>Generate another</Button>
            <Button onClick={() => console.log("navigate to /certificates")}>View in list</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Generate Certificate</h1>
            <p className="text-sm text-slate-500">Step {step} of 2</p>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-slate-900" : "bg-slate-200"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-slate-900" : "bg-slate-200"}`} />
        </div>

        <Card className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="recipientName">Recipient name</Label>
                <Input
                  id="recipientName"
                  placeholder="e.g. Ayesha Khan"
                  value={form.recipientName}
                  onChange={(e) => updateField("recipientName", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="recipientEmail">Recipient email</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="e.g. ayesha@mail.com"
                  value={form.recipientEmail}
                  onChange={(e) => updateField("recipientEmail", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event">Event</Label>
                <Select value={form.eventId} onValueChange={(v) => updateField("eventId", v)}>
                  <SelectTrigger id="event">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENTS.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end pt-2">
                <Button disabled={!step1Valid} onClick={() => setStep(2)}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="template">Certificate template</Label>
                <Select value={form.templateId} onValueChange={(v) => updateField("templateId", v)}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <p className="font-medium text-slate-700">Review</p>
                <dl className="mt-2 space-y-1 text-slate-500">
                  <div className="flex justify-between">
                    <dt>Recipient</dt>
                    <dd className="text-slate-700">{form.recipientName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Email</dt>
                    <dd className="text-slate-700">{form.recipientEmail}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Event</dt>
                    <dd className="text-slate-700">{EVENTS.find((e) => e.id === form.eventId)?.name}</dd>
                  </div>
                </dl>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button disabled={!step2Valid || submitting} onClick={handleGenerate}>
                  {submitting ? "Generating..." : "Generate Certificate"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}