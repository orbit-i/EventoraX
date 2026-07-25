"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { UploadCloud, FileText, X, CheckCircle2, Loader2 } from "lucide-react";
import type {
  CsvParseResult,
  CsvImportRow,
  CsvImportResult,
} from "@/types/registration";

type Step = "upload" | "map" | "confirming" | "done";

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "map", label: "Map Columns" },
  { key: "confirming", label: "Confirm" },
  { key: "done", label: "Done" },
];

const TARGET_FIELDS: { key: keyof CsvImportRow; label: string; required: boolean }[] = [
  { key: "name", label: "Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone", required: false },
  { key: "department", label: "Department", required: false },
  { key: "rollNo", label: "Roll No", required: false },
  { key: "categoryLabel", label: "Category Label", required: false },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Minimal CSV line parser — handles quoted fields with embedded commas. */
function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n" || char === "\r") {
        if (char === "\r" && next === "\n") i++;
        row.push(field);
        field = "";
        if (row.some((f) => f.trim() !== "")) rows.push(row);
        row = [];
      } else {
        field += char;
      }
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }
  return rows;
}

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center mb-6">
      {STEPS.map((step, i) => {
        const isActive = i === currentIndex;
        const isComplete = i < currentIndex;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shrink-0 ${
                  isComplete
                    ? "bg-[#7c3aed] text-white"
                    : isActive
                    ? "bg-[#7c3aed] text-white ring-4 ring-[#f3f0ff]"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isComplete ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-sm font-medium whitespace-nowrap ${
                  isActive ? "text-[#171717]" : isComplete ? "text-[#7c3aed]" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-3 rounded ${
                  isComplete ? "bg-[#7c3aed]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CsvImportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [invalidRows, setInvalidRows] = useState<Array<{ row: number; email: string; reason: string }>>([]);

  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);

  function handleFileSelect(selected: File | null) {
    setError(null);
    if (selected && !selected.name.toLowerCase().endsWith(".csv")) {
      setError("Only .csv files are supported.");
      return;
    }
    setFile(selected);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileSelect(dropped);
  }

  async function handleUpload() {
    if (!file || !eventId) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const parsed = await api.post<CsvParseResult>(
        "/registrations/csv-import/parse",
        formData
      );
      setParseResult(parsed);

      const text = await file.text();
      const allParsedRows = parseCsvText(text);
      const dataRows = allParsedRows.slice(1);
      setAllRows(dataRows);

      setStep("map");
    } catch (err: any) {
      setError(err?.message ?? "Failed to parse CSV.");
    } finally {
      setUploading(false);
    }
  }

  function handleConfirm() {
    if (!parseResult) return;
    const missingRequired = TARGET_FIELDS.filter((f) => f.required && !mapping[f.key]);
    if (missingRequired.length > 0) {
      setError(
        `Please map required fields: ${missingRequired.map((f) => f.label).join(", ")}`
      );
      return;
    }

    const headers = parseResult.headers;
    const rows: CsvImportRow[] = allRows.map((row) => {
      const record: any = {};
      for (const field of TARGET_FIELDS) {
        const headerName = mapping[field.key];
        if (!headerName) continue;
        const colIndex = headers.indexOf(headerName);
        if (colIndex === -1) continue;
        const value = row[colIndex]?.trim();
        if (value) record[field.key] = value;
      }
      return record as CsvImportRow;
    });

    const badRows: Array<{ row: number; email: string; reason: string }> = [];
    rows.forEach((r, idx) => {
      if (!r.name || r.name.trim() === "") {
        badRows.push({ row: idx + 1, email: r.email || "(missing)", reason: "Missing name" });
      } else if (!r.email || !EMAIL_REGEX.test(r.email)) {
        badRows.push({ row: idx + 1, email: r.email || "(missing)", reason: "Invalid or missing email" });
      }
    });

    if (badRows.length > 0) {
      setInvalidRows(badRows);
      setError(
        `${badRows.length} row(s) have invalid data and would fail the entire import. Fix these in your CSV and re-upload, or adjust your column mapping.`
      );
      return;
    }

    setInvalidRows([]);
    setError(null);
    (async () => {
      setStep("confirming");
      try {
        const result = await api.post<CsvImportResult>("/registrations/csv-import/confirm", {
          eventId,
          rows,
        });
        setImportResult(result);
        setStep("done");
      } catch (err: any) {
        setError(err?.message ?? "Import failed.");
        setStep("map");
      }
    })();
  }

  if (!eventId) {
    return (
      <div className="p-6">
        <p className="text-red-600">No event selected. Go back and select an event first.</p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/registrations")}>
          Back to Registrations
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Import Registrations from CSV</h1>

      <StepIndicator current={step} />

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {step === "upload" && (
        <div className="space-y-4">
          <Label>CSV File</Label>

          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-14 px-6 cursor-pointer transition-colors ${
                dragActive
                  ? "border-[#7c3aed] bg-[#f3f0ff]"
                  : "border-[#e9e4ff] bg-white hover:bg-[#f9f7ff]"
              }`}
            >
              <UploadCloud
                className={`w-10 h-10 ${dragActive ? "text-[#7c3aed]" : "text-gray-400"}`}
              />
              <p className="text-sm font-medium text-[#171717]">
                Drag & drop your CSV here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">.csv files only</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between border rounded-lg p-4 bg-white">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#7c3aed]" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleFileSelect(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <Button onClick={handleUpload} disabled={!file || uploading} className="gap-2">
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? "Uploading & parsing..." : "Upload & Continue"}
          </Button>
        </div>
      )}

      {step === "map" && parseResult && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            {parseResult.totalRows} rows detected. Map your CSV columns to the fields below.
          </p>

          <div className="space-y-3 border rounded-lg p-4 bg-white">
            {TARGET_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <Label className="w-40">
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </Label>
                <Select
                  value={mapping[field.key] ?? "NONE"}
                  onValueChange={(v) =>
                    setMapping((prev) => ({ ...prev, [field.key]: v === "NONE" ? "" : v! }))
                  }
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select CSV column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">— Not mapped —</SelectItem>
                    {parseResult.headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div>
            <h2 className="font-medium mb-2">Preview (first {parseResult.preview.length} rows)</h2>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {parseResult.headers.map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parseResult.preview.map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {invalidRows.length > 0 && (
            <div>
              <h2 className="font-medium mb-2 text-red-700">
                {invalidRows.length} row(s) need fixing before you can import
              </h2>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invalidRows.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell>{e.row}</TableCell>
                        <TableCell>{e.email}</TableCell>
                        <TableCell>{e.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleConfirm}>Confirm Import ({allRows.length} rows)</Button>
            <Button variant="outline" onClick={() => setStep("upload")}>
              Back
            </Button>
          </div>
        </div>
      )}

      {step === "confirming" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#7c3aed]" />
          <p className="text-sm text-muted-foreground">
            Importing {allRows.length} rows... this can take a moment.
          </p>
        </div>
      )}

      {step === "done" && importResult && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-md bg-green-50 text-green-800 border border-green-200">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>
              {importResult.inserted} inserted, {importResult.skipped} skipped, out of{" "}
              {importResult.total} total rows.
            </span>
          </div>

          {importResult.errors.length > 0 && (
            <div>
              <h2 className="font-medium mb-2">Errors</h2>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.errors.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell>{e.row}</TableCell>
                        <TableCell>{e.email}</TableCell>
                        <TableCell>{e.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <Button onClick={() => router.push(`/dashboard/registrations?eventId=${eventId}`)}>
            Back to Registrations
          </Button>
        </div>
      )}
    </div>
  );
}