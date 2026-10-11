import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router"
import { api } from "@/lib/api"
import type { ContactInfo } from "@/types/dashboard"

export interface LegalSection {
  title: string
  body: ReactNode
}

/** The contact email from System settings (falls back to a generic line). */
function useContactEmail() {
  const [email, setEmail] = useState<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    api
      .get<ContactInfo>("/contact/info", { auth: false, signal: controller.signal })
      .then((i) => setEmail(i.email || null))
      .catch(() => undefined)
    return () => controller.abort()
  }, [])
  return email
}

/** Shared layout for Terms and Privacy: numbered sections with a table of contents. */
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: ReactNode; sections: LegalSection[] }) {
  const email = useContactEmail()
  return (
    <main className="pt-14">
      <section className="bg-[#f3f0ff] py-20 md:py-28">
        <div className="content-max mx-auto max-w-4xl">
          <p className="mb-4 font-body text-sm font-semibold uppercase tracking-[0.1em] text-[#a78bfa]">Legal</p>
          <h1 className="mb-3 font-heading text-4xl font-bold tracking-[-0.02em] text-[#0f172a] md:text-5xl">{title}</h1>
          <p className="mb-8 font-body text-sm text-[#64748b]">Last updated: {updated}</p>
          <div className="rounded-2xl border border-[#e9e4ff] bg-white p-8 shadow-sm md:p-10">
            <div className="mb-8 font-body text-base leading-relaxed text-[#475569]">{intro}</div>
            <nav aria-label="Contents" className="mb-10 rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-5">
              <p className="mb-2 font-body text-sm font-semibold text-[#0f172a]">Contents</p>
              <ol className="grid gap-1 font-body text-sm text-[#7c3aed] sm:grid-cols-2">
                {sections.map((s, i) => (
                  <li key={s.title}>
                    <a href={`#section-${i + 1}`} className="hover:underline">
                      {i + 1}. {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            {sections.map((s, i) => (
              <section key={s.title} id={`section-${i + 1}`} className="mb-8 scroll-mt-24">
                <h2 className="mb-3 font-heading text-xl font-bold text-[#0f172a]">
                  {i + 1}. {s.title}
                </h2>
                <div className="space-y-3 font-body text-base leading-relaxed text-[#475569] [&_li]:ml-5 [&_li]:list-disc">{s.body}</div>
              </section>
            ))}
            <section className="border-t border-[#f1f5f9] pt-6">
              <h2 className="mb-2 font-heading text-xl font-bold text-[#0f172a]">Contact</h2>
              <p className="font-body text-base text-[#475569]">
                Questions about this page? Write to{" "}
                {email ? (
                  <a href={`mailto:${email}`} className="font-medium text-[#7c3aed] hover:underline">
                    {email}
                  </a>
                ) : (
                  "us"
                )}{" "}
                or use our{" "}
                <Link to="/contact" className="font-medium text-[#7c3aed] hover:underline">
                  contact form
                </Link>
                .
              </p>
            </section>
          </div>
          <div className="mt-8 text-center">
            <Link to="/" className="font-body text-sm font-medium text-[#7c3aed] hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
