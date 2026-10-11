import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { api, onMaintenance } from "@/lib/api"
import type { PlatformInfo } from "@/types/platform"

const REFRESH_MS = 60_000

interface PlatformContextValue {
  platform: PlatformInfo | null
  refresh: () => void
}

const PlatformContext = createContext<PlatformContextValue>({ platform: null, refresh: () => undefined })

function setFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
  if (!link) {
    link = document.createElement("link")
    link.rel = "icon"
    document.head.appendChild(link)
  }
  link.href = href
}

/**
 * Platform-wide info from System settings: name, favicon, sitewide banner, maintenance mode, SEO.
 * Re-checked every minute, and immediately when any API call says "maintenance".
 */
export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatform] = useState<PlatformInfo | null>(null)

  const refresh = useCallback(() => {
    api
      .get<PlatformInfo>("/platform", { auth: false })
      .then(setPlatform)
      .catch(() => undefined) // the site still works with the built-in defaults
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, REFRESH_MS)
    const stop = onMaintenance(refresh)
    return () => {
      clearInterval(timer)
      stop()
    }
  }, [refresh])

  // Browser tab title, description and icon follow the settings.
  useEffect(() => {
    if (!platform) return
    if (platform.seo.title) document.title = platform.seo.title
    else if (platform.name) document.title = platform.name
    if (platform.seo.description) document.querySelector("meta[name='description']")?.setAttribute("content", platform.seo.description)
    if (platform.faviconUrl) setFavicon(platform.faviconUrl)
  }, [platform])

  return <PlatformContext.Provider value={{ platform, refresh }}>{children}</PlatformContext.Provider>
}

export function usePlatform() {
  return useContext(PlatformContext)
}
