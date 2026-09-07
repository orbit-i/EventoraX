"use client"

/**
 * modal.tsx — EventoraX premium modal system
 *
 * Wraps @radix-ui/react-dialog with a glassmorphic overlay, polished
 * card container, smooth enter/exit micro-animations, a themed header
 * with optional icon, and standardised footer action buttons that pull
 * styles from button.tsx.
 *
 * All Radix accessibility guarantees are preserved:
 *   - Focus is trapped inside the dialog while open
 *   - Esc key closes the dialog
 *   - Clicking the backdrop closes the dialog
 *   - aria-labelledby / aria-describedby are wired automatically
 */

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ─── Re-export primitive roots so consumers don't need to import Radix ────────

const Modal       = DialogPrimitive.Root
const ModalTrigger  = DialogPrimitive.Trigger
const ModalPortal   = DialogPrimitive.Portal
const ModalClose    = DialogPrimitive.Close

// ─── Overlay ──────────────────────────────────────────────────────────────────

function ModalOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="modal-overlay"
      className={cn(
        // Base
        "fixed inset-0 z-50",
        // Glassmorphic backdrop
        "bg-slate-900/40 backdrop-blur-md",
        // Radix animate-in / animate-out (tailwindcss-animate plugin)
        "data-[state=open]:animate-in  data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        "duration-200",
        className
      )}
      {...props}
    />
  )
}

// ─── Content (the card) ───────────────────────────────────────────────────────

export interface ModalContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content> {
  /** Hide the built-in X close button (e.g. when you need a fully custom header) */
  hideCloseButton?: boolean
}

function ModalContent({
  className,
  children,
  hideCloseButton = false,
  ...props
}: ModalContentProps) {
  return (
    <ModalPortal>
      <ModalOverlay />
      <DialogPrimitive.Content
        data-slot="modal-content"
        className={cn(
          // Positioning
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          // Sizing
          "w-full max-w-[calc(100vw-2rem)] sm:max-w-lg",
          // Card surface — layered to create depth
          "bg-white",
          // Top highlight edge (simulates overhead light)
          "border border-[#e9e4ff]",
          "border-t-[1.5px] border-t-white/80",
          // Shape
          "rounded-2xl",
          // Deep purple-tinted shadow — three layers
          "shadow-[0_4px_6px_rgba(0,0,0,0.05),0_20px_40px_rgba(0,0,0,0.12),0_0_0_1px_rgba(124,58,237,0.06)]",
          // Overflow clip so children can't bleed outside rounded corners
          "overflow-hidden",
          // Focus
          "outline-none",
          // Micro-animations — fade + slight rise on enter, reverse on exit
          "data-[state=open]:animate-in",
          "data-[state=open]:fade-in-0",
          "data-[state=open]:zoom-in-95",
          "data-[state=open]:slide-in-from-bottom-2",
          "data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0",
          "data-[state=closed]:zoom-out-95",
          "data-[state=closed]:slide-out-to-bottom-2",
          "duration-200 ease-out",
          className
        )}
        {...props}
      >
        {/* Subtle purple accent strip at the very top of the card */}
        <div
          aria-hidden
          className="h-[3px] w-full bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#c4b5fd]"
        />

        {/* Main content slot */}
        <div className="p-6 sm:p-7">
          {children}
        </div>

        {/* Close button */}
        {!hideCloseButton && (
          <DialogPrimitive.Close asChild>
            <button
              data-slot="modal-close"
              aria-label="Close dialog"
              className={cn(
                "absolute right-4 top-4",
                // Size & shape
                "flex h-8 w-8 items-center justify-center rounded-xl",
                // Colours
                "text-[#94a3b8]",
                // Hover
                "hover:bg-[#f5f3ff] hover:text-[#7c3aed]",
                // Focus ring
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-[#a855f7]/40 focus-visible:ring-offset-2",
                // Transition
                "transition-all duration-200",
                // Nudge it down so it clears the accent strip
                "mt-[3px]",
              )}
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </ModalPortal>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

export interface ModalHeaderProps extends React.ComponentProps<"div"> {
  /** Optional icon rendered to the left of the title */
  icon?: React.ReactNode
}

function ModalHeader({ className, icon, children, ...props }: ModalHeaderProps) {
  return (
    <div
      data-slot="modal-header"
      className={cn(
        "flex items-start gap-3 pb-5 mb-5",
        // Hairline separator below the header
        "border-b border-[#e9e4ff]",
        className
      )}
      {...props}
    >
      {icon && (
        <div className={cn(
          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          "bg-gradient-to-b from-[#f5f3ff] to-[#ede9fe]",
          "border border-[#ddd6fe]",
          "shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]",
          "text-[#7c3aed]",
        )}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

// ─── Title ────────────────────────────────────────────────────────────────────

function ModalTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="modal-title"
      className={cn(
        "font-heading text-lg font-bold leading-tight text-[#0f172a]",
        // leave right gap so text doesn't run under the X button
        "pr-8",
        className
      )}
      {...props}
    />
  )
}

// ─── Description ─────────────────────────────────────────────────────────────

function ModalDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="modal-description"
      className={cn(
        "mt-1 font-body text-sm leading-relaxed text-[#64748b]",
        className
      )}
      {...props}
    />
  )
}

// ─── Body ─────────────────────────────────────────────────────────────────────
// Optional wrapper for the main scrollable content area.

function ModalBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-body"
      className={cn("space-y-4", className)}
      {...props}
    />
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function ModalFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="modal-footer"
      className={cn(
        "mt-6 pt-5 border-t border-[#e9e4ff]",
        "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

// ─── Pre-built action buttons ─────────────────────────────────────────────────
// These pull styles from button.tsx so any future variant update propagates here.

/** Primary confirm / submit action */
function ModalActionButton({
  children = "Confirm",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="default" size="default" {...props}>
      {children}
    </Button>
  )
}

/** Secondary cancel / dismiss action */
function ModalCancelButton({
  children = "Cancel",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" size="default" {...props}>
      {children}
    </Button>
  )
}

/** Destructive action (delete / remove) */
function ModalDestructiveButton({
  children = "Delete",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="destructive" size="default" {...props}>
      {children}
    </Button>
  )
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  Modal,
  ModalTrigger,
  ModalPortal,
  ModalClose,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalActionButton,
  ModalCancelButton,
  ModalDestructiveButton,
}
