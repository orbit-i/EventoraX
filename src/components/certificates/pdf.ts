import { useEffect, useState } from "react"
import { api, errorMessage } from "@/lib/api"

/**
 * Loads a PDF from the API (with the login token) and gives back a temporary
 * blob: URL that an <iframe> can show. Pass null to show nothing.
 */
export function usePdfUrl(path: string | null) {
  const [state, setState] = useState<{ url: string | null; loading: boolean; error: string | null }>({ url: null, loading: false, error: null })

  useEffect(() => {
    if (!path) {
      setState({ url: null, loading: false, error: null })
      return
    }
    const controller = new AbortController()
    let objectUrl: string | null = null
    setState((s) => ({ ...s, loading: true, error: null }))
    api
      .blob(path, { signal: controller.signal })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setState({ url: objectUrl, loading: false, error: null })
      })
      .catch((err) => {
        if (!controller.signal.aborted) setState({ url: null, loading: false, error: errorMessage(err, "Couldn't load the preview.") })
      })
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [path])

  return state
}

/** Opens an API PDF in a new tab. The tab is opened first so pop-up blockers allow it. */
export async function openPdf(path: string) {
  const tab = window.open("", "_blank")
  try {
    const blob = await api.blob(path)
    const url = URL.createObjectURL(blob)
    if (tab) tab.location.href = url
    else window.location.href = url
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    tab?.close()
    throw err
  }
}
