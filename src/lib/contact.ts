/** "https://wa.me/923001234567?text=…" from however the number was typed ("+92 300-1234567"). */
export function whatsappLink(number: string, text?: string): string {
  const digits = number.replace(/\D/g, "")
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`
}
