import { Link } from 'react-router';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5FAFF] px-4">
      <div className="text-center">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: '#CCE5FF' }}
        >
          <AlertTriangle size={40} style={{ color: '#4A9CFF' }} />
        </div>

        <h1
          className="font-heading text-7xl md:text-9xl font-medium mb-2"
          style={{ color: '#1B2A4A' }}
        >
          404
        </h1>
        <h2
          className="font-heading text-2xl md:text-3xl font-medium mb-4"
          style={{ color: '#1B2A4A' }}
        >
          Page Not Found
        </h2>
        <p
          className="font-body text-base mb-8 max-w-md mx-auto"
          style={{ color: '#A0B4CC' }}
        >
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>

        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </main>
  );
}
