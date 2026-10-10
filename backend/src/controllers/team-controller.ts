import { Request, Response } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import prisma from "../prisma/client";
import { ok, fail, validationFail } from "../utils/http";
import { seatLimitFor, seatsUsed } from "../utils/roleLimit";
import { sendInviteEmail } from "../utils/mail";
import { logActivity } from "../utils/activity";
import { randomToken, hashToken } from "../utils/tokens";
import { EMAIL_REGEX } from "../utils/password";

const INVITE_EXPIRY_DAYS = 7;
const ASSIGNABLE_ROLES = ["admin", "manager", "viewer"] as const; // never superAdmin
const roleField = z.enum(ASSIGNABLE_ROLES, { message: "Choose admin, manager or viewer" });

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => EMAIL_REGEX.test(v), "Enter a valid email address"),
  role: roleField,
});
const roleSchema = z.object({ role: roleField });

const ROLE_LABEL: Record<Role, string> = { superAdmin: "superadmin", admin: "admin", manager: "manager", viewer: "viewer" };

function seatLimitMessage(limit: number, role: Role) {
  return `Your plan allows ${limit} ${ROLE_LABEL[role]} seat${limit === 1 ? "" : "s"} (pending invites count too). Upgrade or free a seat first.`;
}

function inviteExpiry() {
  return new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
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
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
        invitedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    seatsUsed(db, "admin"),
    seatsUsed(db, "manager"),
  ]);

  return ok(res, {
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
  const parsed = inviteSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const { email, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const inThisOrg = existingUser.organizationId === org.id;
    return fail(res, 409, "EMAIL_TAKEN", "This email can't be invited", {
      fieldErrors: {
        email: inThisOrg ? "This person is already on your team" : "This email already has an EventoraX account",
      },
    });
  }

  const pending = await db.invitation.findUnique({
    where: { email_organizationId: { email, organizationId: org.id } },
  });
  if (pending && !pending.acceptedAt && pending.expiresAt > new Date()) {
    return fail(res, 409, "INVITE_PENDING", "An invite is already pending for this email", {
      fieldErrors: { email: "An invite is already pending for this email — resend it from the list instead" },
    });
  }

  const limit = seatLimitFor(org, role);
  if (limit !== null && (await seatsUsed(db, role)) >= limit) {
    return fail(res, 403, "SEAT_LIMIT", seatLimitMessage(limit, role), { fieldErrors: { role: seatLimitMessage(limit, role) } });
  }

  const rawToken = randomToken();
  const invitation = await db.invitation.upsert({
    where: { email_organizationId: { email, organizationId: org.id } },
    update: { role, token: hashToken(rawToken), expiresAt: inviteExpiry(), acceptedAt: null, invitedById: req.user!.userId },
    create: {
      email,
      role,
      token: hashToken(rawToken),
      expiresAt: inviteExpiry(),
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

  return ok(res, { id: invitation.id, email, role, expiresAt: invitation.expiresAt }, 201);
}

// POST /api/v1/team/invites/:inviteId/resend   (new link, another 7 days; the old link stops working)
export async function resendInvite(req: Request, res: Response) {
  const db = req.db!;
  const org = req.org!;
  const inviteId = String(req.params.inviteId);

  const invite = await db.invitation.findFirst({ where: { id: inviteId, acceptedAt: null } });
  if (!invite) return fail(res, 404, "NOT_FOUND", "Pending invite not found");

  const rawToken = randomToken();
  const updated = await db.invitation.update({
    where: { id: invite.id },
    data: { token: hashToken(rawToken), expiresAt: inviteExpiry() },
  });

  await sendInviteEmail(invite.email, rawToken, org.name, invite.role);
  await logActivity(req, {
    action: "team.invite.resend",
    entityType: "Invitation",
    entityId: invite.id,
    metadata: { email: invite.email },
  });

  return ok(res, { id: updated.id, expiresAt: updated.expiresAt });
}

// DELETE /api/v1/team/invites/:inviteId
export async function cancelInvite(req: Request, res: Response) {
  const db = req.db!;
  const inviteId = String(req.params.inviteId);

  const invite = await db.invitation.findFirst({ where: { id: inviteId, acceptedAt: null } });
  if (!invite) return fail(res, 404, "NOT_FOUND", "Pending invite not found");

  await db.invitation.delete({ where: { id: invite.id } });
  await logActivity(req, {
    action: "team.invite.cancel",
    entityType: "Invitation",
    entityId: inviteId,
    metadata: { email: invite.email },
  });
  return ok(res, { id: inviteId });
}

// PATCH /api/v1/team/:userId/role   body: { role }
export async function updateMemberRole(req: Request, res: Response) {
  const db = req.db!;
  const org = req.org!;
  const targetId = String(req.params.userId);

  if (targetId === req.user!.userId) {
    return fail(res, 400, "OWN_ROLE", "You can't change your own role. Ask another admin.");
  }
  const parsed = roleSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const newRole = parsed.data.role;

  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target) return fail(res, 404, "NOT_FOUND", "Member not found");

  const select = { id: true, name: true, email: true, role: true } as const;
  if (target.role === newRole) {
    return ok(res, { id: target.id, name: target.name, email: target.email, role: target.role });
  }

  if (target.role === "admin" && (await db.user.count({ where: { role: "admin" } })) <= 1) {
    return fail(res, 400, "LAST_ADMIN", "An organization must keep at least one admin");
  }

  const limit = seatLimitFor(org, newRole);
  if (limit !== null && (await seatsUsed(db, newRole)) >= limit) {
    return fail(res, 403, "SEAT_LIMIT", seatLimitMessage(limit, newRole));
  }

  // No re-login needed: requireAuth reads the role from the database on every request.
  const updated = await db.user.update({ where: { id: targetId }, data: { role: newRole }, select });

  await logActivity(req, {
    action: "team.role.update",
    entityType: "User",
    entityId: targetId,
    metadata: { name: target.name, from: target.role, to: newRole },
  });

  return ok(res, updated);
}

// DELETE /api/v1/team/:userId
export async function removeMember(req: Request, res: Response) {
  const db = req.db!;
  const targetId = String(req.params.userId);

  if (targetId === req.user!.userId) {
    return fail(res, 400, "REMOVE_SELF", "You can't remove yourself. Ask another admin.");
  }

  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target) return fail(res, 404, "NOT_FOUND", "Member not found");

  if (target.role === "admin" && (await db.user.count({ where: { role: "admin" } })) <= 1) {
    return fail(res, 400, "LAST_ADMIN", "An organization must keep at least one admin");
  }

  // Invites they sent would be deleted with them (cascade) — hand them to the admin doing the removal.
  await db.invitation.updateMany({ where: { invitedById: targetId }, data: { invitedById: req.user!.userId } });
  await db.user.delete({ where: { id: targetId } });
  await logActivity(req, {
    action: "team.remove",
    entityType: "User",
    entityId: targetId,
    metadata: { name: target.name, email: target.email },
  });

  return ok(res, { id: targetId });
}
