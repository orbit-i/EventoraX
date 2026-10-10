/** Quotes a CSV cell and neutralises spreadsheet formulas (=, +, -, @). */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Builds a CSV file (with a BOM so Excel shows Urdu/Arabic names correctly). */
export function toCsv(header: string[], rows: string[][]): string {
  return "\uFEFF" + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}