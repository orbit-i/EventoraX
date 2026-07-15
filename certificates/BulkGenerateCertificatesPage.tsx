import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, Award, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

interface ParsedRow {
  name: string;
  email: string;
  valid: boolean;
}

type Stage = "upload" | "preview" | "done";

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split("\n").filter(Boolean);
  const [, ...rows] = lines;
  return rows.map((line) => {
    const [name = "", email = ""] = line.split(",").map((v) => v.trim());
    const valid = name.length > 0 && /\S+@\S+\.\S+/.test(email);
    return { name, email, valid };
  });
}

export default function BulkGenerateCertificatesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [eventId, setEventId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.length - validCount;
  const canGenerate = validCount > 0 && eventId !== "" && templateId !== "";

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result));
      setRows(parsed);
      setStage("preview");
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemoveFile() {
    setFileName("");
    setRows([]);
    setStage("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleGenerate() {
    setGenerating(true);
    setProgress(0);
    for (let i = 0; i <= 100; i += 20) {
      await new Promise((r) => setTimeout(r, 200));
      setProgress(i);
    }
    setGenerating(false);
    setStage("done");
  }

  function handleReset() {
    setStage("upload");
    setFileName("");
    setRows([]);
    setEventId("");
    setTemplateId("");
    setProgress(0);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Bulk Generate Certificates</h1>
            <p className="text-sm text-slate-500">Upload a CSV of recipients to generate certificates in batch</p>
          </div>
        </div>

        {stage === "upload" && (
          <Card
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed p-12 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <UploadCloud className="h-10 w-10 text-slate-400" />
            <p className="font-medium text-slate-700">Drag & drop your CSV here</p>
            <p className="text-sm text-slate-400">Columns required: name, email</p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Browse file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </Card>
        )}

        {stage === "preview" && (
          <div className="space-y-4">
            <Card className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                <span className="font-medium text-slate-700">{fileName}</span>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{validCount} valid</Badge>
                {invalidCount > 0 && (
                  <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">{invalidCount} invalid</Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
                <X className="h-4 w-4" />
              </Button>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Event</label>
                <Select value={eventId} onValueChange={setEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENTS.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Template</label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {invalidCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{invalidCount} row(s) have a missing name or invalid email and will be skipped.</span>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Row status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i} className={!r.valid ? "bg-rose-50/50" : undefined}>
                      <TableCell>{r.name || <span className="text-slate-400">—</span>}</TableCell>
                      <TableCell>{r.email || <span className="text-slate-400">—</span>}</TableCell>
                      <TableCell className="text-right">
                        {r.valid ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Valid</Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Invalid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {generating && (
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-slate-400">Generating {progress}%...</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>Cancel</Button>
              <Button disabled={!canGenerate || generating} onClick={handleGenerate}>
                {generating ? "Generating..." : `Generate ${validCount} certificate${validCount === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        )}

        {stage === "done" && (
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {validCount} certificate{validCount === 1 ? "" : "s"} generated
            </h2>
            <p className="mt-1 text-sm text-slate-500">Recipients will receive their certificates by email shortly.</p>
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="outline" onClick={handleReset}>Upload another file</Button>
              <Button onClick={() => console.log("navigate to /dashboard/certificates")}>View in list</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}