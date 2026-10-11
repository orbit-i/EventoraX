import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import prisma from "../prisma/client";
import { verifyAuthToken, AuthTokenPayload } from "../utils/jwt";

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null; // null only for superAdmin
  /** The superadmin's id when this session is an impersonation ("log in as"). */
  impersonatorId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Verifies the Bearer token AND re-checks the user in the database on every request,
 * so disabled accounts, role changes and "log out everywhere" take effect immediately.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated", code: "NO_TOKEN" });
  }

  let payload: AuthTokenPayload;
  try {
    payload = verifyAuthToken(header.slice("Bearer ".length));
  } catch {
    return res.status(401).json({ error: "Your session has expired. Please log in again.", code: "BAD_TOKEN" });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, organizationId: true, isActive: true, tokenVersion: true },
  });

  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    return res.status(401).json({ error: "Your session is no longer valid. Please log in again.", code: "BAD_TOKEN" });
  }

  // Impersonation only works while the superadmin who started it is still an active superadmin.
  if (payload.imp) {
    const admin = await prisma.user.findUnique({ where: { id: payload.imp }, select: { role: true, isActive: true } });
    if (!admin || admin.role !== "superAdmin" || !admin.isActive) {
      return res.status(401).json({ error: "This 'log in as' session has ended.", code: "BAD_TOKEN" });
    }
  }

  req.user = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    ...(payload.imp ? { impersonatorId: payload.imp } : {}),
  };
  next();
}