import { Link } from "react-router";
import { Calendar, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-blue-100">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Calendar className="h-6 w-6 text-blue-500" />
              <span className="text-lg font-bold text-blue-600">EventoraX</span>
            </Link>
            <p className="text-sm text-slate-500 mb-4">
              Complete event management platform for universities, colleges, companies, and NGOs.
            </p>
            <div className="space-y-2 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                support@eventorax.com
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-400" />
                +92-300-1234567
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                Pakistan
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Product</h3>
            <div className="space-y-2">
              {["Features", "Pricing", "About", "Contact"].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="block text-sm text-slate-500 hover:text-blue-600 transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Legal</h3>
            <div className="space-y-2">
              {["Terms", "Privacy"].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="block text-sm text-slate-500 hover:text-blue-600 transition-colors"
                >
                  {item} of Service
                </Link>
              ))}
            </div>
          </div>

          {/* Verify */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Verify</h3>
            <Link
              to="/verify"
              className="block text-sm text-slate-500 hover:text-blue-600 transition-colors"
            >
              Certificate Verification
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-blue-100 text-center">
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} EventoraX. All rights reserved. Built by ORBIT-I.
          </p>
        </div>
      </div>
    </footer>
  );
}
