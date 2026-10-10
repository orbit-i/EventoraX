import { useRef, useState, type DragEvent } from "react"
import { ImagePlus, Link2, Loader2, Trash2, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, errorMessage } from "@/lib/api"

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"]
const MAX_BYTES = 2 * 1024 * 1024

export type UploadKind = "speaker" | "sponsor" | "logo" | "signature" | "payment"

/**
 * Image field: drag & drop or click to upload (PNG/JPG/WEBP, max 2 MB), with preview,
 * replace and remove. "Use a link instead" accepts an https:// image URL.
 * The value is the image URL (an uploaded file becomes /uploads/...).
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  kind,
  helper,
  error,
  shape = "square",
}: {
  label: string
  value: string | null
  onChange: (url: string | null) => void
  kind: UploadKind
  helper?: string
  error?: string
  shape?: "square" | "circle"
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [linkMode, setLinkMode] = useState(false)
  const [linkDraft, setLinkDraft] = useState("")

  async function handleFile(file: File) {
    setLocalError(null)
    if (!ACCEPTED.includes(file.type)) return setLocalError("Please choose a PNG, JPG or WEBP image.")
    if (file.size > MAX_BYTES) return setLocalError("The image must be 2 MB or smaller.")

    setUploading(true)
    try {
      const res = await api.upload<{ url: string }>(`/uploads/image?kind=${kind}`, file)
      onChange(res.url)
    } catch (err) {
      setLocalError(errorMessage(err, "Upload failed. Please try again."))
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  function applyLink() {
    const url = linkDraft.trim()
    if (!/^https?:\/\/\S+$/i.test(url)) return setLocalError("Enter a full link starting with http:// or https://")
    setLocalError(null)
    onChange(url)
    setLinkMode(false)
    setLinkDraft("")
  }

  const shownError = localError ?? error
  const rounded = shape === "circle" ? "rounded-full" : "rounded-xl"

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[#0f172a]">{label}</p>

      <div className="flex items-start gap-4">
        {/* Preview / drop zone */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed bg-[#faf8ff] transition-colors",
            rounded,
            dragging ? "border-[#7c3aed] bg-[#f5f3ff]" : "border-[#d8d0ff] hover:border-[#a78bfa]",
            shownError && "border-rose-300"
          )}
          aria-label={value ? "Replace image" : "Upload image"}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-7 w-7 text-[#a78bfa]" />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
              <Upload /> {value ? "Replace" : "Upload image"}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={() => onChange(null)}>
                <Trash2 /> Remove
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => setLinkMode((v) => !v)}>
              <Link2 /> {linkMode ? "Cancel link" : "Use a link instead"}
            </Button>
          </div>

          {linkMode && (
            <div className="flex gap-2">
              <Input
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="h-9 bg-white"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyLink())}
              />
              <Button type="button" size="sm" onClick={applyLink}>
                Use link
              </Button>
            </div>
          )}

          <p className={cn("text-xs", shownError ? "font-medium text-rose-500" : "text-[#94a3b8]")}>
            {shownError ?? helper ?? "PNG, JPG or WEBP · up to 2 MB · drag & drop works too"}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = "" // allow choosing the same file again
        }}
      />
    </div>
  )
}