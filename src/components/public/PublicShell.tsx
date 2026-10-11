import type { ReactNode } from "react"
import { Link } from "react-router"
import type { PublicOrgBrand } from "@/types/public"

const HEX = /^#[0-9a-fA-F]{6}$/

/** The organization's colour (falls back to EventoraX purple). */
export function brandColor(org: PublicOrgBrand | null | undefined) {
  return org?.primaryColor && HEX.test(org.primaryColor) ? org.primaryColor : "#7c3aed"
}

/** Frame for an organization's public pages: their logo + name on top, "Powered by EventoraX" at the bottom. */
export function PublicShell({ org, children }: { org: PublicOrgBrand | null; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7fc]">
      <header className="border-b border-[#e9e4ff] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          {org ? (
            <Link to={`/o/${org.slug}`} className="flex min-w-0 items-center gap-3">
              {org.logoUrl ? (
                <img src={org.logoUrl} alt="" className="h-9 w-9 rounded-lg bg-white object-contain ring-1 ring-[#e9e4ff]" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: brandColor(org) }}>
                  {org.name.charAt(0)}
                </span>
              )}
              <span className="truncate font-semibold text-[#0f172a]">{org.name}</span>
            </Link>
          ) : (
            <span className="h-9" />
          )}
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[#e9e4ff] bg-white py-6 text-center text-xs text-[#94a3b8]">
        Event pages powered by{" "}
        <Link to="/" className="font-semibold text-[#7c3aed] hover:underline">
          EventoraX
        </Link>{" "}
        ·{" "}
        <Link to="/verify" className="hover:underline">
          Verify a certificate
        </Link>{" "}
        ·{" "}
        <Link to="/privacy" className="hover:underline">
          Privacy
        </Link>
      </footer>
    </div>
  )
}
