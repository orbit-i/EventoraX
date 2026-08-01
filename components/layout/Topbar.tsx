"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { MobileNavDrawer } from "./MobileNavDrawer";

const TITLES: Record<string, string> = {
  "/dashboard/events": "Events",
  "/dashboard/registrations": "Registrations",
  "/dashboard/speakers": "Speakers",
  "/dashboard/sponsors": "Sponsors",
  "/dashboard/schedule": "Schedule",
};

function titleForPath(pathname: string | null): string {
  if (!pathname) return "Dashboard";
  const match = Object.keys(TITLES).find((key) => pathname.startsWith(key));
  return match ? TITLES[match] : "Dashboard";
}

export function Topbar() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-[#e9e4ff] bg-white px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-slate-600 hover:bg-[#f3f0ff] hover:text-slate-900 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">
            {titleForPath(pathname)}
          </h1>
        </div>

        {/* Placeholder until real auth/user session exists */}
        <div className="flex items-center gap-2 rounded-full bg-[#f3f0ff] px-3 py-1.5 text-sm font-medium text-slate-600">
          <span className="h-2 w-2 rounded-full bg-[#7c3aed]" />
          <span className="hidden sm:inline">tenant_alpha_univ</span>
        </div>
      </header>

      <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}