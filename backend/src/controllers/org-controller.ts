import { Request,Response } from "express";
import { uploadOrgLogo } from "../utils/logoStorage";
import prisma from "../prisma/client";


export async function getOrgProfile(req: Request, res: Response) {
  const org = await prisma.organization.findUnique({
    where: { id: req.user!.organizationId },
    include: { plan: true },
  });
  if (!org) return res.status(404).json({ error: "Organization not found" });
  res.json(org);
}

export async function updateOrgSettings(req: Request, res: Response) {
  const { name } = req.body; //can be extended in the future

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Valid name is required" });
  }

  const org = await prisma.organization.update({
    where: { id: req.user!.organizationId },
    data: { name },
  });
  res.json(org);
}

export async function uploadLogo(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const logoUrl = await uploadOrgLogo(req.user!.organizationId, req.file);

  const org = await prisma.organization.update({
    where: { id: req.user!.organizationId },
    data: { logoUrl },
  });
  res.json({ logoUrl: org.logoUrl });
}

export async function assignPlan(req: Request, res: Response) {
  const { planId } = req.body;

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    return res.status(404).json({ error: "Plan not found" });
  }

  const org = await prisma.organization.update({
    where: { id: req.user!.organizationId },
    data: {
      planId: plan.id,
      status: "active",
    },
  });
  res.json(org);
}