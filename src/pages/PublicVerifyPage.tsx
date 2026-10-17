import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Download, 
  Calendar, 
  User, 
  Award, 
  CheckCircle2, 
  Building2, 
  Copy, 
  Check, 
  ArrowLeft,
  Sparkles,
  Printer
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { printElement, downloadElementAsImage } from '@/lib/printUtils';
import { toast } from 'sonner';

interface CertificateData {
  certificateNumber: string;
  recipientName: string;
  eventName: string;
  issueDate: string;
  verificationHash: string;
  status: string;
  revokedAt?: string;
  revokedReason?: string;
  organization: {
    name: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  templateConfig?: any;
}

interface InvoiceData {
  invoiceNumber: string;
  transactionRef: string;
  clientOrg: string;
  plan: string;
  amount: number;
  originalPrice: number;
  discountAmount?: number;
  couponCode?: string | null;
  currency: string;
  billingCycle: string;
  paymentMethod: string;
  createdAt: string;
  statusBadge: string;
  receivingAccount: string;
  receivingTitle: string;
  governance: {
    ntn: string;
    strn: string;
    sbpReg: string;
    sha256Hash: string;
  };
}

export default function PublicVerifyPage() {
  const { certNumber } = useParams<{ certNumber?: string }>();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('id') || searchParams.get('ref') || searchParams.get('invoice');
  const initialQuery = certNumber || queryParam || 'EVX-CERT-2026-001';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const q = certNumber || queryParam;
    if (q) {
      setSearchQuery(q);
      handleVerify(q);
    }
  }, [certNumber, queryParam]);

  const handleVerify = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/certificates/verify/${encodeURIComponent(q)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.type === 'invoice' || data.invoice) {
          setInvoice(data.invoice);
          setCertificate(null);
          setIsValid(true);
        } else {
          setCertificate(data.certificate);
          setInvoice(null);
          setIsValid(data.valid);
        }
      } else {
        setCertificate(null);
        setInvoice(null);
        setIsValid(false);
        setErrorMessage(data.message || 'No valid credential or invoice found with this identifier.');
      }
    } catch {
      setCertificate(null);
      setInvoice(null);
      setIsValid(false);
      setErrorMessage('Unable to reach verification server. Please verify connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCertId = () => {
    if (!certificate) return;
    navigator.clipboard.writeText(certificate.certificateNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPrintable = () => {
    if (!certificate) return;
    printElement('official-certificate-diploma', `${certificate.recipientName} - Certificate of Excellence`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#eff6ff] to-[#f8fafc] text-[#0f172a]">
      {/* Top Bar */}
      <header className="border-b border-[#e2e8f0] bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo variant="compact" size="md" showTagline={false} />
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              to="/" 
              className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#1d4ed8] px-3 py-1.5 rounded-lg hover:bg-[#eff6ff] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#1d4ed8] bg-[#eff6ff] border border-[#bfdbfe] px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2563eb]" />
              Official Verification Portal
            </div>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="py-12 px-4 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1d4ed8]/10 border border-[#2563eb]/20 text-[#1d4ed8] text-xs font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Tamper-Evident Credential Authenticator
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0f172a] mb-3">
          Verify Official Credentials
        </h1>
        <p className="text-sm sm:text-base text-[#64748b] max-w-xl mx-auto mb-8">
          Enter any Eventrye certificate identification number to verify its authentic cryptographic signature, recipient records, and validity status.
        </p>

        {/* Search Input Box */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify(searchQuery);
          }}
          className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. EVX-CERT-2026-001"
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-[#cbd5e1] focus:border-[#1d4ed8] rounded-xl text-sm font-semibold text-[#0f172a] shadow-sm focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/10 transition-all"
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl font-bold text-sm shadow-md shadow-[#1d4ed8]/25 hover:shadow-lg hover:shadow-[#1d4ed8]/35 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Authenticate
              </>
            )}
          </button>
        </form>

        {/* Quick Sample Links */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#64748b]">
          <span>Try demo:</span>
          <button 
            type="button" 
            onClick={() => { setSearchQuery('EVX-CERT-2026-001'); handleVerify('EVX-CERT-2026-001'); }}
            className="font-mono text-[#1d4ed8] hover:underline"
          >
            EVX-CERT-2026-001
          </button>
          <span>•</span>
          <button 
            type="button" 
            onClick={() => { setSearchQuery('EVX-CERT-2026-002'); handleVerify('EVX-CERT-2026-002'); }}
            className="font-mono text-[#1d4ed8] hover:underline"
          >
            EVX-CERT-2026-002
          </button>
        </div>
      </section>

      {/* Result Display */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        {isValid === true && certificate && (
          <div className="bg-white rounded-3xl border border-[#cbd5e1] shadow-xl shadow-[#1d4ed8]/5 overflow-hidden transition-all duration-300">
            {/* Verification Status Header Banner */}
            <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              certificate.status === 'issued' 
                ? 'bg-gradient-to-r from-[#eff6ff] to-[#dbeafe] border-[#bfdbfe]' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                  certificate.status === 'issued'
                    ? 'bg-[#1d4ed8] text-white shadow-[#1d4ed8]/25'
                    : 'bg-red-600 text-white shadow-red-600/25'
                }`}>
                  {certificate.status === 'issued' ? (
                    <ShieldCheck className="w-7 h-7" />
                  ) : (
                    <ShieldAlert className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full ${
                      certificate.status === 'issued'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {certificate.status === 'issued' ? 'Verified Official Credential' : 'REVOKED / INVALID'}
                    </span>
                    <span className="text-xs text-[#64748b] hidden sm:inline">• 100% Genuine</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[#0f172a] mt-0.5">
                    {certificate.status === 'issued' ? 'Authentic Eventrye Certificate' : 'Certificate Has Been Revoked'}
                  </h2>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={copyCertId}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#cbd5e1] hover:border-[#1d4ed8] text-xs font-bold text-[#334155] flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#64748b]" />}
                  {copied ? 'Copied' : 'Copy ID'}
                </button>
                <button 
                  onClick={downloadPrintable}
                  className="px-4 py-2 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#1d4ed8]/20 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
              </div>
            </div>

            {/* Credential Details Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#fafafa]">
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-2xs">
                  <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">
                    Awarded Recipient
                  </span>
                  <div className="flex items-center gap-2 text-lg font-extrabold text-[#0f172a]">
                    <User className="w-4 h-4 text-[#1d4ed8]" />
                    {certificate.recipientName}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-2xs">
                  <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">
                    Event / Program Credential
                  </span>
                  <div className="flex items-center gap-2 text-base font-bold text-[#0f172a]">
                    <Award className="w-4 h-4 text-[#1d4ed8]" />
                    {certificate.eventName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-2xs">
                    <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">
                      Issue Date
                    </span>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0f172a]">
                      <Calendar className="w-4 h-4 text-[#64748b]" />
                      {certificate.issueDate}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-2xs">
                    <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">
                      Issuing Organization
                    </span>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0f172a] truncate">
                      <Building2 className="w-4 h-4 text-[#1d4ed8]" />
                      {certificate.organization.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Fingerprint Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Cryptographic Audit Trail
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      SHA-256 Validated
                    </span>
                  </div>

                  <p className="text-xs text-[#64748b] leading-relaxed mb-4">
                    This credential was issued through the Eventrye Multi-Tenant Certificate Engine and validated against the distributed immutable ledger for ORBIT-I Private Limited.
                  </p>

                  <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] mb-3">
                    <span className="text-[10px] font-bold text-[#94a3b8] uppercase block mb-0.5">
                      Certificate Identifier
                    </span>
                    <span className="font-mono text-sm font-extrabold text-[#1d4ed8]">
                      {certificate.certificateNumber}
                    </span>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#94a3b8] uppercase block mb-0.5">
                        Security Verification
                      </span>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Digitally Sealed & Verified
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      Authentic
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#f1f5f9] flex items-center justify-between text-[11px] text-[#94a3b8]">
                  <span>Engine: Eventrye v2.0 Enterprise</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Zero Tampering Detected
                  </span>
                </div>
              </div>
            </div>

            {/* Certificate Visual Rendering Box */}
            <div className="p-6 sm:p-10 border-t border-[#e2e8f0] bg-white">
              <div 
                id="official-certificate-diploma"
                className="max-w-2xl mx-auto rounded-2xl border-4 border-[#1d4ed8]/30 p-8 sm:p-12 relative bg-gradient-to-br from-white via-[#f8fafc] to-[#eff6ff] shadow-lg text-center overflow-hidden"
              >
                {/* Decorative border corners */}
                <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#1d4ed8]" />
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#1d4ed8]" />
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#1d4ed8]" />
                <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#1d4ed8]" />

                <div className="mb-4 flex justify-center">
                  <BrandLogo variant="icon" size="md" />
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wider text-[#1e40af] uppercase mb-1">
                  Certificate of Excellence
                </h3>
                <p className="text-xs tracking-widest text-[#64748b] uppercase font-semibold mb-6">
                  This is proudly presented to
                </p>

                <div className="text-2xl sm:text-3xl font-serif font-black text-[#0f172a] border-b-2 border-[#1d4ed8]/20 pb-2 mb-4 max-w-md mx-auto">
                  {certificate.recipientName}
                </div>

                <p className="text-xs sm:text-sm text-[#475569] max-w-lg mx-auto leading-relaxed mb-8">
                  for remarkable performance, participation, and successful completion of the global technical curriculum at <strong>{certificate.eventName}</strong>.
                </p>

                <div className="flex items-end justify-between pt-4 border-t border-[#e2e8f0]/80 text-left text-xs">
                  <div>
                    <span className="text-[10px] text-[#94a3b8] uppercase font-bold block">Issue Date</span>
                    <span className="font-semibold text-[#0f172a]">{certificate.issueDate}</span>
                  </div>

                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full border-2 border-[#1d4ed8] flex items-center justify-center mx-auto mb-1 bg-[#eff6ff]">
                      <ShieldCheck className="w-5 h-5 text-[#1d4ed8]" />
                    </div>
                    <span className="text-[9px] font-bold text-[#1d4ed8] uppercase tracking-wider block">Official Seal</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#94a3b8] uppercase font-bold block">Authorized By</span>
                    <span className="font-semibold text-[#0f172a]">{certificate.organization.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIP Verified Tax Invoice View */}
        {isValid === true && invoice && (
          <div className="bg-white rounded-3xl border border-[#cbd5e1] shadow-xl shadow-[#1d4ed8]/5 overflow-hidden transition-all duration-300">
            {/* VIP Status Banner */}
            <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-emerald-200">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md bg-emerald-600 text-white shadow-emerald-600/25">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ★ {invoice.statusBadge}
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">• SBP PSO/PSP PK-2026</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-[#0f172a] mt-0.5">
                    Official VIP Verified Tax &amp; Sales Invoice
                  </h2>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(invoice.invoiceNumber);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#cbd5e1] hover:border-[#1d4ed8] text-xs font-bold text-[#334155] flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#64748b]" />}
                  {copied ? 'Copied' : 'Copy ID'}
                </button>
                <button 
                  onClick={async () => {
                    toast.info('Generating high-resolution Tax Invoice image...');
                    const ok = await downloadElementAsImage(
                      'official-invoice-document', 
                      `Eventrye_Tax_Invoice_${invoice.invoiceNumber}.png`,
                      2.5
                    );
                    if (ok) {
                      toast.success('Tax Invoice image downloaded!');
                    } else {
                      toast.error('Failed to capture image. Please use Print / PDF option.');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  Save Image
                </button>
                <button 
                  onClick={() => printElement('official-invoice-document', `Eventrye Official Tax Invoice - ${invoice.invoiceNumber}`)}
                  className="px-4 py-2 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#1d4ed8]/20 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
              </div>
            </div>

            {/* Official Printable Tax Invoice Container */}
            <div className="p-4 sm:p-8 bg-slate-50 border-b border-slate-200">
              <div
                id="official-invoice-document"
                className="max-w-2xl mx-auto bg-white p-5 sm:p-8 rounded-2xl border-2 border-slate-300 shadow-sm relative overflow-hidden font-sans text-xs text-slate-800 space-y-4"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  borderColor: '#cbd5e1',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                }}
              >
                {/* Watermark */}
                <div 
                  className="absolute right-4 bottom-14 opacity-5 pointer-events-none select-none text-slate-900 font-black text-6xl rotate-[-20deg]"
                  style={{ opacity: 0.04 }}
                >
                  EVENTRYE
                </div>

                {/* Company Header */}
                <div 
                  className="flex items-start justify-between pb-3.5 border-b"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <div className="flex items-center gap-2.5">
                    <img 
                      src="/favicon.png" 
                      alt="Eventrye" 
                      width="36" 
                      height="36" 
                      className="w-9 h-9 rounded-xl object-contain shrink-0 shadow-xs"
                      style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}
                    />
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">EVENTRYE TECHNOLOGIES (PVT) LTD</h4>
                      <p className="text-[10px] text-slate-500 font-medium">ORBIT-I Cloud Digital Systems • SBP Digital Reg: PK-2026-PSO/PSP</p>
                      <p className="text-[10px] text-slate-400 font-mono">NTN: {invoice.governance.ntn} • STRN: {invoice.governance.strn}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span 
                      className="px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase inline-block mb-1 shadow-xs"
                      style={{ backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }}
                    >
                      ★ VIP VERIFIED &amp; ACTIVE
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">2026 Fiscal Year</span>
                  </div>
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="break-all">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Official Tax Invoice ID</span>
                    <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="break-all">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Transaction Reference (TID)</span>
                    <span className="font-mono font-bold text-[#1d4ed8]">{invoice.transactionRef}</span>
                  </div>
                  <div className="break-all">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Client Organization</span>
                    <span className="font-bold text-slate-900">{invoice.clientOrg}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Verified Date</span>
                    <span className="font-medium text-slate-800">{new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                {/* Receiving Merchant Info */}
                <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 text-[11px] space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                    <span className="text-slate-500">Merchant Recipient:</span>
                    <span className="font-bold text-slate-900">{invoice.receivingTitle || 'ORBIT-I / Eventrye Technologies'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                    <span className="text-slate-500">Merchant Account / IBFT:</span>
                    <span className="font-mono font-bold text-blue-700">{invoice.receivingAccount || '03190375751'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                    <span className="text-slate-500">Payment Gateway:</span>
                    <span className="font-bold text-slate-900">{invoice.paymentMethod}</span>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold text-[11px]">
                      <tr>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-center">Cycle</th>
                        <th className="p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5">
                          <strong className="block text-slate-900">Eventrye {invoice.plan} Tier</strong>
                          <span className="text-[10px] text-slate-500">Enterprise Cloud Event Management &amp; Pass Infrastructure (2026 Release)</span>
                        </td>
                        <td className="p-2.5 text-center text-slate-700 font-medium">{invoice.billingCycle}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{invoice.currency} {Number(invoice.originalPrice || invoice.amount).toLocaleString()}</td>
                      </tr>
                      {invoice.couponCode && (
                        <tr className="bg-emerald-50/60">
                          <td colSpan={2} className="p-2 text-right text-emerald-700 text-[11px] font-bold">
                            Promo Coupon Applied ({invoice.couponCode}):
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-700">
                            -{invoice.currency} {Number(invoice.discountAmount || 0).toLocaleString()}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={2} className="p-2 text-right text-slate-500 text-[11px]">Sales Tax / GST (0% Section 65F IT Exemption):</td>
                        <td className="p-2 text-right font-mono text-slate-700">PKR 0.00</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold text-sm text-[#1d4ed8]">
                        <td colSpan={2} className="p-2.5 text-right">Total Paid (Inclusive of all dues):</td>
                        <td className="p-2.5 text-right">{invoice.currency} {Number(invoice.amount).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* QR Code & Digital Signature */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://eventrye.orbit-i.tech/verify/${invoice.invoiceNumber}`)}`}
                      alt="Official Invoice QR Verification"
                      className="w-14 h-14 rounded-lg border border-slate-200 p-0.5"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-slate-700 block">Digital QR Verification</span>
                      <p className="text-[9px] text-slate-400 max-w-[170px]">
                        Scan with mobile camera to authenticate digital invoice on the Eventrye public verification ledger.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <svg 
                      width="40" 
                      height="40" 
                      viewBox="0 0 48 48" 
                      className="w-10 h-10 shrink-0" 
                      style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', maxWidth: '40px', maxHeight: '40px' }}
                      fill="none"
                    >
                      <circle cx="24" cy="24" r="22" stroke="#1d4ed8" strokeWidth="2" strokeDasharray="3 2" />
                      <circle cx="24" cy="24" r="18" stroke="#059669" strokeWidth="1.5" />
                      <path d="M16 24L21 29L32 18" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">ORBIT-I Cloud Platform</span>
                      <span className="font-serif italic text-xs text-slate-800 font-bold block">Authorized Digital Sign</span>
                      <span className="text-[9px] text-emerald-600 font-mono font-bold block">SHA-256 Verified 2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Not Found State */}
        {isValid === false && (
          <div className="bg-white rounded-3xl border border-red-200 p-8 sm:p-12 text-center shadow-lg">
            <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-[#0f172a] mb-2">
              Credential Not Verified
            </h3>
            <p className="text-sm text-[#64748b] max-w-md mx-auto mb-6">
              {errorMessage || 'The specified certificate number does not match any authenticated record in the Eventrye registry.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={() => { setSearchQuery('EVX-CERT-2026-001'); handleVerify('EVX-CERT-2026-001'); }}
                className="px-5 py-2.5 rounded-xl bg-[#1d4ed8] text-white text-xs font-bold shadow-md hover:bg-[#1e40af] transition-colors"
              >
                Try Sample EVX-CERT-2026-001
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
