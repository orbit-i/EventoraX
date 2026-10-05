import { Link as RouterLink, type LinkProps } from "react-router"

/**
 * Lets code written for Next.js (`<Link href="...">`) run on React Router
 * (`<Link to="...">`). Used by the pages ported from the events module.
 */
type NextStyleLinkProps = Omit<LinkProps, "to"> & { href: string }

export default function Link({ href, ...rest }: NextStyleLinkProps) {
  return <RouterLink to={href} {...rest} />
}