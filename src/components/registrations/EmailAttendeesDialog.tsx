import { useEffect, useState } from "react"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TextField, TextareaField } from "@/components/ui/form-fields"
import { api, errorMessage } from "@/lib/api"
import { plural } from "@/lib/format"

/** Write a message and email it to the chosen attendees (cancelled ones are skipped). */
export function EmailAttendeesDialog({
  open,
  onOpenChange,
  ids,
  onSent,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ids: string[]
  onSent?: () => void
}) {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({})

  useEffect(() => {
    if (open) setErrors({})
  }, [open])

  async function send() {
    const next: typeof errors = {}
    if (!subject.trim()) next.subject = "Add a subject"
    if (!message.trim()) next.message = "Write a message"
    setErrors(next)
    if (next.subject || next.message) return

    setSending(true)
    try {
      const res = await api.post<{ sent: number; failed: number }>("/registrations/email", {
        ids,
        subject: subject.trim(),
        message: message.trim(),
      })
      if (res.failed > 0) toast.warning(`Sent ${res.sent}, but ${res.failed} failed. Check the email addresses.`)
      else toast.success(`Email sent to ${plural(res.sent, "attendee")}`)
      setSubject("")
      setMessage("")
      onOpenChange(false)
      onSent?.()
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't send the email."))
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !sending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Email {plural(ids.length, "attendee")}</DialogTitle>
          <DialogDescription>Cancelled registrations are skipped automatically. Each person gets their own copy.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <TextField label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} error={errors.subject} placeholder="Venue update" />
          <TextareaField
            label="Message"
            required
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={5000}
            error={errors.message}
            helper={`${message.length}/5000 · Each email starts with "Hi <name>," automatically.`}
            placeholder="The symposium has moved to Hall B…"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={send} disabled={sending}>
            {sending ? <Loader2 className="animate-spin" /> : <Send />} {sending ? "Sending…" : "Send email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}