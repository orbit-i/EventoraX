import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  userId: string;
  tokenVersion: number;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set in .env and be at least 32 characters long");
  }
  return secret;
}

/** remember = true → 30-day session ("Remember me"), otherwise 1 day. */
export function signAuthToken(payload: AuthTokenPayload, remember = false): string {
  return jwt.sign(payload, getSecret(), { expiresIn: remember ? "30d" : "1d" });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getSecret());
  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "string" ||
    typeof decoded.tokenVersion !== "number"
  ) {
    throw new Error("Malformed token");
  }
  return { userId: decoded.userId, tokenVersion: decoded.tokenVersion };
}