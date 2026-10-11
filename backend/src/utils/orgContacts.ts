import prisma from "../prisma/client";

/** Who should hear about billing / platform news for an organization: its active admins (+ the org email). */
export async function orgAdminEmails(organizationId: string): Promise<string[]> {
  const [org, admins] = await Promise.all([
    prisma.organization.findUnique({ where: { id: organizationId }, select: { email: true } }),
    prisma.user.findMany({ where: { organizationId, role: "admin", isActive: true }, select: { email: true } }),
  ]);
  return [...new Set([...admins.map((a) => a.email), ...(org?.email ? [org.email] : [])].map((e) => e.toLowerCase()))];
}
