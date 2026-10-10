import { Router, Request } from "express";
import bcrypt from "bcrypt";
import { isValidPhoneNumber } from "libphonenumber-js";
import { User } from "@prisma/client";
import prisma from "../prisma/client";
import { requireAuth } from "../middleware/auth";
import { signAuthToken } from "../utils/jwt";
import { randomToken, hashToken } from "../utils/tokens";
import { isStrongPassword, PASSWORD_RULE_MESSAGE, EMAIL_REGEX } from "../utils/password";
import { getSetting } from "../utils/settings";
import { logActivity } from "../utils/activity";
import { sendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail } from "../utils/mail";

const router = Router();

const DAY_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_MINUTES = 15;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

// Compared against when the email doesn't exist, so the response takes the same
// time either way (stops attackers from discovering which emails are registered).
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const bodyOf = (req: Request): Record<string, unknown> => (req.body ?? {}) as Record<string, unknown>;

function publicUser(u: Pick<User, "id" | "name" | "email" | "role" | "organizationId" | "emailVerified">) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    organizationId: u.organizationId,
    emailVerified: u.emailVerified,
  };
}

async function uniqueSlug(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "org";
  let slug = base;
  let counter = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

/** Emails must never break the request that triggered them. */
function safeSend(promise: Promise<void>): Promise<void> {
  return promise.catch((err) => console.error("Email failed:", err));
}

// ───────────────────────── REGISTER ─────────────────────────
// POST /api/v1/auth/register  { fullName, organizationName, email, phone, password }
router.post("/register", async (req, res) => {
  const b = bodyOf(req);
  const fullName = str(b.fullName);
  const organizationName = str(b.organizationName);
  const email = str(b.email).toLowerCase();
  const phone = str(b.phone);
  const password = b.password;

  if (!fullName || !organizationName || !email || !phone || typeof password !== "string") {
    return res.status(400).json({ error: "Full name, organization name, email, phone and password are required" });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: PASSWORD_RULE_MESSAGE });
  }
  if (!isValidPhoneNumber(phone, "PK")) {
    return res.status(400).json({ error: "Enter a valid phone number, e.g. +92 300 1234567" });
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const [trialDays, trialPlan, slug, hashedPassword] = await Promise.all([
    getSetting<number>("trial.days", 1),
    prisma.plan.findUnique({ where: { name: "Pro" } }),
    uniqueSlug(organizationName),
    bcrypt.hash(password, 10),
  ]);
  const verifyToken = randomToken();

  const { org, user } = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: organizationName,
        slug,
        email,
        phone,
        status: "trial",
        planId: trialPlan?.id ?? null, // trial runs on the Pro plan
        subscriptionEndsAt: new Date(Date.now() + trialDays * DAY_MS),
      },
    });
    const user = await tx.user.create({
      data: { name: fullName, email, phone, password: hashedPassword, role: "admin", organizationId: org.id },
    });
    await tx.emailVerificationToken.create({
      data: { token: hashToken(verifyToken), userId: user.id, expiresAt: new Date(Date.now() + DAY_MS) },
    });
    return { org, user };
  });

  await Promise.all([
    safeSend(sendVerificationEmail(email, verifyToken)),
    safeSend(sendWelcomeEmail(email, fullName, org.name)),
  ]);

  await logActivity(req, {
    action: "auth.register",
    organizationId: org.id,
    userId: user.id,
    entityType: "Organization",
    entityId: org.id,
  });

  return res.status(201).json({
    token: signAuthToken({ userId: user.id, tokenVersion: user.tokenVersion }),
    user: publicUser(user),
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status,
      subscriptionEndsAt: org.subscriptionEndsAt,
    },
  });
});

// ───────────────────────── EMAIL VERIFICATION ─────────────────────────
// GET /api/v1/auth/verify-email?token=...
router.get("/verify-email", async (req, res) => {
  const token = str(req.query.token);
  if (!token) {
    return res.status(400).json({ error: "Verification token is missing" });
  }

  const row = await prisma.emailVerificationToken.findUnique({
    where: { token: hashToken(token) },
    include: { user: { select: { organizationId: true } } },
  });
  if (!row || row.expiresAt < new Date()) {
    return res.status(400).json({ error: "This verification link is invalid or has expired" });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { emailVerified: true } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: row.userId } }),
  ]);

  await logActivity(req, {
    action: "auth.email.verify",
    organizationId: row.user.organizationId,
    userId: row.userId,
  });
  return res.json({ message: "Email verified successfully" });
});

// POST /api/v1/auth/resend-verification   (logged in)
router.post("/resend-verification", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  if (user.emailVerified) {
    return res.status(400).json({ error: "Your email is already verified" });
  }

  const token = randomToken();
  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
    prisma.emailVerificationToken.create({
      data: { token: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + DAY_MS) },
    }),
  ]);

  await sendVerificationEmail(user.email, token);
  return res.json({ message: "Verification email sent" });
});

// ───────────────────────── LOGIN ─────────────────────────
// POST /api/v1/auth/login  { email, password, remember? }
router.post("/login", async (req, res) => {
  const b = bodyOf(req);
  const email = str(b.email).toLowerCase();
  const password = b.password;
  const remember = b.remember === true;

  if (!email || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Brute-force protection: count failures since the later of
  // (15 minutes ago) and (this email's last successful login).
  const lastSuccess = await prisma.loginAttempt.findFirst({
    where: { email, success: true },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const windowStart = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000);
  const since = lastSuccess && lastSuccess.createdAt > windowStart ? lastSuccess.createdAt : windowStart;

  const recentFailures = await prisma.loginAttempt.count({
    where: { email, success: false, createdAt: { gte: since } },
  });
  if (recentFailures >= MAX_FAILED_LOGINS) {
    return res.status(429).json({
      error: `Too many failed attempts. Please try again in ${LOCKOUT_MINUTES} minutes.`,
      code: "LOCKED",
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: { select: { status: true } } },
  });
  const passwordOk = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  const success = !!user && passwordOk;

  await prisma.loginAttempt.create({
    data: {
      email,
      userId: user?.id ?? null,
      success,
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    },
  });

  if (!user || !passwordOk) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (!user.isActive) {
    return res
      .status(403)
      .json({ error: "This account has been disabled. Contact your administrator.", code: "ACCOUNT_DISABLED" });
  }
  if (user.organization?.status === "suspended") {
    return res
      .status(403)
      .json({ error: "This organization has been suspended. Please contact support.", code: "ORG_SUSPENDED" });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await logActivity(req, { action: "auth.login", organizationId: user.organizationId, userId: user.id });

  return res.json({
    token: signAuthToken({ userId: user.id, tokenVersion: user.tokenVersion }, remember),
    user: publicUser(user),
    organizationStatus: user.organization?.status ?? null,
  });
});

// ───────────────────────── PASSWORD RESET ─────────────────────────
// POST /api/v1/auth/forgot-password  { email }
router.post("/forgot-password", async (req, res) => {
  const email = str(bodyOf(req).email).toLowerCase();
  const genericReply = { message: "If that email is registered, a reset link has been sent" };

  if (!email) {
    return res.json(genericReply);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.isActive) {
    const token = randomToken();
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({
        data: {
          token: hashToken(token),
          userId: user.id,
          expiresAt: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000),
        },
      }),
    ]);
    await safeSend(sendResetPasswordEmail(user.email, token));
  }

  // Same reply whether or not the email exists.
  return res.json(genericReply);
});

// POST /api/v1/auth/reset-password  { token, newPassword }
router.post("/reset-password", async (req, res) => {
  const b = bodyOf(req);
  const token = str(b.token);
  const newPassword = b.newPassword;

  if (!token) {
    return res.status(400).json({ error: "Reset token is missing" });
  }
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ error: PASSWORD_RULE_MESSAGE });
  }

  const row = await prisma.passwordResetToken.findUnique({
    where: { token: hashToken(token) },
    include: { user: { select: { organizationId: true } } },
  });
  if (!row || row.expiresAt < new Date()) {
    if (row) await prisma.passwordResetToken.delete({ where: { id: row.id } });
    return res.status(400).json({ error: "This reset link is invalid or has expired" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    // tokenVersion +1 logs out every existing session.
    // Clicking the emailed link also proves the email belongs to them.
    prisma.user.update({
      where: { id: row.userId },
      data: { password: hashed, tokenVersion: { increment: 1 }, emailVerified: true },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
  ]);

  await logActivity(req, {
    action: "auth.password.reset",
    organizationId: row.user.organizationId,
    userId: row.userId,
  });
  return res.json({ message: "Password updated. Please log in with your new password." });
});

// ───────────────────────── CURRENT USER ─────────────────────────
// GET /api/v1/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { organization: { include: { plan: true } } },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ user: publicUser(user), organization: user.organization });
});
// PATCH /api/v1/auth/me  { name?, phone? }   (edit your own profile)
router.patch("/me", requireAuth, async (req, res) => {
  const b = bodyOf(req);
  const data: { name?: string; phone?: string | null } = {};

  if (b.name !== undefined) {
    const name = str(b.name);
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: "Name must be 2–100 characters", fieldErrors: { name: "Name must be 2–100 characters" } });
    }
    data.name = name;
  }
  if (b.phone !== undefined) {
    const phone = str(b.phone);
    if (phone && !isValidPhoneNumber(phone, "PK")) {
      return res.status(400).json({ error: "Enter a valid phone number", fieldErrors: { phone: "Enter a valid phone number, e.g. +92 300 1234567" } });
    }
    data.phone = phone || null;
  }

  const user = await prisma.user.update({ where: { id: req.user!.userId }, data });
  await logActivity(req, { action: "auth.profile.update" });
  return res.json({ user: publicUser(user) });
});
// POST /api/v1/auth/change-password  { currentPassword, newPassword }
router.post("/change-password", requireAuth, async (req, res) => {
  const b = bodyOf(req);
  const currentPassword = b.currentPassword;
  const newPassword = b.newPassword;

  if (typeof currentPassword !== "string" || !currentPassword) {
    return res.status(400).json({ error: "Current password is required" });
  }
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ error: PASSWORD_RULE_MESSAGE });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(400).json({ error: "Current password is incorrect" });
  }
  if (await bcrypt.compare(newPassword, user.password)) {
    return res.status(400).json({ error: "New password must be different from the current one" });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(newPassword, 10), tokenVersion: { increment: 1 } },
  });

  await logActivity(req, { action: "auth.password.change" });

  // Every other session is now logged out; this one gets a fresh token.
  return res.json({
    message: "Password changed",
    token: signAuthToken({ userId: updated.id, tokenVersion: updated.tokenVersion }),
  });
});

// POST /api/v1/auth/logout-all
router.post("/logout-all", requireAuth, async (req, res) => {
  await prisma.user.update({ where: { id: req.user!.userId }, data: { tokenVersion: { increment: 1 } } });
  await logActivity(req, { action: "auth.logout.all" });
  return res.json({ message: "Logged out of all devices" });
});

// ───────────────────────── TEAM INVITES ─────────────────────────
// GET /api/v1/auth/invite/:token   (public — shows who invited you)
router.get("/invite/:token", async (req, res) => {
  const invite = await prisma.invitation.findUnique({
    where: { token: hashToken(String(req.params.token)) },
    include: { organization: { select: { name: true, logoUrl: true } } },
  });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return res.status(404).json({ error: "This invite is invalid or has expired" });
  }
  return res.json({
    email: invite.email,
    role: invite.role,
    organization: invite.organization,
    expiresAt: invite.expiresAt,
  });
});

// POST /api/v1/auth/accept-invite  { token, name, password, phone? }
router.post("/accept-invite", async (req, res) => {
  const b = bodyOf(req);
  const token = str(b.token);
  const name = str(b.name);
  const phone = str(b.phone);
  const password = b.password;

  if (!token || !name) {
    return res.status(400).json({ error: "Name and invite token are required" });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: PASSWORD_RULE_MESSAGE });
  }
  if (phone && !isValidPhoneNumber(phone, "PK")) {
    return res.status(400).json({ error: "Enter a valid phone number, e.g. +92 300 1234567" });
  }

  const invite = await prisma.invitation.findUnique({
    where: { token: hashToken(token) },
    include: { organization: { select: { status: true } } },
  });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return res.status(400).json({ error: "This invite is invalid or has expired" });
  }
  if (invite.organization.status === "suspended") {
    return res.status(403).json({ error: "This organization has been suspended", code: "ORG_SUSPENDED" });
  }
  if (await prisma.user.findUnique({ where: { email: invite.email } })) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        email: invite.email,
        phone: phone || null,
        password: hashed,
        role: invite.role,
        organizationId: invite.organizationId,
        emailVerified: true, // they received the invite at this address
      },
    });
    await tx.invitation.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    return created;
  });

  await logActivity(req, {
    action: "team.invite.accept",
    organizationId: invite.organizationId,
    userId: user.id,
    entityType: "User",
    entityId: user.id,
  });

  return res.status(201).json({
    token: signAuthToken({ userId: user.id, tokenVersion: user.tokenVersion }),
    user: publicUser(user),
  });
});

export default router;