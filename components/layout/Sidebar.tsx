"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[#e9e4ff] bg-white md:flex sticky top-0 h-screen overflow-y-auto">
      <div className="flex h-16 items-center gap-2 border-b border-[#e9e4ff] px-6">
        <LayoutDashboard className="h-5 w-5 text-[#7c3aed]" />
        <span className="text-base font-semibold tracking-tight text-slate-900">
          EventoraX
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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
  );
}