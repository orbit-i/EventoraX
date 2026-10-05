import { useState } from "react";
import Link from "@/compat/next-link";
import { useRouter } from "@/compat/next-navigation";
import { MoreHorizontal, Pencil, Copy, Trash2, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TableSkeletonRows } from "@/components/shared/Skeletons";
import { EventModeBadge, EventStatusBadge } from "./EventBadges";
import type { EventItem } from "@/types/event";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

function formatDateRange(start: string, end: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  try {
    return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
  } catch {
    return "—";
  }
}

export function EventsTable({
  events,
  loading,
  onChanged,
}: {
  events: EventItem[];
  loading: boolean;
  /** Called after a successful delete/duplicate so the parent can refetch. */
  onChanged: () => void;
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  async function handleDuplicate(event: EventItem) {
    setDuplicatingId(event.id);
    try {
      await api.post(`/events/${event.id}/duplicate`);
      toast.success(`"${event.title}" duplicated as a draft`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to duplicate event.");
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await api.delete<{ archived?: boolean; message?: string }>(`/events/${deleteTarget.id}`);
      setDeleteTarget(null);
      if (result?.archived) toast.info(result.message ?? "Event archived");
      else toast.success("Event deleted");
      onChanged();
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : "Failed to delete event."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-[#e9e4ff] bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden sm:table-cell">Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Registrations</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeletonRows columns={6} rows={5} />
          </TableBody>
        </Table>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#e9e4ff] bg-white p-12 text-center">
        <p className="text-sm font-medium text-slate-700">No events yet</p>
        <p className="mt-1 text-sm text-slate-400">
          Create your first event to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#e9e4ff] bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden sm:table-cell">Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Registrations</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow
                key={event.id}
                className="cursor-pointer"
                onClick={() => router.push(`/dashboard/events/${event.id}`)}
              >
                <TableCell className="font-medium text-slate-900">
                  {event.title}
                  <p className="mt-0.5 text-xs text-slate-400 sm:hidden">
                    {formatDateRange(event.startDateTime, event.endDateTime)}
                  </p>
                </TableCell>
                <TableCell className="hidden md:table-cell text-slate-600">
                  {formatDateRange(event.startDateTime, event.endDateTime)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <EventModeBadge mode={event.mode} />
                </TableCell>
                <TableCell>
                  <EventStatusBadge status={event.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right text-slate-600">
                  {event._count?.registrations ?? 0}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/events/${event.id}`}>
                          <Eye className="mr-2 h-4 w-4 inline" /> View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/events/${event.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4 inline" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={duplicatingId === event.id}
                        onClick={() => handleDuplicate(event)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {duplicatingId === event.id
                          ? "Duplicating…"
                          : "Duplicate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(event);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete event?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; will be deleted. If people have already
              registered, it is archived instead so their records are kept.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-red-600">{deleteError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleConfirmDelete}
            >
              {deleting ? "Deleting…" : "Delete event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
