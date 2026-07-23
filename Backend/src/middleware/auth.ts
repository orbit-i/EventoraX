import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthPayload {
  userId: string;
  organizationId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authedQuery(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const token = authHeader.split(" ")[1];

if (!token) {
  return res.status(401).json({ error: "Invalid token" });
}

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("JWT_SECRET is not configured");
}

const payload = jwt.verify(token, secret) as jwt.JwtPayload & AuthPayload;

req.user = {
  userId: payload.userId,
  organizationId: payload.organizationId,
  role: payload.role,
};

next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}