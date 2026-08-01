"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav-items";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside className="relative flex h-full w-64 flex-col bg-white shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-[#e9e4ff] px-6">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-[#7c3aed]" />
            <span className="text-base font-semibold tracking-tight text-slate-900">
              EventoraX
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1 text-slate-500 hover:bg-[#f3f0ff] hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#7c3aed] text-white shadow-sm"
                    : "text-slate-600 hover:bg-[#f3f0ff] hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#e9e4ff] px-6 py-4 text-xs text-slate-400">
          Module: Events &amp; Registrations
        </div>
      </aside>
    </div>
  );
}