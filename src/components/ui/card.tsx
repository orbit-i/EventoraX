import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ─── Card variants ────────────────────────────────────────────────────────────
//
// default  — form sections, settings panels, content containers
//            No hover lift. Subtle inset shadow. Clean white surface.
//
// elevated — stat cards, feature cards, standalone interactive cards
//            Hover lift + purple glow bloom. Top accent gradient strip.
//
// outlined — billing plan cards, selection-oriented containers
//            Border-only treatment. Active state via `data-active` attribute.
//            Ring highlight on active without background change.

const cardVariants = cva(
  // Base shared across all variants
  [
    "relative flex flex-col gap-0 rounded-2xl text-[#0f172a]",
    "transition-all duration-300 ease-out",
    "overflow-hidden",       // clips accent strip and absolute badges
  ].join(" "),
  {
    variants: {
      variant: {
        // ── default ──────────────────────────────────────────────────────────
        default: [
          "bg-white border border-[#e9e4ff]",
          // Layered shadow: neutral lift + faint purple tint
          "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(124,58,237,0.06)]",
          // Subtle inset top highlight — simulates overhead light on the card surface
          "before:absolute before:inset-x-0 before:top-0 before:h-px",
          "before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent",
          // Hover: border deepens slightly, shadow sharpens — no lift
          "hover:border-[#ddd6fe]",
          "hover:shadow-[0_2px_6px_rgba(0,0,0,0.07),0_8px_20px_rgba(124,58,237,0.09)]",
        ].join(" "),

        // ── elevated ─────────────────────────────────────────────────────────
        elevated: [
          "bg-white border border-[#e9e4ff]",
          // Deeper starting shadow
          "shadow-[0_2px_8px_rgba(0,0,0,0.07),0_6px_20px_rgba(124,58,237,0.08)]",
          // Hover: lift + purple glow bloom
          "hover:-translate-y-1",
          "hover:shadow-[0_8px_24px_rgba(0,0,0,0.10),0_0_0_1px_rgba(196,181,253,0.4),0_12px_32px_rgba(124,58,237,0.14)]",
          "hover:border-[#c4b5fd]",
        ].join(" "),

        // ── outlined ─────────────────────────────────────────────────────────
        outlined: [
          "bg-white border-2 border-[#e9e4ff]",
          "shadow-none",
          // Hover: border sharpens to purple, gentle lift
          "hover:-translate-y-0.5 hover:border-[#c4b5fd]",
          "hover:shadow-[0_4px_16px_rgba(124,58,237,0.10)]",
          // Active state — applied via data-active="true" on the element
          "data-[active=true]:border-[#7c3aed]",
          "data-[active=true]:shadow-[0_0_0_3px_rgba(124,58,237,0.12),0_8px_24px_rgba(124,58,237,0.14)]",
          "data-[active=true]:hover:shadow-[0_0_0_3px_rgba(124,58,237,0.16),0_12px_28px_rgba(124,58,237,0.18)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// ─── Card ─────────────────────────────────────────────────────────────────────

export interface CardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardVariants> {
  /** Pass true to activate the outlined ring (only meaningful on variant="outlined") */
  active?: boolean
}

function Card({ className, variant, active, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-active={active ? "true" : undefined}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}

// ─── Accent strip (rendered by CardHeader on elevated/outlined variants) ──────
// A thin top-of-card gradient bar. Elevated cards always show it.
// Pass accentStrip={true} on default cards if you want it explicitly.

function CardAccentStrip({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-[3px] w-full flex-shrink-0",
        "bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#c4b5fd]",
        className
      )}
    />
  )
}

// ─── CardHeader ──────────────────────────────────────────────────────────────
// Simplified — no CSS container queries, no grid magic.
// Optional `icon` prop renders a themed icon well to the left of the text.
// Optional `accentStrip` prop renders the purple gradient bar above the header.

export interface CardHeaderProps extends React.ComponentProps<"div"> {
  /** Lucide icon element or any ReactNode to display in the icon well */
  icon?: React.ReactNode
  /** Render the purple accent gradient strip at the very top of this header */
  accentStrip?: boolean
}

function CardHeader({
  className,
  icon,
  accentStrip = false,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <>
      {accentStrip && <CardAccentStrip />}
      <div
        data-slot="card-header"
        className={cn(
          "flex items-start gap-3 px-6 pt-6 pb-4",
          className
        )}
        {...props}
      >
        {icon && (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5",
              // Neumorphic inset well — matches input.tsx icon container style
              "bg-gradient-to-b from-[#f5f3ff] to-[#ede9fe]",
              "border border-[#ddd6fe]",
              "shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]",
              "text-[#7c3aed]",
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  )
}

// ─── CardTitle ────────────────────────────────────────────────────────────────

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-bold leading-tight text-[#0f172a] text-lg",
        className
      )}
      {...props}
    />
  )
}

// ─── CardDescription ─────────────────────────────────────────────────────────

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[#64748b] text-sm leading-relaxed mt-0.5", className)}
      {...props}
    />
  )
}

// ─── CardContent ─────────────────────────────────────────────────────────────

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 pb-6", className)}
      {...props}
    />
  )
}

// ─── CardFooter ──────────────────────────────────────────────────────────────

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-3 px-6 py-4",
        "border-t border-[#e9e4ff]",
        className
      )}
      {...props}
    />
  )
}

// ─── CardAction ──────────────────────────────────────────────────────────────
// Optional slot for a right-aligned action (button, badge, link) in a header.

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "ml-auto shrink-0 text-[#7c3aed] hover:text-[#6d28d9] transition-colors duration-200",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardAccentStrip,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
}
