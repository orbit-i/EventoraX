import { useCallback } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"

/** Show / hide a speaker, sponsor or session on the public event page (with Undo). */
export function useVisibilityToggle(resource: "speakers" | "sponsors" | "sessions", onChanged: () => void) {
  const toggle = useCallback(
    async (item: { id: string; displayPublic: boolean }, label: string, undoing = false) => {
      const next = !item.displayPublic
      try {
        await api.patch(`/${resource}/${item.id}`, { displayPublic: next })
        onChanged()
        if (!undoing) {
          toast.success(next ? `${label} is now shown on the public page` : `${label} is now hidden from the public page`, {
            action: { label: "Undo", onClick: () => void toggle({ id: item.id, displayPublic: next }, label, true) },
          })
        }
      } catch (err) {
        toast.error(errorMessage(err))
      }
    },
    [resource, onChanged]
  )
  return toggle
}