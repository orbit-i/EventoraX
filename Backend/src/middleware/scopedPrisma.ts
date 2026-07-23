import { Request, Response, NextFunction } from "express";
import { getScopedPrisma } from "../prisma/scopedClient";

declare global {
  namespace Express {
    interface Request {
      db?: ReturnType<typeof getScopedPrisma>;
    }
  }
}

export function attachScopedPrisma(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.db = getScopedPrisma(req.user.organizationId);
  next();
}