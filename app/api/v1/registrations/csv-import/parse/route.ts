import { NextRequest, NextResponse } from "next/server";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

// Simple CSV parser that handles quoted fields with commas inside them
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

// POST /api/v1/registrations/csv-import/parse   (multipart/form-data, field name: "file")
export async function POST(req: NextRequest) {
  try {
    await getTenantId(req);
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "A CSV file is required (field name: file)." } },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Only .csv files are supported." } },
        { status: 400 }
      );
    }

    const text = await file.text();
    const { headers, rows } = parseCsv(text);

    if (headers.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "CSV file appears to be empty." } },
        { status: 400 }
      );
    }

    // Return headers + a preview (first 10 rows) so the frontend can build the column-mapping screen
    return NextResponse.json({
      data: {
        headers,
        preview: rows.slice(0, 10),
        totalRows: rows.length,
      },
      error: null,
    });
  } catch (err) {
    console.error("POST /api/v1/registrations/csv-import/parse failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not parse CSV file." } },
      { status: 500 }
    );
  }
}