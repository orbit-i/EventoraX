import { Request, Response } from "express";
import { ok, fail } from "../utils/http";

// In-app notifications for the logged-in person (announcements from the EventoraX team for now).

// GET /api/v1/notifications?limit=
export async function listNotifications(req: Request, res: Response) {
  const db = req.db!;
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
  const me = req.user!.userId;
  const [items, unread] = await Promise.all([
    db.notification.findMany({
      where: { userId: me },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, body: true, link: true, readAt: true, createdAt: true },
    }),
    db.notification.count({ where: { userId: me, readAt: null } }),
  ]);
  return ok(res, { items, unread });
}

// POST /api/v1/notifications/:id/read
export async function markRead(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);
  const mine = await db.notification.count({ where: { id, userId: req.user!.userId } });
  if (!mine) return fail(res, 404, "NOT_FOUND", "Notification not found");
  await db.notification.updateMany({ where: { id, userId: req.user!.userId, readAt: null }, data: { readAt: new Date() } });
  return ok(res, { id, read: true });
}

// POST /api/v1/notifications/read-all
export async function markAllRead(req: Request, res: Response) {
  const result = await req.db!.notification.updateMany({ where: { userId: req.user!.userId, readAt: null }, data: { readAt: new Date() } });
  return ok(res, { updated: result.count });
}
