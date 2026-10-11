import { Request } from "express";
import prisma from "../prisma/client";

/** Saves a server error (5xx) so the superadmin can see it on the Maintenance page. Never throws. */
export async function recordError(err: unknown, req?: Request, status = 500): Promise<void> {
  try {
    const e = err instanceof Error ? err : new Error(String(err));
    await prisma.errorLog.create({
      data: {
        message: e.message.slice(0, 5000) || "Unknown error",
        stack: e.stack?.slice(0, 20000) ?? null,
        method: req?.method ?? null,
        path: req?.originalUrl?.slice(0, 500) ?? null,
        status,
        userId: req?.user?.userId ?? null,
      },
    });
  } catch (logErr) {
    console.error("Could not record error:", logErr);
  }
}
