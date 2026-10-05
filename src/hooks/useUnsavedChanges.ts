import { useEffect } from "react"
import { useBeforeUnload, useBlocker } from "react-router"
import { useConfirm } from "@/components/app/ConfirmDialog"

/**
 * While `dirty` is true:
 *  - leaving the page inside the app asks "Discard unsaved changes?"
 *  - closing or refreshing the tab shows the browser's own warning
 */
export function useUnsavedChanges(dirty: boolean) {
  const confirm = useConfirm()
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname)

  useEffect(() => {
    if (blocker.state !== "blocked") return
    void confirm({
      title: "Discard unsaved changes?",
      description: "You have changes that haven't been saved. If you leave now, they will be lost.",
      confirmLabel: "Discard changes",
      cancelLabel: "Keep editing",
      tone: "danger",
    }).then((leave) => (leave ? blocker.proceed() : blocker.reset()))
  }, [blocker, confirm])

  useBeforeUnload((event) => {
    if (dirty) event.preventDefault()
  })
}