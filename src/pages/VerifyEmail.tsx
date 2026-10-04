import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { AuthShell, FormError, FormSuccess } from "@/components/auth/AuthShell"
import { api, errorMessage } from "@/lib/api"
import { useAuth, homeFor } from "@/context/AuthContext"

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""
  const { status, user, refresh } = useAuth()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const started = useRef(false)

  useEffect(() => {
    // React runs effects twice in development; a verify token only works once, so guard it.
    if (started.current) return
    started.current = true

    if (!token) {
      setResult({ ok: false, message: "This verification link is missing its token." })
      return
    }
    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`, { auth: false })
      .then(() => {
        setResult({ ok: true, message: "Your email address has been verified." })
        void refresh()
      })
      .catch((err) => setResult({ ok: false, message: errorMessage(err) }))
  }, [token, refresh])

  const next = status === "authenticated" && user ? homeFor(user) : "/login"

  return (
    <AuthShell title="Email verification">
      {!result ? (
        <div className="flex items-center gap-3 text-sm text-[#64748b]">
          <Spinner /> Verifying your email...
        </div>
      ) : (
        <div className="space-y-4">
          {result.ok ? <FormSuccess message={result.message} /> : <FormError message={result.message} />}
          <Button asChild className="w-full">
            <Link to={next}>{next === "/login" ? "Go to log in" : "Go to dashboard"}</Link>
          </Button>
        </div>
      )}
    </AuthShell>
  )
}