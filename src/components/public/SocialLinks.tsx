import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlatform } from "@/context/PlatformContext"

const ICONS = { facebook: Facebook, instagram: Instagram, linkedin: Linkedin, x: Twitter, youtube: Youtube } as const
const LABELS = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", x: "X (Twitter)", youtube: "YouTube" } as const

/** Social media links from System settings → Website. Renders nothing when none are set. */
export function SocialLinks({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const social = usePlatform().platform?.social
  const links = social ? (Object.keys(ICONS) as (keyof typeof ICONS)[]).filter((k) => social[k]) : []
  if (!social || links.length === 0) return null
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {links.map((k) => {
        const Icon = ICONS[k]
        return (
          <a
            key={k}
            href={social[k]}
            target="_blank"
            rel="noreferrer"
            aria-label={LABELS[k]}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              tone === "dark" ? "bg-white/5 text-[#94a3b8] hover:bg-white/10 hover:text-white" : "border border-[#e9e4ff] bg-white text-[#7c3aed] hover:bg-[#f5f3ff]"
            )}
          >
            <Icon className="h-4 w-4" />
          </a>
        )
      })}
    </div>
  )
}
