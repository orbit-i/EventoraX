import { Link } from 'react-router-dom';
import { Home, ShieldCheck, MessageCircle, HelpCircle } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-blue-50/30 to-purple-50/20 px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <BrandLogo variant="full" size="lg" theme="light" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/70 border border-blue-200 text-blue-700 text-xs font-bold mb-4">
          <HelpCircle className="w-3.5 h-3.5" />
          HTTP 404 • Resource Not Found
        </div>

        <h1 className="font-heading text-6xl sm:text-7xl font-extrabold mb-2 tracking-tight bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          404
        </h1>
        <h2 className="font-heading text-xl sm:text-2xl font-bold mb-3 text-slate-800">
          This Page Has Moved or Does Not Exist
        </h2>
        <p className="font-body text-sm text-slate-600 leading-relaxed mb-8">
          The link you followed may be incorrect, expired, or deleted. You can return to the home portal or verify a certificate below.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            Home Portal
          </Link>
          <Link
            to="/verify"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 text-blue-700 font-bold text-sm rounded-xl border border-blue-200 shadow-xs transition-all duration-200"
          >
            <ShieldCheck className="w-4 h-4" />
            Verify Credential
          </Link>
        </div>

        <div className="pt-6 border-t border-slate-200 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span>Need help?</span>
          <a
            href="https://wa.me/923190375751"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-bold"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp (+92 3190375751)
          </a>
          <span>•</span>
          <a
            href="mailto:eventrye@orbit-i.tech"
            className="text-blue-600 hover:underline font-bold"
          >
            eventrye@orbit-i.tech
          </a>
        </div>
      </div>
    </main>
  );
}