import { useCallback } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useConfirm } from "@/components/app/ConfirmDialog"
import type { EventItem } from "@/types/event"

/**
 * Duplicate / archive / restore / delete an event, with the right confirmation
 * and toast for each. Used by the events list and the event page.
 * Each action resolves to true when something changed.
 */
export function useEventActions() {
  const confirm = useConfirm()

  const duplicate = useCallback(async (event: EventItem): Promise<EventItem | null> => {
    try {
      const copy = await api.post<EventItem>(`/events/${event.id}/duplicate`)
      toast.success(`Duplicated as "${copy.title}" (draft)`)
      return copy
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't duplicate the event."))
      return null
    }
  }, [])

  const archive = useCallback(
    async (event: EventItem): Promise<boolean> => {
      const ok = await confirm({
        title: `Archive "${event.title}"?`,
        description:
          "It will be hidden from your events list and registration will close. All attendees, tickets and other records are kept, and you can restore it at any time.",
        confirmLabel: "Archive event",
      })
      if (!ok) return false
      try {
        await api.patch(`/events/${event.id}`, { status: "ARCHIVED", registrationOpen: false })
        toast.success("Event archived")
        return true
      } catch (err) {
        toast.error(errorMessage(err, "Couldn't archive the event."))
        return false
      }
    },
    [confirm]
  )

  const restore = useCallback(async (event: EventItem): Promise<boolean> => {
    try {
      const restored = await api.post<EventItem>(`/events/${event.id}/restore`)
      toast.success(
        restored.status === "COMPLETED"
          ? "Event restored as Completed (its date has passed)"
          : "Event restored as a Draft. Reopen registration when you're ready."
      )
      return true
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't restore the event."))
      return false
    }
  }, [])

  const remove = useCallback(
    async (event: EventItem): Promise<"deleted" | "archived" | null> => {
      const registrations = event._count?.registrations ?? 0
      const ok = await confirm({
        title: `Delete "${event.title}"?`,
        description:
          registrations > 0
            ? `This event has ${registrations} registration(s), so it will be archived instead of deleted. Attendee records are never thrown away.`
            : "The event and its speakers, sponsors and schedule will be permanently deleted. This can't be undone.",
        confirmLabel: registrations > 0 ? "Archive instead" : "Delete event",
        tone: "danger",
      })
      if (!ok) return null
      try {
        const result = await api.delete<{ archived?: boolean }>(`/events/${event.id}`)
        if (result?.archived) {
          toast.info("The event had registrations, so it was archived instead")
          return "archived"
        }
        toast.success("Event deleted")
        return "deleted"
      } catch (err) {
        toast.error(errorMessage(err, "Couldn't delete the event."))
        return null
      }
    },
    [confirm]
  )

  return { duplicate, archive, restore, remove }
}