"use client";

import { usePathname } from "next/navigation";

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

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#e9e4ff] bg-white px-6">
      <h1 className="text-lg font-semibold text-slate-900">
        {titleForPath(pathname)}
      </h1>

      {/* Placeholder until real auth/user session exists */}
      <div className="flex items-center gap-2 rounded-full bg-[#f3f0ff] px-3 py-1.5 text-sm font-medium text-slate-600">
        <span className="h-2 w-2 rounded-full bg-[#7c3aed]" />
        tenant_alpha_univ
      </div>
    </header>
  );
}
