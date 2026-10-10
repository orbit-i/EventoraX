import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { BadgeCheck, CalendarDays, Copy, Download, Loader2, MapPin, Search, Share2, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { statusLabel } from '@/lib/status';
import type { VerifyResult } from '@/types/certificate';

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; data: VerifyResult }
  | { kind: 'notFound'; code: string }
  | { kind: 'error'; message: string };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:gap-6">
      <dt className="w-40 shrink-0 text-sm text-[#64748b]">{label}</dt>
      <dd className="text-sm font-medium text-[#0f172a]">{children}</dd>
    </div>
  );
}

function ResultCard({ data }: { data: VerifyResult }) {
  const [downloading, setDownloading] = useState(false);
  const banner = data.valid
    ? { icon: ShieldCheck, title: 'VERIFIED', text: 'This certificate is genuine and was issued through EventoraX.', cls: 'bg-emerald-50 border-emerald-200 text-emerald-800', iconCls: 'text-emerald-600' }
    : data.status === 'REVOKED'
      ? { icon: ShieldX, title: 'INVALID — REVOKED', text: `The issuer revoked this certificate${data.revokedAt ? ` on ${formatDate(data.revokedAt)}` : ''}.`, cls: 'bg-rose-50 border-rose-200 text-rose-800', iconCls: 'text-rose-600' }
      : { icon: ShieldAlert, title: 'INVALID', text: "This certificate's details don't match its security fingerprint. It may have been altered.", cls: 'bg-rose-50 border-rose-200 text-rose-800', iconCls: 'text-rose-600' };

  async function share() {
    const shareData = { title: `${data.recipientName} — ${data.event.title}`, text: `Verified certificate issued by ${data.organization.name}`, url: data.verifyUrl };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(data.verifyUrl);
        toast.success('Link copied — paste it anywhere to share');
      }
    } catch {
      /* the person closed the share sheet */
    }
  }

  async function download() {
    setDownloading(true);
    try {
      await api.download(`/verify/${data.verifyCode}/pdf`, `${data.verifyCode}.pdf`);
    } catch (err) {
      toast.error(errorMessage(err, 'Download failed.'));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e9e4ff] bg-white shadow-sm">
      <div className={`flex items-start gap-3 border-b p-5 ${banner.cls}`}>
        <banner.icon className={`mt-0.5 h-7 w-7 shrink-0 ${banner.iconCls}`} />
        <div>
          <p className="text-lg font-bold tracking-wide">{banner.title}</p>
          <p className="text-sm">{banner.text}</p>
          {data.status === 'REVOKED' && data.revokeReason && <p className="mt-1 text-sm">Reason: {data.revokeReason}</p>}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          {data.organization.logoUrl ? (
            <img src={data.organization.logoUrl} alt="" className="h-12 w-12 rounded-xl border border-[#e9e4ff] object-contain p-1" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f3ff] text-[#7c3aed]">
              <BadgeCheck className="h-6 w-6" />
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wide text-[#94a3b8]">Issued by</p>
            <p className="font-semibold text-[#0f172a]">{data.organization.name}</p>
          </div>
        </div>

        <dl className="divide-y divide-[#f1f5f9]">
          <Row label="Awarded to">
            <span className="text-base">{data.recipientName}</span>
          </Row>
          <Row label="Event">{data.event.title}</Row>
          <Row label="Date">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-[#94a3b8]" /> {formatDate(data.event.date)}
            </span>
          </Row>
          {data.event.location && (
            <Row label="Location">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#94a3b8]" /> {data.event.location}
              </span>
            </Row>
          )}
          <Row label="Certificate">
            {statusLabel('certType', data.type)}
            {data.category && data.category !== 'General' ? ` · ${data.category}` : ''}
          </Row>
          <Row label="Issued on">{formatDate(data.issuedAt)}</Row>
          <Row label="Verify code">
            <span className="font-mono">{data.verifyCode}</span>
          </Row>
          <Row label="SHA-256 fingerprint">
            <span className="flex items-start gap-2">
              <code className="break-all font-mono text-xs text-[#475569]">{data.sha256Hash}</code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(data.sha256Hash).then(() => toast.success('Fingerprint copied'))}
                className="shrink-0 rounded-md p-1 text-[#94a3b8] hover:bg-[#f5f3ff] hover:text-[#7c3aed]"
                aria-label="Copy fingerprint"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </span>
          </Row>
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          {data.valid && (
            <>
              <Button onClick={share}>
                <Share2 /> Share
              </Button>
              <Button variant="outline" onClick={download} disabled={downloading}>
                {downloading ? <Loader2 className="animate-spin" /> : <Download />} Download PDF
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Verify() {
  const { code: codeParam } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(codeParam ?? '');
  const [state, setState] = useState<State>({ kind: 'idle' });

  useEffect(() => {
    if (!codeParam) {
      setState({ kind: 'idle' });
      return;
    }
    setInput(codeParam);
    const controller = new AbortController();
    setState({ kind: 'loading' });
    api
      .get<VerifyResult>(`/verify/${encodeURIComponent(codeParam)}`, { auth: false, signal: controller.signal })
      .then((data) => setState({ kind: 'found', data }))
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 404) setState({ kind: 'notFound', code: codeParam });
        else setState({ kind: 'error', message: errorMessage(err) });
      });
    return () => controller.abort();
  }, [codeParam]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const code = input.trim();
    if (code) navigate(`/verify/${encodeURIComponent(code.toUpperCase())}`);
  }

  return (
    <main className="pt-14">
      <section className="bg-[#f5f3ff] py-16 text-center md:py-24">
        <div className="content-max">
          <p className="mb-4 font-body text-sm font-semibold uppercase tracking-[0.1em] text-[#a78bfa]">Certificate verification</p>
          <h1 className="mb-4 font-heading text-4xl font-bold tracking-[-0.02em] text-[#0f172a] md:text-5xl">Is this certificate genuine?</h1>
          <p className="mx-auto mb-8 max-w-xl font-body text-lg text-[#475569]">
            Enter the code printed under the QR on the certificate, e.g. <span className="font-mono text-[#0f172a]">EVX-7K3M-Q9TD</span>.
          </p>
          <form onSubmit={submit} className="mx-auto flex max-w-lg flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a78bfa]" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="EVX-XXXX-XXXX"
                aria-label="Verify code"
                autoCapitalize="characters"
                spellCheck={false}
                className="h-12 w-full rounded-xl border border-[#e9e4ff] bg-white pl-12 pr-4 font-mono text-base uppercase text-[#0f172a] outline-none placeholder:normal-case placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/30"
              />
            </div>
            <Button type="submit" size="lg" className="h-12" disabled={!input.trim() || state.kind === 'loading'}>
              {state.kind === 'loading' ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Verify
            </Button>
          </form>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-2xl px-4">
          {state.kind === 'loading' && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
            </div>
          )}
          {state.kind === 'found' && <ResultCard data={state.data} />}
          {state.kind === 'notFound' && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
              <ShieldX className="mt-0.5 h-7 w-7 shrink-0 text-rose-600" />
              <div>
                <p className="text-lg font-bold tracking-wide">INVALID</p>
                <p className="text-sm">
                  No certificate has the code <span className="font-mono">{state.code}</span>. Check for typos — codes look like EVX-7K3M-Q9TD.
                </p>
              </div>
            </div>
          )}
          {state.kind === 'error' && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">{state.message}</p>}
          {state.kind === 'idle' && (
            <p className="text-center text-sm text-[#64748b]">Every EventoraX certificate has a unique code and a QR code that opens this page.</p>
          )}
        </div>
      </section>
    </main>
  );
}
