import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "purple",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "purple" | "blue" | "emerald" | "slate";
}) {
  const accentStyles = {
    purple: "bg-[#f3f0ff] text-[#7c3aed]",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    slate: "bg-slate-100 text-slate-500",
  }[accent];

  return (
    <div className="rounded-xl border border-[#e9e4ff] bg-white p-4 flex items-center gap-3 transition-shadow hover:shadow-sm">
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", accentStyles)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-slate-900 leading-tight">{value}</p>
        <p className="text-xs text-slate-500 truncate">{label}</p>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#e9e4ff] bg-white p-4 flex items-center gap-3 animate-pulse">
      <div className="h-10 w-10 rounded-lg bg-slate-100 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-5 w-10 rounded bg-slate-100" />
        <div className="h-3 w-16 rounded bg-slate-100" />
      </div>
    </div>
  );
}