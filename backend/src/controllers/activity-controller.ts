import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ok, pagination, q } from "../utils/http";
import { parseDate } from "../utils/schemas";
import { toCsv } from "../utils/csv";

const EXPORT_LIMIT = 10000;

/** ?userId=&action=event&from=&to=  (action matches by prefix: "event" → event.create, event.update…) */
function buildWhere(query: Record<string, unknown>): Prisma.ActivityLogWhereInput {
  const where: Prisma.ActivityLogWhereInput = {};
  const userId = q(query.userId);
  const action = q(query.action);
  const from = parseDate(q(query.from));
  const to = parseDate(q(query.to), true);
  if (userId) where.userId = userId;
  if (action) where.action = { startsWith: action };
  if (from || to) where.createdAt = { ...(from && { gte: from }), ...(to && { lte: to }) };
  return where;
}

const USER_SUMMARY = { select: { id: true, name: true, email: true } } as const;

// GET /api/v1/activity
export async function listActivity(req: Request, res: Response) {
  const db = req.db!;
  const query = req.query as Record<string, unknown>;
  const { page, limit, skip } = pagination(query);
  const where = buildWhere(query);

  const [items, total] = await Promise.all([
    db.activityLog.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit, include: { user: USER_SUMMARY } }),
    db.activityLog.count({ where }),
  ]);
  return ok(res, items, 200, { total, page, limit });
}

// GET /api/v1/activity/export   (same filters, CSV, newest first, up to 10,000 rows)
export async function exportActivity(req: Request, res: Response) {
  const db = req.db!;
  const where = buildWhere(req.query as Record<string, unknown>);

  const items = await db.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: EXPORT_LIMIT,
    include: { user: USER_SUMMARY },
  });

  const csv = toCsv(
    ["When (UTC)", "Person", "Email", "Action", "Entity", "Entity ID", "IP address", "Details"],
    items.map((a) => [
      a.createdAt.toISOString(),
      a.user?.name ?? "System",
      a.user?.email ?? "",
      a.action,
      a.entityType ?? "",
      a.entityId ?? "",
      a.ipAddress ?? "",
      a.metadata ? JSON.stringify(a.metadata) : "",
    ])
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="activity-log-${new Date().toISOString().slice(0, 10)}.csv"`);
  return res.send(csv);
}