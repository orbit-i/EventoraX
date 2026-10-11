import { Loader2 } from "lucide-react"

/** Shown while a page's code is downloading (pages are loaded on demand, see App.tsx). */
export function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${fullScreen ? "min-h-screen bg-[#f3f0ff]" : "min-h-[50vh]"}`} role="status" aria-label="Loading">
      <Loader2 className="h-7 w-7 animate-spin text-[#7c3aed]" />
    </div>
  )
}
