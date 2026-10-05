import { useCallback } from "react"
import { useSearchParams } from "react-router"

/**
 * Page state (filters, search, page number) kept in the URL, so refresh,
 * the Back button and shared links all show the same view.
 */
export function useUrlState<K extends string>(defaults: Record<K, string>) {
  const [params, setParams] = useSearchParams()

  const values = Object.fromEntries(
    (Object.keys(defaults) as K[]).map((key) => [key, params.get(key) ?? defaults[key]])
  ) as Record<K, string>

  /** Change one or more values. Any change except "page" sends you back to page 1. */
  const set = useCallback(
    (changes: Partial<Record<K, string>>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(changes) as [K, string | undefined][]) {
            if (value === undefined || value === "" || value === defaults[key]) next.delete(key)
            else next.set(key, value)
          }
          if (!("page" in changes)) next.delete("page")
          return next
        },
        { replace: true }
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams]
  )

  /** Remove every filter (keeps the selected event). */
  const reset = useCallback(
    (keep: string[] = ["eventId"]) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams()
          for (const key of keep) {
            const value = prev.get(key)
            if (value) next.set(key, value)
          }
          return next
        },
        { replace: true }
      )
    },
    [setParams]
  )

  return { values, set, reset }
}