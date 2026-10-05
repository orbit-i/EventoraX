/**
 * Next.js navigation hooks implemented with React Router, so the pages ported
 * from the events module work unchanged.
 */
import { useMemo } from "react"
import {
  useLocation,
  useNavigate,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
} from "react-router"

export function useRouter() {
  const navigate = useNavigate()
  return useMemo(
    () => ({
      push: (href: string) => navigate(href),
      replace: (href: string) => navigate(href, { replace: true }),
      back: () => navigate(-1),
      refresh: () => navigate(0),
    }),
    [navigate]
  )
}

export function useParams<T extends Record<string, string>>(): T {
  return useRouterParams() as T
}

export function useSearchParams(): URLSearchParams {
  const [params] = useRouterSearchParams()
  return params
}

export function usePathname(): string {
  return useLocation().pathname
}