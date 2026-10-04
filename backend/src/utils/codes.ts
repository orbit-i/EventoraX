import crypto from "crypto";

function code(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

/** Attendee reference number, e.g. REG-3F9A2C71B0 */
export const newRefNo = () => code("REG");

/** Human-readable ticket number, e.g. TKT-8D21E04A7C */
export const newTicketNo = () => code("TKT");

/** Unguessable value encoded inside the QR image. The scanner looks tickets up by this. */
export const newQrCode = () => crypto.randomBytes(16).toString("hex");