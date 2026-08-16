"use client"

import * as React from "react"
import { Eye, EyeOff, ChevronDown, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Base shared field classes ──────────────────────────────────────────────
const fieldBase = [
  // Shape & surface
  "w-full rounded-2xl border border-[#e2e8f0]",
  // 3D inset gradient surface
  "bg-gradient-to-b from-white to-[#faf8ff]",
  // Inset depth shadow — the neumorphic "pressed in" feel
  "shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(0,0,0,0.02)]",
  // Typography
  "font-body text-sm text-[#0f172a] placeholder:text-[#94a3b8]",
  // Smooth transitions
  "transition-all duration-200 ease-out outline-none",
  // Hover — border lifts slightly
  "hover:border-[#c4b5fd] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(196,181,253,0.3)]",
  // Focus — luminous purple ring + glow
  "focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/40",
  "focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_0_15px_rgba(168,85,247,0.25)]",
  // Disabled
  "disabled:pointer-events-none disabled:opacity-50 disabled:bg-[#f8f8fb]",
].join(" ")

// Error override classes (applied when error prop is present)
const fieldError = [
  "border-rose-400",
  "hover:border-rose-400",
  "focus:border-rose-500 focus:ring-2 focus:ring-rose-400/40",
  "focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_0_12px_rgba(244,63,94,0.20)]",
].join(" ")

// ─── Wrapper: label + field + helper/error ───────────────────────────────────
interface FieldWrapperProps {
  label?: string
  error?: string
  helper?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

function FieldWrapper({
  label,
  error,
  helper,
  required,
  className,
  children,
}: FieldWrapperProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="font-body text-sm font-semibold text-[#0f172a] select-none">
          {label}
          {required && (
            <span className="ml-0.5 text-rose-500 text-xs">*</span>
          )}
        </label>
      )}

      {children}

      {/* Error message */}
      {error && (
        <p className="flex items-center gap-1.5 font-body text-xs font-medium text-rose-500 mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      {/* Helper text — only shown when no error */}
      {helper && !error && (
        <p className="font-body text-xs text-[#94a3b8] mt-0.5">{helper}</p>
      )}
    </div>
  )
}

// ─── 1. Text Input (text, email, tel, number, etc.) ─────────────────────────
export interface InputProps extends React.ComponentProps<"input"> {
  label?: string
  error?: string
  helper?: string
  icon?: React.ReactNode
}

function Input({
  label,
  error,
  helper,
  icon,
  className,
  type = "text",
  required,
  ...props
}: InputProps) {
  return (
    <FieldWrapper
      label={label}
      error={error}
      helper={helper}
      required={required}
      className={className}
    >
      <div className="relative">
        {/* Left icon */}
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a78bfa] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type}
          data-slot="input"
          aria-invalid={!!error}
          required={required}
          className={cn(
            fieldBase,
            error && fieldError,
            "h-11 px-4 py-2.5",
            icon && "pl-10",
          )}
          {...props}
        />
      </div>
    </FieldWrapper>
  )
}

// ─── 2. Password Input ───────────────────────────────────────────────────────
export interface PasswordInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  label?: string
  error?: string
  helper?: string
}

function PasswordInput({
  label,
  error,
  helper,
  className,
  required,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false)

  return (
    <FieldWrapper
      label={label}
      error={error}
      helper={helper}
      required={required}
      className={className}
    >
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          data-slot="input"
          aria-invalid={!!error}
          required={required}
          className={cn(
            fieldBase,
            error && fieldError,
            "h-11 px-4 py-2.5 pr-11",
          )}
          {...props}
        />
        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2",
            "text-[#94a3b8] hover:text-[#7c3aed]",
            "transition-colors duration-200",
            "rounded-lg p-0.5 focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-[#a855f7]/40",
          )}
        >
          {visible
            ? <EyeOff className="w-4 h-4" />
            : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </FieldWrapper>
  )
}

// ─── 3. Select Input ─────────────────────────────────────────────────────────
export interface SelectOption {
  value: string
  label: string
}

export interface SelectInputProps
  extends Omit<React.ComponentProps<"select">, "children"> {
  label?: string
  error?: string
  helper?: string
  options: SelectOption[]
  placeholder?: string
}

function SelectInput({
  label,
  error,
  helper,
  options,
  placeholder,
  className,
  required,
  ...props
}: SelectInputProps) {
  return (
    <FieldWrapper
      label={label}
      error={error}
      helper={helper}
      required={required}
      className={className}
    >
      <div className="relative">
        <select
          data-slot="select"
          aria-invalid={!!error}
          required={required}
          className={cn(
            fieldBase,
            error && fieldError,
            // Extra right padding for the custom arrow
            "h-11 px-4 py-2.5 pr-10",
            // Hide native arrow across browsers
            "appearance-none",
            // Cursor
            "cursor-pointer",
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom arrow — non-interactive, pointer-events-none */}
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#a78bfa]">
          <ChevronDown className="w-4 h-4" />
        </span>
      </div>
    </FieldWrapper>
  )
}

// ─── 4. Textarea Input ───────────────────────────────────────────────────────
export interface TextareaInputProps extends React.ComponentProps<"textarea"> {
  label?: string
  error?: string
  helper?: string
}

function TextareaInput({
  label,
  error,
  helper,
  className,
  rows = 4,
  required,
  ...props
}: TextareaInputProps) {
  return (
    <FieldWrapper
      label={label}
      error={error}
      helper={helper}
      required={required}
      className={className}
    >
      <textarea
        data-slot="textarea"
        aria-invalid={!!error}
        required={required}
        rows={rows}
        className={cn(
          fieldBase,
          error && fieldError,
          "px-4 py-3",
          // Vertical resize only — keeps the horizontal layout stable
          "resize-y min-h-[110px]",
        )}
        {...props}
      />
    </FieldWrapper>
  )
}

// ─── Legacy bare Input (keeps backwards compatibility) ───────────────────────
// Pages using the old <Input /> directly (Settings, dashboard header search)
// will continue working unchanged since this re-exports the same primitive.

export { Input, PasswordInput, SelectInput, TextareaInput }
