import { Request, Response } from "express";
import { Role } from "@prisma/client";
import prisma from "../prisma/client";
import { seatLimitFor, seatsUsed } from "../utils/roleLimit";
import { sendInviteEmail } from "../utils/mail";
import { logActivity } from "../utils/activity";
import { randomToken, hashToken } from "../utils/tokens";
import { EMAIL_REGEX } from "../utils/password";

const INVITE_EXPIRY_DAYS = 7;
const ASSIGNABLE_ROLES: Role[] = ["admin", "manager", "viewer"]; // never superAdmin

function isAssignableRole(value: unknown): value is Role {
  return typeof value === "string" && (ASSIGNABLE_ROLES as string[]).includes(value);
}

// GET /api/v1/team
export async function getTeamMembers(req: Request, res: Response) {
  const db = req.db!;
  const org = req.org!;

  const [members, pendingInvites, adminsUsed, managersUsed] = await Promise.all([
    db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.invitation.findMany({
      where: { acceptedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, role: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    }),
    seatsUsed(db, "admin"),
    seatsUsed(db, "manager"),
  ]);

  return res.json({
    members,
    pendingInvites,
    seats: {
      admin: { used: adminsUsed, limit: seatLimitFor(org, "admin") },
      manager: { used: managersUsed, limit: seatLimitFor(org, "manager") },
    },
  });
}

// POST /api/v1/team/invite   body: { email, role }
export async function inviteMember(req: Request, res: Response) {
  const db = req.db!;
  const org = req.org!;
  const body = req.body ?? {};
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body.role;

  if (!EMAIL_REGEX.test(email) || !isAssignableRole(role)) {
    return res.status(400).json({ error: "A valid email and a role of admin, manager or viewer are required" });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: "This email already has an EventoraX account" });
  }

  const pending = await db.invitation.findUnique({
    where: { email_organizationId: { email, organizationId: org.id } },
  });
  if (pending && !pending.acceptedAt && pending.expiresAt > new Date()) {
    return res.status(409).json({ error: "An invite is already pending for this email" });
  }

  const limit = seatLimitFor(org, role);
  if (limit !== null && (await seatsUsed(db, role)) >= limit) {
    return res
      .status(403)
      .json({ error: `Your plan allows ${limit} ${role} seat(s). Upgrade to add more.`, code: "SEAT_LIMIT" });
  }

  const rawToken = randomToken();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const invitation = await db.invitation.upsert({
    where: { email_organizationId: { email, organizationId: org.id } },
    update: { role, token: hashToken(rawToken), expiresAt, acceptedAt: null, invitedById: req.user!.userId },
    create: {
      email,
      role,
      token: hashToken(rawToken),
      expiresAt,
      organizationId: org.id,
      invitedById: req.user!.userId,
    },
  });

  await sendInviteEmail(email, rawToken, org.name, role);
  await logActivity(req, {
    action: "team.invite",
    entityType: "Invitation",
    entityId: invitation.id,
    metadata: { email, role },
  });

  return res.status(201).json({ message: "Invite sent", invitationId: invitation.id });
}

// DELETE /api/v1/team/invites/:inviteId
export async function cancelInvite(req: Request, res: Response) {
  const db = req.db!;
  const inviteId = String(req.params.inviteId);

  const result = await db.invitation.deleteMany({ where: { id: inviteId, acceptedAt: null } });
  if (result.count === 0) {
    return res.status(404).json({ error: "Pending invite not found" });
  }

  await logActivity(req, { action: "team.invite.cancel", entityType: "Invitation", entityId: inviteId });
  return res.json({ message: "Invite cancelled" });
}

// PATCH /api/v1/team/:userId/role   body: { role }
export async function updateMemberRole(req: Request, res: Response) {
  const db = req.db!;
  const org = req.org!;
  const targetId = String(req.params.userId);
  const newRole = (req.body ?? {}).role;

  if (targetId === req.user!.userId) {
    return res.status(400).json({ error: "You cannot change your own role" });
  }
  if (!isAssignableRole(newRole)) {
    return res.status(400).json({ error: "Role must be admin, manager or viewer" });
  }

  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return res.status(404).json({ error: "Member not found" });
  }
  if (target.role === newRole) {
    return res.json({ message: "No change" });
  }

  if (target.role === "admin" && (await db.user.count({ where: { role: "admin" } })) <= 1) {
    return res.status(400).json({ error: "An organization must keep at least one admin" });
  }

  const limit = seatLimitFor(org, newRole);
  if (limit !== null && (await seatsUsed(db, newRole)) >= limit) {
    return res.status(403).json({ error: `Your plan allows ${limit} ${newRole} seat(s).`, code: "SEAT_LIMIT" });
  }

  const updated = await db.user.update({
    where: { id: targetId },
    data: { role: newRole },
    select: { id: true, name: true, email: true, role: true },
  });

  await logActivity(req, {
    action: "team.role.update",
    entityType: "User",
    entityId: targetId,
    metadata: { from: target.role, to: newRole },
  });

  return res.json({ message: "Role updated", user: updated });
}

// DELETE /api/v1/team/:userId
export async function removeMember(req: Request, res: Response) {
  const db = req.db!;
  const targetId = String(req.params.userId);

  if (targetId === req.user!.userId) {
    return res.status(400).json({ error: "You cannot remove yourself" });
  }

  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return res.status(404).json({ error: "Member not found" });
  }

  if (target.role === "admin" && (await db.user.count({ where: { role: "admin" } })) <= 1) {
    return res.status(400).json({ error: "An organization must keep at least one admin" });
  }

  await db.user.delete({ where: { id: targetId } });
  await logActivity(req, {
    action: "team.remove",
    entityType: "User",
    entityId: targetId,
    metadata: { email: target.email },
  });

  return res.json({ message: "Member removed" });
}