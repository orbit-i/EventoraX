import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Copy, Download, KeyRound, Loader2, ShieldCheck, ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PasswordField, TextField } from "@/components/ui/form-fields"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormSection, FullWidth } from "@/components/app/form/FormLayout"
import { FormError } from "@/components/auth/AuthShell"
import { useAuth } from "@/context/AuthContext"
import { api, ApiError, errorMessage } from "@/lib/api"

interface Setup {
  secret: string
  otpauthUrl: string
  qr: string
}

/** Two-factor login with an authenticator app (Google Authenticator, Microsoft Authenticator, Authy). */
export function TwoFactorSection() {
  const { user, impersonator, refresh } = useAuth()
  const [dialog, setDialog] = useState<"setup" | "disable" | "codes" | null>(null)
  const [codes, setCodes] = useState<string[] | null>(null)
  const enabled = user?.twoFactorEnabled === true

  return (
    <FormSection title="Two-factor login" description="A code from your phone is needed after your password.">
      <FullWidth>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-4">
          <div className="flex items-start gap-3">
            {enabled ? (
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-[#94a3b8]" />
            )}
            <div>
              <p className="text-sm font-semibold text-[#0f172a]">{enabled ? "On" : "Off"}</p>
              <p className="text-sm text-[#475569]">
                {enabled
                  ? "Someone who learns your password still can't log in without your phone."
                  : user?.role === "superAdmin"
                    ? "Strongly recommended for the platform account."
                    : "Protects your account if your password ever leaks."}
              </p>
            </div>
          </div>
          {impersonator ? (
            <p className="text-xs text-[#64748b]">Not available while logged in as someone else.</p>
          ) : enabled ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setDialog("codes")}>
                <KeyRound /> New recovery codes
              </Button>
              <Button variant="outline" onClick={() => setDialog("disable")}>
                Turn off
              </Button>
            </div>
          ) : (
            <Button onClick={() => setDialog("setup")}>
              <ShieldCheck /> Turn on
            </Button>
          )}
        </div>
      </FullWidth>

      {dialog === "setup" && (
        <SetupDialog
          onClose={() => setDialog(null)}
          onEnabled={(c) => {
            setCodes(c)
            setDialog(null)
            void refresh()
          }}
        />
      )}
      {(dialog === "disable" || dialog === "codes") && (
        <PasswordDialog
          mode={dialog}
          onClose={() => setDialog(null)}
          onDone={(c) => {
            setDialog(null)
            if (c) setCodes(c)
            else {
              toast.success("Two-factor login turned off")
              void refresh()
            }
          }}
        />
      )}
      {codes && <RecoveryCodesDialog codes={codes} email={user?.email ?? ""} onClose={() => setCodes(null)} />}
    </FormSection>
  )
}

function SetupDialog({ onClose, onEnabled }: { onClose: () => void; onEnabled: (codes: string[]) => void }) {
  const [setup, setSetup] = useState<Setup | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const requested = useRef(false)

  // Ask for a fresh secret once, when the dialog opens (the ref stops React's dev double-run from making two).
  useEffect(() => {
    if (requested.current) return
    requested.current = true
    api
      .post<Setup>("/auth/2fa/setup")
      .then(setSetup)
      .catch((err) => setLoadError(errorMessage(err)))
  }, [])

  async function enable(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{6}$/.test(code.replace(/\s+/g, ""))) return setError("Enter the 6-digit code your app shows")
    setError(null)
    setBusy(true)
    try {
      const res = await api.post<{ recoveryCodes: string[] }>("/auth/2fa/enable", { code: code.replace(/\s+/g, "") })
      toast.success("Two-factor login is on")
      onEnabled(res.recoveryCodes)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Turn on two-factor login</DialogTitle>
          <DialogDescription>Scan the QR code with Google Authenticator, Microsoft Authenticator or Authy.</DialogDescription>
        </DialogHeader>
        {loadError ? (
          <FormError message={loadError} />
        ) : !setup ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" />
          </div>
        ) : (
          <form id="tfa-enable" onSubmit={enable} noValidate className="space-y-4">
            <div className="flex justify-center">
              <img src={setup.qr} alt="QR code for your authenticator app" className="h-48 w-48 rounded-xl border border-[#e9e4ff]" />
            </div>
            <div className="rounded-xl bg-[#faf8ff] p-3 text-center">
              <p className="text-xs text-[#64748b]">Can't scan? Type this key into the app</p>
              <p className="mt-1 select-all break-all font-mono text-sm font-semibold tracking-wider text-[#0f172a]">{setup.secret}</p>
            </div>
            {error && <FormError message={error} />}
            <TextField
              label="Code from the app"
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={7}
              placeholder="123456"
              style={{ letterSpacing: "0.4em", textAlign: "center", fontSize: 18 }}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </form>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="tfa-enable" disabled={!setup || busy}>
            {busy && <Loader2 className="animate-spin" />} Turn on
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Password check for "turn off" and "new recovery codes". */
function PasswordDialog({ mode, onClose, onDone }: { mode: "disable" | "codes"; onClose: () => void; onDone: (codes?: string[]) => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return setError("Enter your password")
    setError(null)
    setBusy(true)
    try {
      if (mode === "disable") {
        await api.post("/auth/2fa/disable", { password })
        onDone()
      } else {
        const res = await api.post<{ recoveryCodes: string[] }>("/auth/2fa/recovery-codes", { password })
        onDone(res.recoveryCodes)
      }
    } catch (err) {
      setError(err instanceof ApiError && err.fieldErrors?.password ? err.fieldErrors.password : errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "disable" ? "Turn off two-factor login?" : "Make new recovery codes?"}</DialogTitle>
          <DialogDescription>
            {mode === "disable"
              ? "Your password alone will be enough to log in again."
              : "Your old recovery codes stop working as soon as the new ones are made."}
          </DialogDescription>
        </DialogHeader>
        <form id="tfa-password" onSubmit={submit} noValidate>
          <PasswordField
            label="Your password"
            autoFocus
            autoComplete="current-password"
            error={error ?? undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="tfa-password" variant={mode === "disable" ? "destructive" : "default"} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} {mode === "disable" ? "Turn off" : "Make new codes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Shown once, right after the codes are made. */
function RecoveryCodesDialog({ codes, email, onClose }: { codes: string[]; email: string; onClose: () => void }) {
  const text = `EventoraX recovery codes for ${email}\nEach code works once. Keep them somewhere safe.\n\n${codes.join("\n")}\n`

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Recovery codes copied")
    } catch {
      toast.error("Couldn't copy. Select the codes and copy them by hand.")
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "eventorax-recovery-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save your recovery codes</DialogTitle>
          <DialogDescription>
            If you lose your phone, each code lets you log in once. You won't see them again after closing this.
          </DialogDescription>
        </DialogHeader>
        <ol className="grid grid-cols-2 gap-2 rounded-xl bg-[#faf8ff] p-4 font-mono text-sm text-[#0f172a]">
          {codes.map((c) => (
            <li key={c} className="select-all text-center">
              {c}
            </li>
          ))}
        </ol>
        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={copy}>
              <Copy /> Copy
            </Button>
            <Button variant="outline" onClick={download}>
              <Download /> Download
            </Button>
          </div>
          <Button onClick={onClose}>I've saved them</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
