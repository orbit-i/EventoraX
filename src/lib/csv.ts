/** Build a CSV file in the browser and download it (opens correctly in Excel). */
export function downloadCsv(fileName: string, header: string[], rows: (string | number)[][]) {
  const cell = (value: string | number) => {
    const text = String(value)
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text // stop spreadsheet formulas
    return `"${safe.replace(/"/g, '""')}"`
  }
  const content = "\uFEFF" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n")
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}