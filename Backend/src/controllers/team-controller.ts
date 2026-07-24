import { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../prisma/client";
import { ROLE_SEAT_LIMITS, getRoleUsageCount } from "../utils/roleLimit";
import { sendInviteEmail } from "../utils/mail";

const INVITE_EXPIRY_DAYS = 7;

export async function inviteMember(req: Request, res: Response) {
  const { email, role } = req.body;
  const { organizationId, userId } = req.user; 

  if (!email || !role) {
    return res.status(400).json({ message: "email and role are required" });
  }

  if (role === "superAdmin") {
    return res.status(400).json({ message: "Cannot invite a superAdmin" });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: "This email is already registered to an organization" });
  }

  const existingInvite = await req.db.invitation.findUnique({
    where: { email_organizationId: { email, organizationId } },
  });
  if (existingInvite && !existingInvite.acceptedAt && existingInvite.expiresAt > new Date()) {
    return res.status(409).json({ message: "An invite is already pending for this email" });
  }

  const limit = ROLE_SEAT_LIMITS[role as keyof typeof ROLE_SEAT_LIMITS];
  if (limit !== undefined) {
    const currentCount = await getRoleUsageCount(req.db, organizationId, role);
    if (currentCount >= limit) {
      return res.status(403).json({ message: `${role} seat limit (${limit}) reached for this plan` });
    }
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const invitation = await req.db.invitation.upsert({
    where: { email_organizationId: { email, organizationId } },
    update: { role, token, expiresAt, acceptedAt: null, invitedById: userId },
    create: { email, role, organizationId, token, expiresAt, invitedById: userId },
  });

  await sendInviteEmail(email, token);

  return res.status(201).json({ message: "Invite sent", invitationId: invitation.id });
}

export async function getTeamMembers(req: Request, res: Response) {
  const { organizationId } = req.user;

  const members = await req.db.user.findMany({
    where: { organizationId },
    select: { id: true, name: true, email: true, role: true, createdAt: true, emailVerified: true },
  });

  const pendingInvites = await req.db.invitation.findMany({
    where: { organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, email: true, role: true, createdAt: true, expiresAt: true },
  });

  return res.json({ members, pendingInvites });
}

export async function updateMemberRole(req: Request, res: Response) {
  const { userId: targetUserId } = req.params;
  const { role: newRole } = req.body;
  const { organizationId, userId: requesterId } = req.user;

  if (targetUserId === requesterId) {
    return res.status(400).json({ message: "You cannot change your own role" });
  }

  const targetUser = await req.db.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    return res.status(404).json({ message: "Member not found" });
  }

  if (targetUser.role === newRole) {
    return res.json({ message: "No change", user: targetUser });
  }

  const limit = ROLE_SEAT_LIMITS[newRole as keyof typeof ROLE_SEAT_LIMITS];
  if (limit !== undefined) {
    const currentCount = await getRoleUsageCount(req.db, organizationId, newRole);
    if (currentCount >= limit) {
      return res.status(403).json({ message: `${newRole} seat limit (${limit}) reached` });
    }
  }

  const updated = await req.db.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });

  return res.json({ message: "Role updated", user: updated });
}

export async function removeMember(req: Request, res: Response) {
  const { userId: targetUserId } = req.params;
  const { userId: requesterId, organizationId } = req.user;

  if (targetUserId === requesterId) {
    return res.status(400).json({ message: "You cannot remove yourself" });
  }

  const targetUser = await req.db.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    return res.status(404).json({ message: "Member not found" });
  }

  if (targetUser.role === "admin") {
    const adminCount = await req.db.user.count({ where: { organizationId, role: "admin" } });
    if (adminCount <= 1) {
      return res.status(400).json({ message: "Cannot remove the last admin" });
    }
  }

  await req.db.user.delete({ where: { id: targetUserId } });

  return res.json({ message: "Member removed" });
}