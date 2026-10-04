import { Request, Response, NextFunction } from "express";
import { getScopedPrisma, ScopedPrisma } from "../prisma/scopedClient";

declare global {
  namespace Express {
    interface Request {
      db?: ScopedPrisma;
    }
  }
}

/** Gives the request a Prisma client that can only see its own organization's rows. */
export function attachScopedPrisma(req: Request, res: Response, next: NextFunction) {
  const orgId = req.org?.id ?? req.user?.organizationId;
  if (!orgId) {
    return res.status(403).json({ error: "This action requires an organization account", code: "NO_ORG" });
  }
  req.db = getScopedPrisma(orgId);
  next();
}