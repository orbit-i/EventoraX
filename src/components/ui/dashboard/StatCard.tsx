import type { LucideIcon } from "lucide-react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent, CardAccentStrip } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
  trend: "up" | "down"
}

export default function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
  const isPositive = trend === "up"

  return (
    <Card variant="elevated">
      {/* Purple accent strip — identifies these as primary metric cards */}
      <CardAccentStrip />

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">

          {/* ── Left: metric text ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-2.5 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
              {title}
            </p>

            {/* Value — gradient text for visual weight */}
            <p
              className={cn(
                "text-2xl font-bold leading-none tabular-nums",
                "bg-gradient-to-r from-[#0f172a] to-[#3b0764]",
                "bg-clip-text text-transparent",
              )}
            >
              {value}
            </p>

            {/* Trend badge */}
            <div
              className={cn(
                "inline-flex w-fit items-center gap-1",
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                isPositive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50   text-rose-600   border border-rose-200",
              )}
            >
              {isPositive
                ? <ArrowUpRight   className="w-3 h-3 shrink-0" />
                : <ArrowDownRight className="w-3 h-3 shrink-0" />}
              <span>{change}</span>
            </div>
          </div>

          {/* ── Right: icon well ──────────────────────────────────────────── */}
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              // 3D inset surface — matches the icon well in CardHeader
              "bg-gradient-to-b from-[#f5f3ff] to-[#ede9fe]",
              "border border-[#ddd6fe]",
              "shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(0,0,0,0.02)]",
              // Glow on card hover — uses group-hover so the card drives it
              "transition-all duration-300",
              "group-hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_0_12px_rgba(124,58,237,0.20)]",
              "group-hover:border-[#c4b5fd]",
            )}
          >
            <Icon className="w-5 h-5 text-[#7c3aed]" />
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
