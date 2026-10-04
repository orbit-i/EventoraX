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

  req.user = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
  };
  next();
}