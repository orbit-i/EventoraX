import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma/client";

const router = express.Router();

interface RegisterOrgBody {
  fullName: string;
  organizationName: string;
  email: string;
  password: string;
  phone: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

router.post(
  "/organizations/register",
  async (req: Request<{}, {}, RegisterOrgBody>, res: Response) => {
    const { fullName, organizationName, email, password, phone } = req.body;

    if (!fullName || !organizationName || !email || !password || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const baseSlug = generateSlug(organizationName);
      
      let slug = baseSlug;
      let counter = 1;
      while (await prisma.organization.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: { name: organizationName, slug },
        });

        const adminUser = await tx.user.create({
          data: {
            name: fullName,
            email,
            password: hashedPassword,
            phone,
            role: "admin",
            organizationId: org.id,
          },
        });

        return { org, adminUser };
      });

      const { password: _, ...userWithoutPassword } = result.adminUser;

      return res.status(201).json({
        organization: result.org,
        admin: userWithoutPassword,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Registration failed" });
    }
  }
);

export default router;