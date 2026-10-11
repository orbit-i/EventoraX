import { RotateCw, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePlatform } from "@/context/PlatformContext"

/** Shown instead of dashboard pages while the platform is in maintenance mode. */
export function MaintenanceScreen() {
  const { platform, refresh } = usePlatform()
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-[#e9e4ff] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Wrench className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-[#0f172a]">We'll be right back</h1>
        <p className="mt-2 text-sm text-[#64748b]">
          {platform?.maintenance.message || `${platform?.name ?? "EventoraX"} is down for a short maintenance. Your data is safe.`}
        </p>
        <Button variant="outline" className="mt-6" onClick={refresh}>
          <RotateCw /> Check again
        </Button>
      </div>
    </div>
  )
}
