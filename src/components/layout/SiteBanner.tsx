import { useState } from "react"
import { Link } from "react-router"
import { CheckCircle2, Info, Megaphone, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlatform } from "@/context/PlatformContext"

const DISMISS_KEY = "evx_banner_dismissed"

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY)
  } catch {
    return null
  }
}

/** The sitewide announcement banner from System settings. Dismissing hides that exact message only. */
export function SiteBanner({ className }: { className?: string }) {
  const { platform } = usePlatform()
  const [dismissed, setDismissed] = useState(readDismissed)
  const banner = platform?.banner
  if (!banner || dismissed === banner.text) return null

  const Icon = banner.tone === "warning" ? Megaphone : banner.tone === "success" ? CheckCircle2 : Info
  const external = banner.link && /^https?:\/\//.test(banner.link)

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, banner!.text)
    } catch {
      // storage blocked — hides until reload
    }
    setDismissed(banner!.text)
  }

  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-3 border-b px-4 py-2 text-sm md:px-6",
        banner.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-900",
        banner.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
        banner.tone === "info" && "border-[#ddd6fe] bg-[#f5f3ff] text-[#4c1d95]",
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <p className="flex-1">
        {banner.text}
        {banner.link &&
          (external ? (
            <a href={banner.link} target="_blank" rel="noreferrer" className="ml-2 font-semibold underline underline-offset-2">
              {banner.linkLabel || "Learn more"}
            </a>
          ) : (
            <Link to={banner.link} className="ml-2 font-semibold underline underline-offset-2">
              {banner.linkLabel || "Learn more"}
            </Link>
          ))}
      </p>
      <button type="button" onClick={dismiss} className="rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100" aria-label="Dismiss announcement">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
