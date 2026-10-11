import { Link } from 'react-router';
import { KeyRound, ShieldCheck, Timer, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BASE = `${window.location.origin}/api/v1/ext`;

interface Endpoint {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  title: string;
  description: string;
  params?: [string, string][];
  body?: string;
  response: string;
}

const REG_EXAMPLE = `{
  "id": "cm…",
  "eventId": "cm…",
  "refNo": "REG-D676FCA737",
  "name": "Ayesha Khan",
  "email": "ayesha@example.com",
  "phone": "+923001234567",
  "department": "Computer Science",
  "rollNo": "FA21-BCS-042",
  "category": "General",
  "status": "registered",          // registered | attended | absent | cancelled
  "source": "api",                 // web | admin | csv_import | api
  "registeredAt": "2026-10-11T11:51:03.821Z",
  "ticket": { "number": "TKT-187425F382", "qrValue": "EVXT:8f67…", "checkedIn": false, "checkedInAt": null }
}`;

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/events',
    title: 'List events',
    description: 'Your events, newest first. Archived events are left out unless you ask for them.',
    params: [
      ['status', 'upcoming | active | completed | draft | archived'],
      ['page, limit', 'pagination (limit up to 100, default 20)'],
    ],
    response: `{
  "data": [{
    "id": "cm…", "title": "Tech Summit 2026", "topic": "Cloud and AI",
    "mode": "offline",               // online | offline | hybrid
    "status": "upcoming",            // draft | upcoming | active | completed | archived
    "startsAt": "2026-10-28T13:00:00.000Z", "endsAt": "2026-10-28T16:30:00.000Z",
    "location": "Main Auditorium", "capacity": 150, "registrationOpen": true,
    "publicUrl": "https://…/e/cm…"
  }],
  "error": null,
  "meta": { "total": 1, "page": 1, "limit": 20 }
}`,
  },
  {
    method: 'GET',
    path: '/events/:id',
    title: 'Get one event',
    description: 'The event with its categories and live counts.',
    response: `{ "data": { …event, "categories": ["VIP", "Speaker"],
  "counts": { "registered": 34, "attended": 28, "absent": 2, "cancelled": 1 } }, "error": null }`,
  },
  {
    method: 'GET',
    path: '/events/:id/registrations',
    title: 'List registrations',
    description: 'Everyone registered for an event.',
    params: [
      ['status', 'registered | attended | absent | cancelled'],
      ['search', 'name, email or registration number'],
      ['page, limit', 'pagination'],
    ],
    response: `{ "data": [ …registration ], "error": null, "meta": { "total": 34, "page": 1, "limit": 20 } }`,
  },
  {
    method: 'POST',
    path: '/events/:id/registrations',
    title: 'Register someone',
    description: 'Adds an attendee and creates their QR ticket. Seat limits apply; the same email can register once per event. Set sendTicket to email the ticket PDF.',
    body: `{
  "name": "Ayesha Khan",            // required
  "email": "ayesha@example.com",    // required
  "phone": "+92 300 1234567",       // optional
  "department": "Computer Science", // optional
  "rollNo": "FA21-BCS-042",         // optional
  "category": "VIP",                // optional, one of the event's categories
  "sendTicket": true                // optional, default false
}`,
    response: `{ "data": ${REG_EXAMPLE.replace(/\n/g, '\n  ')}, "error": null }   // 201 Created`,
  },
  {
    method: 'GET',
    path: '/registrations/:id',
    title: 'Get one registration',
    description: 'A registration with its ticket.',
    response: `{ "data": ${REG_EXAMPLE.replace(/\n/g, '\n  ')}, "error": null }`,
  },
  {
    method: 'PATCH',
    path: '/registrations/:id',
    title: 'Change attendance status',
    description: 'Marking someone attended issues their certificate automatically if the event has auto-issue switched on.',
    body: `{ "status": "attended" }   // registered | attended | absent | cancelled`,
    response: `{ "data": { …registration, "status": "attended" }, "error": null }`,
  },
  {
    method: 'POST',
    path: '/check-in',
    title: 'Check a ticket in',
    description: 'Send the scanned QR text (EVXT:…) or a typed ticket number (TKT-…). The first scan wins; later scans return already_checked_in.',
    body: `{ "code": "EVXT:8f67b5aadc5f0bb3ede2e8d0a3a845f4", "eventId": "cm…" }   // eventId optional: rejects tickets of other events`,
    response: `{ "data": { "result": "checked_in",   // or "already_checked_in"
  "registrationId": "cm…", "name": "Ayesha Khan", "email": "ayesha@example.com",
  "ticketNumber": "TKT-187425F382", "eventId": "cm…", "checkedInAt": "2026-10-28T13:05:12.000Z" }, "error": null }`,
  },
  {
    method: 'GET',
    path: '/events/:id/certificates',
    title: 'List certificates',
    description: 'Certificates issued for an event.',
    response: `{ "data": [{ "id": "cm…", "eventId": "cm…", "name": "Ayesha Khan", "email": "ayesha@example.com",
  "type": "participation", "category": "General", "verifyCode": "EVX-AB12-CD34",
  "verifyUrl": "https://…/verify/EVX-AB12-CD34", "status": "valid", "revokeReason": null,
  "issuedAt": "2026-10-29T09:00:00.000Z" }], "error": null, "meta": { … } }`,
  },
  {
    method: 'GET',
    path: '/certificates/:code',
    title: 'Look up a certificate',
    description: 'One of your certificates by its verify code. (Anyone can check any certificate on the public Verify page.)',
    response: `{ "data": { …certificate }, "error": null }`,
  },
];

const ERRORS: [string, string, string][] = [
  ['400', 'VALIDATION_ERROR', 'A field is missing or wrong — see error.fieldErrors'],
  ['401', 'NO_TOKEN / BAD_TOKEN / TOKEN_EXPIRED', 'Missing, wrong, revoked or expired token'],
  ['402', 'ORG_EXPIRED', "The organization's plan has expired"],
  ['403', 'PLAN_REQUIRED / ORG_SUSPENDED', 'The plan has no API access, or the organization is suspended'],
  ['404', 'NOT_FOUND', "It doesn't exist (or belongs to another organization)"],
  ['409', 'DUPLICATE / EVENT_FULL / EVENT_ARCHIVED / WRONG_EVENT', 'The request conflicts with the current state'],
  ['429', 'RATE_LIMITED', 'More than 120 requests in a minute'],
  ['503', 'MAINTENANCE', 'EventoraX is down for maintenance — try again later'],
];

const METHOD_COLOR = { GET: 'bg-emerald-100 text-emerald-800', POST: 'bg-blue-100 text-blue-800', PATCH: 'bg-amber-100 text-amber-800' };

function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-xl bg-[#0f172a] p-4 font-mono text-xs leading-relaxed text-slate-100">{children}</pre>;
}

export default function Developers() {
  return (
    <main className="pt-14">
      <section className="bg-[#f3f0ff] py-16 md:py-24 text-center">
        <div className="content-max">
          <p className="font-body text-sm uppercase tracking-[0.1em] mb-4 text-[#a78bfa] font-semibold">Developers</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-[-0.02em] mb-4 text-[#0f172a]">EventoraX REST API</h1>
          <p className="font-body text-lg max-w-2xl mx-auto text-[#64748b]">
            Connect your university portal, website or app: list events, register people, check them in and read certificates. Available on the Enterprise plan.
          </p>
        </div>
      </section>

      <section className="bg-white section-padding">
        <div className="content-max mx-auto max-w-4xl space-y-12">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: KeyRound, title: '1. Get a token', text: 'Dashboard → API → Create token (admins of Enterprise organizations).' },
              { icon: ShieldCheck, title: '2. Send it', text: 'Add the header Authorization: Bearer evx_live_… to every request.' },
              { icon: Timer, title: '3. Mind the limit', text: '120 requests per minute per token. All responses are JSON.' },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border border-[#e9e4ff] bg-[#faf8ff] p-5">
                <s.icon className="h-5 w-5 text-[#7c3aed]" />
                <p className="mt-2 font-body font-semibold text-[#0f172a]">{s.title}</p>
                <p className="mt-1 font-body text-sm text-[#475569]">{s.text}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="mb-3 font-heading text-2xl font-bold text-[#0f172a]">Base URL and authentication</h2>
            <Code>{`Base URL:  ${BASE}

curl ${BASE}/events \\
  -H "Authorization: Bearer evx_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"`}</Code>
            <p className="mt-3 font-body text-sm text-[#475569]">
              Tokens belong to one organization and only ever see its data. Keep them secret (never in a public website's JavaScript) and revoke them from the dashboard
              if they leak. Everything a token changes is recorded in the organization's Activity log.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-heading text-2xl font-bold text-[#0f172a]">Responses and errors</h2>
            <p className="mb-3 font-body text-sm text-[#475569]">Every response has the same envelope. Lists add <code>meta</code> with paging information.</p>
            <Code>{`// success
{ "data": { … }, "error": null }

// failure
{ "data": null, "error": { "code": "VALIDATION_ERROR", "message": "Please fix the highlighted fields",
                           "fieldErrors": { "email": "email is not a valid email address" } } }`}</Code>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-[#e9e4ff]">
              <table className="w-full font-body text-sm">
                <thead className="bg-[#f5f3ff] text-left text-xs uppercase tracking-wide text-[#64748b]">
                  <tr>
                    <th className="px-4 py-2">HTTP</th>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {ERRORS.map(([status, code, meaning]) => (
                    <tr key={status} className="border-t border-[#f1f5f9]">
                      <td className="px-4 py-2 font-mono text-[#0f172a]">{status}</td>
                      <td className="px-4 py-2 font-mono text-xs text-[#7c3aed]">{code}</td>
                      <td className="px-4 py-2 text-[#475569]">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="mb-4 font-heading text-2xl font-bold text-[#0f172a]">Endpoints</h2>
            <nav className="mb-8 flex flex-wrap gap-2" aria-label="Endpoints">
              {ENDPOINTS.map((e, i) => (
                <a key={e.title} href={`#ep-${i}`} className="rounded-full border border-[#e9e4ff] px-3 py-1 font-body text-xs text-[#475569] hover:border-[#c4b5fd] hover:text-[#7c3aed]">
                  {e.title}
                </a>
              ))}
            </nav>
            <div className="space-y-10">
              {ENDPOINTS.map((e, i) => (
                <article key={e.title} id={`ep-${i}`} className="scroll-mt-24">
                  <h3 className="font-heading text-xl font-bold text-[#0f172a]">{e.title}</h3>
                  <p className="mt-2 flex items-center gap-2 font-mono text-sm">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${METHOD_COLOR[e.method]}`}>{e.method}</span>
                    <span className="text-[#0f172a]">{e.path}</span>
                  </p>
                  <p className="mt-2 font-body text-sm text-[#475569]">{e.description}</p>
                  {e.params && (
                    <ul className="mt-3 space-y-1 font-body text-sm">
                      {e.params.map(([k, v]) => (
                        <li key={k}>
                          <code className="text-[#7c3aed]">{k}</code> <span className="text-[#64748b]">— {v}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {e.body && (
                    <div className="mt-3">
                      <p className="mb-1 font-body text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">Request body (JSON)</p>
                      <Code>{e.body}</Code>
                    </div>
                  )}
                  <div className="mt-3">
                    <p className="mb-1 font-body text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">Response</p>
                    <Code>{e.response}</Code>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="flex items-start gap-2 font-body text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> The API is part of the Enterprise plan. Organization admins create tokens in Dashboard → API.
            </p>
            <Button asChild>
              <Link to="/pricing">See plans</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
