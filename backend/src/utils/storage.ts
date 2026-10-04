import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

/** Folder where uploaded files are kept. Served publicly at /uploads/... */
export const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || "uploads");

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** Saves a file under uploads/<folder>/ and returns its public path, e.g. /uploads/orgs/abc/x.png */
export async function saveUpload(folder: string, buffer: Buffer, mimetype: string): Promise<string> {
  const ext = EXTENSION_BY_MIME[mimetype];
  if (!ext) throw new Error(`Unsupported file type: ${mimetype}`);

  const dir = path.join(UPLOAD_ROOT, folder);
  await fs.mkdir(dir, { recursive: true });

  const fileName = `${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(dir, fileName), buffer);
  return `/uploads/${folder}/${fileName}`;
}

/** Deletes a previously saved upload. Silently ignores missing files. */
export async function deleteUpload(publicPath: string | null | undefined): Promise<void> {
  if (!publicPath || !publicPath.startsWith("/uploads/")) return;
  const fullPath = path.resolve(UPLOAD_ROOT, publicPath.replace(/^\/uploads\//, ""));
  if (!fullPath.startsWith(UPLOAD_ROOT)) return; // path traversal guard
  await fs.unlink(fullPath).catch(() => undefined);
}