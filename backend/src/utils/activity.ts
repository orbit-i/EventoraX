import { Request } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../prisma/client";

interface LogInput {
  action: string; // e.g. "team.invite"
  organizationId?: string | null;
  userId?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}

/** Writes an activity log row. Never throws — logging must not break the request. */
export async function logActivity(req: Request, input: LogInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action: input.action,
        organizationId: input.organizationId ?? req.user?.organizationId ?? null,
        userId: input.userId ?? req.user?.userId ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata,
        ipAddress: req.ip ?? null,
        userAgent: req.get("user-agent") ?? null,
      },
    });
  } catch (err) {
    console.error("Activity log failed:", err);
  }
}