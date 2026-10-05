// One-off script: copies the events-module frontend from the `feature/eventsmodule`
// branch (Next.js) into this Vite app and adapts it. It only READS that branch.
//
// Usage (from the repo root):   node tools/port-eventsmodule.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

// Pinned to the exact commit we audited, so the patches below always match.
const SOURCE = "b8812de"; // latest commit on origin/feature/eventsmodule
const SRC_DIR = process.env.SRC_DIR; // only used for testing outside a git repo

function readSource(path) {
  const text = SRC_DIR
    ? readFileSync(join(SRC_DIR, path), "utf8")
    : execFileSync("git", ["show", `${SOURCE}:${path}`], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  return text.replace(/\r\n/g, "\n");
}

const P = "src/pages/Dashboard";
const FILES = [
  // types + helpers
  ["types/event.ts", "src/types/event.ts"],
  ["types/registration.ts", "src/types/registration.ts"],
  ["types/session.ts", "src/types/session.ts"],
  ["types/speaker.ts", "src/types/speaker.ts"],
  ["types/sponsor.ts", "src/types/sponsor.ts"],
  ["lib/date.ts", "src/lib/date.ts"],
  ["lib/hooks.ts", "src/lib/hooks.ts"],
  // shared building blocks
  ["components/shared/Avatar.tsx", "src/components/shared/Avatar.tsx"],
  ["components/shared/EmptyState.tsx", "src/components/shared/EmptyState.tsx"],
  ["components/shared/FormSection.tsx", "src/components/shared/FormSection.tsx"],
  ["components/shared/PageHeader.tsx", "src/components/shared/PageHeader.tsx"],
  ["components/shared/RecordFormPage.tsx", "src/components/shared/RecordFormPage.tsx"],
  ["components/shared/Skeletons.tsx", "src/components/shared/Skeletons.tsx"],
  ["components/shared/StatCard.tsx", "src/components/shared/StatCard.tsx"],
  ["components/layout/Pagination.tsx", "src/components/layout/Pagination.tsx"],
  // module components
  ["components/events/CategoryInputCreate.tsx", "src/components/events/CategoryInputCreate.tsx"],
  ["components/events/CategoryManagerEdit.tsx", "src/components/events/CategoryManagerEdit.tsx"],
  ["components/events/EventBadges.tsx", "src/components/events/EventBadges.tsx"],
  ["components/events/EventForm.tsx", "src/components/events/EventForm.tsx"],
  ["components/events/EventsFilters.tsx", "src/components/events/EventsFilters.tsx"],
  ["components/events/EventsTable.tsx", "src/components/events/EventsTable.tsx"],
  ["components/registrations/RegistrationForm.tsx", "src/components/registrations/RegistrationForm.tsx"],
  ["components/sessions/SessionForm.tsx", "src/components/sessions/SessionForm.tsx"],
  ["components/speakers/SpeakerForm.tsx", "src/components/speakers/SpeakerForm.tsx"],
  ["components/sponsors/SponsorForm.tsx", "src/components/sponsors/SponsorForm.tsx"],
  // pages
  ["app/dashboard/events/page.tsx", `${P}/events/EventsPage.tsx`],
  ["app/dashboard/events/new/page.tsx", `${P}/events/NewEventPage.tsx`],
  ["app/dashboard/events/[id]/page.tsx", `${P}/events/EventDetailPage.tsx`],
  ["app/dashboard/events/[id]/edit/page.tsx", `${P}/events/EditEventPage.tsx`],
  ["app/dashboard/registrations/page.tsx", `${P}/registrations/RegistrationsPage.tsx`],
  ["app/dashboard/registrations/new/page.tsx", `${P}/registrations/NewRegistrationPage.tsx`],
  ["app/dashboard/registrations/import/page.tsx", `${P}/registrations/ImportRegistrationsPage.tsx`],
  ["app/dashboard/speakers/page.tsx", `${P}/speakers/SpeakersPage.tsx`],
  ["app/dashboard/speakers/new/page.tsx", `${P}/speakers/NewSpeakerPage.tsx`],
  ["app/dashboard/speakers/[id]/edit/page.tsx", `${P}/speakers/EditSpeakerPage.tsx`],
  ["app/dashboard/speakers/reorder/page.tsx", `${P}/speakers/ReorderSpeakersPage.tsx`],
  ["app/dashboard/sponsors/page.tsx", `${P}/sponsors/SponsorsPage.tsx`],
  ["app/dashboard/sponsors/new/page.tsx", `${P}/sponsors/NewSponsorPage.tsx`],
  ["app/dashboard/sponsors/[id]/edit/page.tsx", `${P}/sponsors/EditSponsorPage.tsx`],
  ["app/dashboard/schedule/page.tsx", `${P}/schedule/SchedulePage.tsx`],
  ["app/dashboard/schedule/new/page.tsx", `${P}/schedule/NewSessionPage.tsx`],
  ["app/dashboard/schedule/[id]/edit/page.tsx", `${P}/schedule/EditSessionPage.tsx`],
  ["app/dashboard/schedule/reorder/page.tsx", `${P}/schedule/ReorderSessionsPage.tsx`],
];

// Exact text replacements for specific files: [file, find, replace]
const PATCHES = [
  // ── Spec wording ──
  ["src/types/event.ts", 'OFFLINE: "Offline",', 'OFFLINE: "Physical",'],
  ["src/pages/Dashboard/events/EventDetailPage.tsx", "`$${event.ticketPrice}`", "`PKR ${event.ticketPrice}`"],

  // ── Type-only imports (this project uses "verbatimModuleSyntax") ──
  ["src/components/events/CategoryManagerEdit.tsx", 'import { EventCategory } from "@/types/event";', 'import type { EventCategory } from "@/types/event";'],
  ["src/components/events/EventBadges.tsx", "  EventMode,\n  EventStatus,\n} from \"@/types/event\";", "  type EventMode,\n  type EventStatus,\n} from \"@/types/event\";"],
  ["src/components/events/EventForm.tsx", 'import { EventFormValues, EventStatus, EVENT_STATUS_LABELS } from "@/types/event";', 'import { type EventFormValues, type EventStatus, EVENT_STATUS_LABELS } from "@/types/event";'],
  ["src/components/events/EventsFilters.tsx", 'import { EVENT_MODE_LABELS, EVENT_STATUS_LABELS, EventMode, EventStatus } from "@/types/event";', 'import { EVENT_MODE_LABELS, EVENT_STATUS_LABELS, type EventMode, type EventStatus } from "@/types/event";'],
  ["src/components/shared/EmptyState.tsx", 'import { LucideIcon } from "lucide-react";', 'import type { LucideIcon } from "lucide-react";'],
  ["src/components/shared/PageHeader.tsx", 'import { ReactNode } from "react";', 'import type { ReactNode } from "react";'],
  ["src/components/shared/StatCard.tsx", 'import { LucideIcon } from "lucide-react";', 'import type { LucideIcon } from "lucide-react";'],
  ["src/pages/Dashboard/events/EditEventPage.tsx", 'import { EventFormValues, EventItem } from "@/types/event";', 'import type { EventFormValues, EventItem } from "@/types/event";'],
  ["src/pages/Dashboard/events/NewEventPage.tsx", 'import { EventFormValues, EventItem } from "@/types/event";', 'import type { EventFormValues, EventItem } from "@/types/event";'],
  ["src/pages/Dashboard/events/EventDetailPage.tsx", 'import { EventItem } from "@/types/event";', 'import type { EventItem } from "@/types/event";'],
  ["src/pages/Dashboard/events/EventsPage.tsx", 'import { EventsFilters, EventsFiltersValue } from "@/components/events/EventsFilters";', 'import { EventsFilters, type EventsFiltersValue } from "@/components/events/EventsFilters";'],
  ["src/pages/Dashboard/events/EventsPage.tsx", 'import { EventItem } from "@/types/event";', 'import type { EventItem } from "@/types/event";'],

  // ── EventsTable: Radix dropdown (asChild), toasts, archive-aware delete ──
  ["src/components/events/EventsTable.tsx", 'import { EventItem } from "@/types/event";', 'import type { EventItem } from "@/types/event";\nimport { toast } from "sonner";'],
  ["src/components/events/EventsTable.tsx",
`                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    />`,
`                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>`],
  ["src/components/events/EventsTable.tsx",
`                      <DropdownMenuItem
                        render={
                          <Link href={\`/dashboard/events/\${event.id}\`}>
                            <Eye className="mr-2 h-4 w-4 inline" /> View
                          </Link>
                        }
                      />`,
`                      <DropdownMenuItem asChild>
                        <Link href={\`/dashboard/events/\${event.id}\`}>
                          <Eye className="mr-2 h-4 w-4 inline" /> View
                        </Link>
                      </DropdownMenuItem>`],
  ["src/components/events/EventsTable.tsx",
`                      <DropdownMenuItem
                        render={
                          <Link href={\`/dashboard/events/\${event.id}/edit\`}>
                            <Pencil className="mr-2 h-4 w-4 inline" /> Edit
                          </Link>
                        }
                      />`,
`                      <DropdownMenuItem asChild>
                        <Link href={\`/dashboard/events/\${event.id}/edit\`}>
                          <Pencil className="mr-2 h-4 w-4 inline" /> Edit
                        </Link>
                      </DropdownMenuItem>`],
  ["src/components/events/EventsTable.tsx",
`      await api.post(\`/events/\${event.id}/duplicate\`);
      onChanged();
    } catch (err) {
      // Keep it simple for now — a toast system isn't in place yet.
      alert(err instanceof ApiError ? err.message : "Failed to duplicate event.");`,
`      await api.post(\`/events/\${event.id}/duplicate\`);
      toast.success(\`"\${event.title}" duplicated as a draft\`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to duplicate event.");`],
  ["src/components/events/EventsTable.tsx",
`      await api.delete(\`/events/\${deleteTarget.id}\`);
      setDeleteTarget(null);
      onChanged();`,
`      const result = await api.delete<{ archived?: boolean; message?: string }>(\`/events/\${deleteTarget.id}\`);
      setDeleteTarget(null);
      if (result?.archived) toast.info(result.message ?? "Event archived");
      else toast.success("Event deleted");
      onChanged();`],
  ["src/components/events/EventsTable.tsx",
`              This will permanently delete &ldquo;{deleteTarget?.title}&rdquo;
              and cannot be undone.`,
`              &ldquo;{deleteTarget?.title}&rdquo; will be deleted. If people have already
              registered, it is archived instead so their records are kept.`],

  // ── Registrations: authenticated export download, unused import ──
  ["src/pages/Dashboard/registrations/RegistrationsPage.tsx", 'import { Badge } from "@/components/ui/badge";\n', ""],
  ["src/pages/Dashboard/registrations/RegistrationsPage.tsx", 'import { api, buildQuery } from "@/lib/api";', 'import { api, ApiError, buildQuery } from "@/lib/api";'],
  ["src/pages/Dashboard/registrations/RegistrationsPage.tsx",
`    const url = api.rawUrl(
      \`/registrations/export\${buildQuery({
        eventId: selectedEventId,
        format: "csv",
        status: status === "ALL" ? undefined : status,
        ids: idsParam,
      })}\`
    );
    window.location.href = url;`,
`    // Downloads with the login token (a plain link can't send it).
    api
      .download(
        \`/registrations/export\${buildQuery({
          eventId: selectedEventId,
          format: "csv",
          status: status === "ALL" ? undefined : status,
          ids: idsParam,
        })}\`,
        "registrations.csv"
      )
      .catch((err) => alert(err instanceof ApiError ? err.message : "Export failed."));`],
];

function adapt(text) {
  return text
    .replace(/^["']use client["'];?\s*\n/, "")
    .replaceAll('from "next/link"', 'from "@/compat/next-link"')
    .replaceAll('from "next/navigation"', 'from "@/compat/next-navigation"');
}

let patched = 0;
for (const [src, dest] of FILES) {
  let text = adapt(readSource(src));
  for (const [file, find, replace] of PATCHES) {
    if (file !== dest) continue;
    if (!text.includes(find)) throw new Error(`Patch not found in ${dest}:\n${find}`);
    text = text.replace(find, () => replace); // function form: "$" in code stays literal
    patched++;
  }
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, text);
  console.log(`✔ ${dest}`);
}
console.log(`\nDone: ${FILES.length} files written, ${patched} patches applied.`);