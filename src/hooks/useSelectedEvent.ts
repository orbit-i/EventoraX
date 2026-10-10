import { useCallback, useEffect } from "react"
import { useSearchParams } from "react-router"

const STORAGE_KEY = "evx_selected_event"

/**
 * The event chosen in the EventPicker. Stored in the URL (?eventId=) and remembered
 * in the browser, so moving between Registrations, Speakers, Sponsors and Schedule
 * keeps the same event selected.
 */
export function useSelectedEvent(): [string, (eventId: string) => void] {
  const [params, setParams] = useSearchParams()
  const fromUrl = params.get("eventId") ?? ""

  // No event in the URL yet → bring back the last one used.
  useEffect(() => {
    if (fromUrl) {
      localStorage.setItem(STORAGE_KEY, fromUrl)
      return
    }
    const remembered = localStorage.getItem(STORAGE_KEY)
    if (remembered) {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set("eventId", remembered)
          return next
        },
        { replace: true }
      )
    }
  }, [fromUrl, setParams])

  const select = useCallback(
    (eventId: string) => {
      if (eventId) localStorage.setItem(STORAGE_KEY, eventId)
      else localStorage.removeItem(STORAGE_KEY)
      // A new event starts with clean filters.
      setParams(eventId ? { eventId } : {}, { replace: true })
    },
    [setParams]
  )

  return [fromUrl, select]
}
