/** GET /platform/website — home-page content managed in Superadmin → System settings → Website */
export interface Testimonial {
  quote: string
  name: string
  role: string
  organization: string
}

export interface TrustedLogo {
  name: string
  logoUrl: string
}

export interface WebsiteContent {
  stats: { organizations: number; events: number; certificates: number } | null
  testimonials: Testimonial[]
  logos: TrustedLogo[]
}
