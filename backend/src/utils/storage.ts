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

/** Deletes a whole folder of uploads, e.g. everything belonging to one organization. */
export async function deleteUploadFolder(folder: string): Promise<void> {
  const dir = path.resolve(UPLOAD_ROOT, folder);
  if (!dir.startsWith(UPLOAD_ROOT) || dir === UPLOAD_ROOT) return; // never delete outside / the root itself
  await fs.rm(dir, { recursive: true, force: true });
}
// ── Private files (certificate PDFs): never served statically, only through the API ──

/** Folder for files that must not be public. Keys look like "orgs/<orgId>/certificates/<code>.pdf". */
export const PRIVATE_ROOT = path.resolve(process.env.PRIVATE_DIR || "private-files");

function privatePath(key: string): string | null {
  const full = path.resolve(PRIVATE_ROOT, key);
  return full.startsWith(PRIVATE_ROOT + path.sep) ? full : null; // path traversal guard
}

export async function savePrivate(key: string, buffer: Buffer): Promise<void> {
  const full = privatePath(key);
  if (!full) throw new Error("Invalid private file key");
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buffer);
}

/** null if the file is missing. */
export async function readPrivate(key: string | null | undefined): Promise<Buffer | null> {
  const full = key ? privatePath(key) : null;
  if (!full) return null;
  return fs.readFile(full).catch(() => null);
}

export async function deletePrivateFolder(folder: string): Promise<void> {
  const dir = privatePath(folder);
  if (dir) await fs.rm(dir, { recursive: true, force: true });
}
