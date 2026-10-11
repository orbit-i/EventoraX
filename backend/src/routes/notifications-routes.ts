import { Router } from "express";
import { orgScopedAllowExpired } from "../middleware/orgChain";
import { listNotifications, markRead, markAllRead } from "../controllers/notifications-controller";

// Works for expired organizations too: renewal reminders and announcements must reach them.
export const notificationsRouter = Router();
notificationsRouter.use(...orgScopedAllowExpired);

notificationsRouter.get("/", listNotifications);
notificationsRouter.post("/read-all", markAllRead);
notificationsRouter.post("/:id/read", markRead);
