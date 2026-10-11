/** GET /platform — public platform info used on every page */
export interface PlatformInfo {
  name: string
  logoUrl: string | null
  faviconUrl: string | null
  banner: { text: string; tone: "info" | "warning" | "success"; link: string | null; linkLabel: string | null } | null
  maintenance: { enabled: boolean; message: string | null }
  seo: { title: string; description: string }
  trialDays: number
  maxUploadMb: number
}
