import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  userId: string;
  tokenVersion: number;
  /** Set when a superadmin is "logged in as" this user: the superadmin's user id. */
  imp?: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set in .env and be at least 32 characters long");
  }
  return secret;
}

/** A short (1 hour) session for a superadmin viewing an organization as one of its admins. */
export function signImpersonationToken(payload: Required<AuthTokenPayload>): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "1h" });
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
  return {
    userId: decoded.userId,
    tokenVersion: decoded.tokenVersion,
    ...(typeof decoded.imp === "string" ? { imp: decoded.imp } : {}),
  };
}
// ── Two-factor login challenge ──
// After a correct password, users with two-factor login get this short-lived token instead of a session.
// It's signed with a different key, so it can never be used as a login token.
interface TwoFactorChallenge {
  userId: string;
  tokenVersion: number;
  remember: boolean;
}

function challengeSecret() {
  return `${getSecret()}:two-factor-challenge`;
}

export function signTwoFactorChallenge(payload: TwoFactorChallenge): string {
  return jwt.sign({ ...payload, purpose: "2fa" }, challengeSecret(), { expiresIn: "5m" });
}

export function verifyTwoFactorChallenge(token: string): TwoFactorChallenge {
  const d = jwt.verify(token, challengeSecret());
  if (typeof d === "string" || d.purpose !== "2fa" || typeof d.userId !== "string" || typeof d.tokenVersion !== "number") {
    throw new Error("Malformed challenge");
  }
  return { userId: d.userId, tokenVersion: d.tokenVersion, remember: d.remember === true };
}
