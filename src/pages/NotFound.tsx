import { Link } from 'react-router';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f3f0ff] px-4">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-[#f5f3ff]">
          <AlertTriangle size={40} className="text-[#7c3aed]" />
        </div>

        <h1 className="font-heading text-7xl md:text-9xl font-bold mb-2 text-[#0f172a]">
          404
        </h1>
        <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4 text-[#0f172a]">
          Page Not Found
        </h2>
        <p className="font-body text-base mb-8 max-w-md mx-auto text-[#64748b] leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#7c3aed] text-white font-semibold rounded-xl shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:shadow-xl hover:shadow-[#7c3aed]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </main>
  );
}