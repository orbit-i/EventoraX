import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  Calendar, 
  ShieldCheck, 
  CreditCard, 
  Sparkles, 
  FileText, 
  Mail, 
  ArrowRight,
  HelpCircle,
  Award
} from 'lucide-react';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickNavigationItems = [
  { label: 'Browse Events Directory', href: '/events-directory', category: 'Events', icon: Calendar, desc: 'Discover summits, hackathons and workshops' },
  { label: 'List Your Event (+ VIP Showcase)', href: '/list-event', category: 'Events', icon: Sparkles, desc: 'Submit and feature your event' },
  { label: 'Verify Credential / Certificate', href: '/verify', category: 'Tools', icon: ShieldCheck, desc: 'Check SHA-256 tamper-proof authenticity' },
  { label: 'Platform Features & Tech Specs', href: '/features', category: 'Platform', icon: Award, desc: 'QR ticketing, ID badges & certificate engine' },
  { label: 'Pricing & Subscription Plans', href: '/pricing', category: 'Platform', icon: CreditCard, desc: 'Starter, Professional & Enterprise tiers' },
  { label: 'Case Studies & Institutional Deployments', href: '/case-studies', category: 'About', icon: FileText, desc: 'University and conference success stories' },
  { label: 'About EventoraX & ORBIT-I', href: '/about', category: 'About', icon: HelpCircle, desc: 'Our mission, team, and company history' },
  { label: 'Contact Support & Inquiries', href: '/contact', category: 'Support', icon: Mail, desc: '24/7 technical team & custom quotes' },
  { label: 'Terms of Service', href: '/terms', category: 'Legal', icon: FileText, desc: 'Platform rules and compliance policies' },
  { label: 'Privacy Policy', href: '/privacy', category: 'Legal', icon: FileText, desc: 'Data protection and cookie policies' },
  { label: 'Service Usage & SLA', href: '/service-usage', category: 'Legal', icon: FileText, desc: 'Uptime guarantees and system SLA' }
];

export default function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open triggered from parent or event
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = quickNavigationItems.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    onClose();
    navigate(href);
  };

  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0 && filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex].href);
      } else if (query.trim()) {
        handleSelect(`/events-directory?search=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl shadow-slate-900/25 border border-slate-200 z-10 overflow-hidden animate-in zoom-in-95 duration-150 font-body">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInInput}
            placeholder="Search events, features, verification, pricing..."
            className="w-full text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-md border border-slate-200">
              ESC
            </kbd>
          )}
        </div>

        {/* Results list */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredItems.length > 0 ? (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleSelect(item.href)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                      isSelected ? 'bg-blue-50/90 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold truncate flex items-center gap-2">
                          <span>{item.label}</span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 shrink-0 transition-all ${
                      isSelected ? 'text-blue-600 translate-x-0.5 opacity-100' : 'opacity-0'
                    }`} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-slate-700">No direct page matches found for "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Search the Events Directory for this keyword:</p>
              <button
                type="button"
                onClick={() => handleSelect(`/events-directory?search=${encodeURIComponent(query.trim())}`)}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Search in Events Directory &rarr;</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">↓</kbd>
            <span>to navigate</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">Enter</kbd>
            <span>to open</span>
          </span>
          <span className="text-slate-400">EventoraX Search</span>
        </div>
      </div>
    </div>
  );
}
