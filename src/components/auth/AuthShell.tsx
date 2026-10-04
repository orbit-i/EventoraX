import type { ReactNode } from "react"
import { Link } from "react-router"
import { AlertCircle, CheckCircle2 } from "lucide-react"

/** Shared layout for login, register, password and invite pages. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f3f0ff] px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-[#7c3aed] rounded-xl flex items-center justify-center shadow-lg shadow-[#7c3aed]/25">
            <span className="text-white font-bold">E</span>
          </div>
          <span className="text-2xl font-bold text-[#0f172a]">
            Eventora<span className="text-[#7c3aed]">X</span>
          </span>
        </Link>

        <div className="bg-white rounded-2xl border border-[#e9e4ff] shadow-sm p-8">
          <h1 className="text-2xl font-bold text-[#0f172a]">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-[#64748b]">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-6 text-center text-sm text-[#64748b]">{footer}</div>}
      </div>
    </main>
  )
}

export function FormError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export function FormSuccess({ message }: { message: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export const linkClass = "font-semibold text-[#7c3aed] hover:text-[#6d28d9] hover:underline"