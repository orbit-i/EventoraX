import crypto from "crypto";

// Secrets stored in the database (e.g. the SMTP password in System settings) are encrypted with AES-256-GCM.
// The key comes from ENCRYPTION_KEY in .env, or is derived from JWT_SECRET if that isn't set.
// Changing the key makes stored secrets unreadable: they then have to be entered again.
const PREFIX = "enc:v1:";

function key(): Buffer {
  const base = process.env.ENCRYPTION_KEY || `${process.env.JWT_SECRET ?? ""}:eventorax-stored-secrets`;
  if (base.length < 32) throw new Error("ENCRYPTION_KEY (or JWT_SECRET) must be at least 32 characters");
  return crypto.createHash("sha256").update(base).digest();
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${PREFIX}${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${data.toString("base64")}`;
}

/** Decrypts a stored secret. Values saved before encryption existed (plain text) are returned as they are. */
export function decryptSecret(stored: string): string {
  if (!isEncrypted(stored)) return stored;
  const [iv, tag, data] = stored.slice(PREFIX.length).split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv ?? "", "base64"));
  decipher.setAuthTag(Buffer.from(tag ?? "", "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data ?? "", "base64")), decipher.final()]).toString("utf8");
}
