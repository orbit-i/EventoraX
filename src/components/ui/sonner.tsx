import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5 text-[#16a34a]" />,
        info: <InfoIcon className="size-5 text-[#7c3aed]" />,
        warning: <TriangleAlertIcon className="size-5 text-[#d97706]" />,
        error: <OctagonXIcon className="size-5 text-[#dc2626]" />,
        loading: <Loader2Icon className="size-5 text-[#7c3aed] animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#0f172a",
          "--normal-border": "#e9e4ff",
          "--border-radius": "12px",
          "--success-bg": "#f0fdf4",
          "--success-text": "#15803d",
          "--success-border": "#bbf7d0",
          "--info-bg": "#f5f3ff",
          "--info-text": "#7c3aed",
          "--info-border": "#ddd6fe",
          "--warning-bg": "#fffbeb",
          "--warning-text": "#b45309",
          "--warning-border": "#fde68a",
          "--error-bg": "#fef2f2",
          "--error-text": "#b91c1c",
          "--error-border": "#fecaca",
          "--font-size": "14px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }