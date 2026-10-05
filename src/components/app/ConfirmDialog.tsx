import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react"
import { AlertTriangle, Info } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export interface ConfirmOptions {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** "danger" = red button + warning icon (delete, cancel, discard) */
  tone?: "danger" | "default"
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/**
 * One confirmation dialog for the whole app.
 *   const confirm = useConfirm()
 *   if (await confirm({ title: "Delete speaker?", tone: "danger" })) { ... }
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
  }

  const danger = options?.tone === "danger"

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={options !== null} onOpenChange={(open) => !open && close(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  danger ? "bg-rose-50 text-rose-600" : "bg-violet-50 text-violet-600"
                }`}
              >
                {danger ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
              </div>
              <div className="space-y-1.5 text-left">
                <AlertDialogTitle>{options?.title}</AlertDialogTitle>
                {options?.description && <AlertDialogDescription>{options.description}</AlertDialogDescription>}
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => close(false)}>
              {options?.cancelLabel ?? "Cancel"}
            </Button>
            <Button variant={danger ? "danger" : "default"} onClick={() => close(true)} autoFocus>
              {options?.confirmLabel ?? "Confirm"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>")
  return ctx
}