import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { MinusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-3 has-disabled:opacity-50",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#e9e4ff] bg-white text-lg font-semibold text-[#0f172a] shadow-sm transition-all duration-200 outline-none first:rounded-l-xl last:rounded-r-xl data-[active=true]:border-[#7c3aed] data-[active=true]:ring-2 data-[active=true]:ring-[#7c3aed]/30 data-[active=true]:ring-offset-1 data-[active=true]:z-10 aria-invalid:border-[#dc2626] aria-invalid:ring-[#dc2626]/20 data-[active=true]:aria-invalid:border-[#dc2626] data-[active=true]:aria-invalid:ring-[#dc2626]/20",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-[#7c3aed] h-5 w-0.5 duration-1000" />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div 
      data-slot="input-otp-separator" 
      role="separator" 
      className={cn("text-[#ddd6fe]", className)}
      {...props}
    >
      <MinusIcon className="size-4" />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }