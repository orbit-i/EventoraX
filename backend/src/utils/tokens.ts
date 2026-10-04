import crypto from "crypto";

/** Random token to put in emails (verify, reset, invite). */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/** We store only the SHA-256 of tokens, so a leaked database can't be used to log in. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}