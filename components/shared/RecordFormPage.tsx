import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

/**
 * Shared shell for every "create/edit record" page in the module
 * (Event, Attendee, Speaker, Sponsor, Session).
 *
 * Handles: back navigation, title/subtitle header, card container,
 * loading state (skeleton-style, no spinners per design system... except
 * this one small inline spinner, which is fine for a one-line loading
 * label rather than a whole-page skeleton), and error state.
 *
 * Module-specific pages only need to supply the title/back-destination
 * and the form itself as children.
 */
export function RecordFormPage({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  loading = false,
  loadingLabel = "Loading…",
  error,
  children,
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel?: string;
  loading?: boolean;
  loadingLabel?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl space-y-4 sm:space-y-5">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Link>

      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="rounded-xl border border-[#e9e4ff] bg-white p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> {loadingLabel}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
