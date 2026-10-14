// Official Brand Icons & Logos for Pakistani Payment Gateways & Global Cards

export function SafepayLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Safepay brand emblem */}
      <rect x="2" y="2" width="28" height="28" rx="8" fill="#182A4D" />
      <path d="M11 20.5C11 20.5 13.5 22.5 16 22.5C19.5 22.5 21.5 20 21.5 17.5C21.5 13.5 15 14 15 11.5C15 10 16.5 9 18.5 9C20.5 9 22 10 22 10" stroke="#00C9A7" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="16" r="1.5" fill="#4D88FF" />
      {/* Safepay text */}
      <text x="36" y="21" fill="#182A4D" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="16" letterSpacing="-0.5">
        safepay
      </text>
    </svg>
  );
}

export function SafepayBadge({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="32" height="32" rx="8" fill="#182A4D" />
      <path d="M9 20C9 20 12 22.5 15.5 22.5C19.5 22.5 23 19.5 23 16.5C23 12 15 12.5 15 9.5C15 8 16.8 6.5 19.5 6.5C22 6.5 23.5 7.8 23.5 7.8" stroke="#00E5BE" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="16" cy="15.5" r="1.8" fill="#5E93FF" />
    </svg>
  );
}

export function JazzCashLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <img
      src="/images/payments/jazzcash.png"
      alt="JazzCash Official"
      className={`object-contain inline-block ${className}`}
      loading="lazy"
    />
  );
}

export function JazzCashBadge({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <img
      src="/images/payments/jazzcash.png"
      alt="JazzCash"
      className={`object-contain rounded-md inline-block ${className}`}
      loading="lazy"
    />
  );
}

export function EasypaisaLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <img
      src="/images/payments/easypaisa.png"
      alt="Easypaisa Official"
      className={`object-contain inline-block ${className}`}
      loading="lazy"
    />
  );
}

export function EasypaisaBadge({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <img
      src="/images/payments/easypaisa.png"
      alt="Easypaisa"
      className={`object-contain rounded-md inline-block ${className}`}
      loading="lazy"
    />
  );
}

export function SadaPayLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Iconic SadaPay dual pill: Teal + Coral */}
      <g transform="translate(2, 4)">
        <rect x="0" y="0" width="13" height="24" rx="6.5" fill="#00A389" />
        <rect x="10" y="0" width="13" height="24" rx="6.5" fill="#FF705A" fillOpacity="0.9" />
      </g>
      <text x="33" y="21" fill="#0F172A" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="15" letterSpacing="-0.5">
        sadapay
      </text>
    </svg>
  );
}

export function SadaPayBadge({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="32" height="32" rx="8" fill="#0F172A" />
      <g transform="translate(6, 6)">
        <rect x="0" y="0" width="11" height="20" rx="5.5" fill="#00BFA5" />
        <rect x="9" y="0" width="11" height="20" rx="5.5" fill="#FF6D55" fillOpacity="0.9" />
      </g>
    </svg>
  );
}

export function NayaPayLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Orange hexagon / bold N */}
      <rect x="2" y="2" width="28" height="28" rx="7" fill="#FF5C00" />
      <path d="M9 22V10L17 22H23V10" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <text x="36" y="21" fill="#0F172A" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="15" letterSpacing="-0.5">
        nayapay
      </text>
    </svg>
  );
}

export function NayaPayBadge({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="32" height="32" rx="8" fill="#FF5C00" />
      <path d="M10 22V10L18 22H23V10" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RaastLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* State Bank of Pakistan Raast Concentric Rings */}
      <rect x="2" y="2" width="28" height="28" rx="7" fill="#0B5D34" />
      <circle cx="16" cy="16" r="9" stroke="#E59900" strokeWidth="2" strokeDasharray="3 2" />
      <circle cx="16" cy="16" r="5" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="16" cy="16" r="2" fill="#E59900" />
      <text x="35" y="16" fill="#0B5D34" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="13">
        RAAST
      </text>
      <text x="35" y="26" fill="#71717A" fontFamily="system-ui, sans-serif" fontWeight="600" fontSize="9">
        State Bank of PK
      </text>
    </svg>
  );
}

export function RaastBadge({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="32" height="32" rx="8" fill="#0B5D34" />
      <circle cx="16" cy="16" r="10" stroke="#E59900" strokeWidth="2" strokeDasharray="3 2" />
      <circle cx="16" cy="16" r="6" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="16" cy="16" r="2.5" fill="#E59900" />
    </svg>
  );
}

export function CardNetworksBadge({ className = "w-12 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Visa */}
      <g transform="translate(0, 2)">
        <rect width="32" height="20" rx="4" fill="#1A1F71" />
        <text x="6" y="15" fill="#FFFFFF" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="11" fontStyle="italic">
          VISA
        </text>
      </g>
      {/* Mastercard */}
      <g transform="translate(38, 2)">
        <rect width="34" height="20" rx="4" fill="#1E293B" />
        <circle cx="13" cy="10" r="6" fill="#EB001B" />
        <circle cx="21" cy="10" r="6" fill="#F79E1B" fillOpacity="0.85" />
      </g>
    </svg>
  );
}

export function BankTransferBadge({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <img
      src="/images/payments/meezan.png"
      alt="Meezan Bank"
      className={`object-contain inline-block rounded-full ${className}`}
      loading="lazy"
    />
  );
}

export function MeezanBankLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <img
      src="/images/payments/meezan.png"
      alt="Meezan Bank Limited"
      className={`object-contain inline-block ${className}`}
      loading="lazy"
    />
  );
}

export function MeezanBankBadge({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <img
      src="/images/payments/meezan.png"
      alt="Meezan Bank"
      className={`object-contain inline-block rounded-full ${className}`}
      loading="lazy"
    />
  );
}
