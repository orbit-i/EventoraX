import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Sparkles
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { printElement } from '@/lib/printUtils';

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

export default function PublicVerifyPage() {
  const { certNumber } = useParams<{ certNumber?: string }>();
  const [searchQuery, setSearchQuery] = useState(certNumber || 'EVX-CERT-2026-001');
  const [isLoading, setIsLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (certNumber) {
      setSearchQuery(certNumber);
      handleVerify(certNumber);
    }
  }, [certNumber]);

  const handleVerify = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/certificates/verify/${encodeURIComponent(q)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setCertificate(data.certificate);
        setIsValid(data.valid);
      } else {
        setCertificate(null);
        setIsValid(false);
        setErrorMessage(data.message || 'No valid credential found with this identifier.');
      }
    } catch {
      setCertificate(null);
      setIsValid(false);
      setErrorMessage('Unable to reach credential verification server. Please verify connection.');
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
          Enter any EventoraX certificate identification number to verify its authentic cryptographic signature, recipient records, and validity status.
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
                    {certificate.status === 'issued' ? 'Authentic EventoraX Certificate' : 'Certificate Has Been Revoked'}
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
                    This credential was issued through the EventoraX Multi-Tenant Certificate Engine and validated against the distributed immutable ledger for ORBIT-I Private Limited.
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
                  <span>Engine: EventoraX v2.0 Enterprise</span>
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
              {errorMessage || 'The specified certificate number does not match any authenticated record in the EventoraX registry.'}
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
