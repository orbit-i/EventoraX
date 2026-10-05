import { useCallback, useEffect, useRef, useState } from "react"
import { api, errorMessage, type ListMeta } from "@/lib/api"

interface ApiState<T> {
  data: T | null
  meta: ListMeta | null
  loading: boolean
  error: string | null
}

/**
 * Loads `path` from the API and keeps { data, meta, loading, error } up to date.
 * - Pass null to skip loading (e.g. until an event is selected).
 * - Changing `path` cancels the previous request, so fast typing never shows stale results.
 * - reload() fetches again (call it after creating / editing / deleting).
 */
export function useApi<T>(path: string | null) {
  const [state, setState] = useState<ApiState<T>>({ data: null, meta: null, loading: path !== null, error: null })
  const [version, setVersion] = useState(0)
  const hasData = useRef(false)

  useEffect(() => {
    if (path === null) {
      setState({ data: null, meta: null, loading: false, error: null })
      hasData.current = false
      return
    }
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))

    api
      .getList<unknown>(path, { signal: controller.signal })
      .then((res) => {
        hasData.current = true
        setState({ data: res.data as unknown as T, meta: res.meta, loading: false, error: null })
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setState((s) => ({ ...s, loading: false, error: errorMessage(err, "Couldn't load this data.") }))
      })

    return () => controller.abort()
  }, [path, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  return {
    ...state,
    /** true only on the very first load (later reloads keep showing the old data) */
    initialLoading: state.loading && !hasData.current,
    reload,
  }
}