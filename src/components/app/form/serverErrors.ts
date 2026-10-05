import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { ApiError, errorMessage } from "@/lib/api"

/**
 * Puts each server-side field error under its field (e.g. "website: Must be a full link")
 * and returns the message to show at the top of the form.
 */
export function applyServerErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>): string {
  if (err instanceof ApiError && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
    for (const [field, message] of Object.entries(err.fieldErrors)) {
      setError(field as Path<T>, { type: "server", message })
    }
    return "Please fix the highlighted fields."
  }
  return errorMessage(err)
}
