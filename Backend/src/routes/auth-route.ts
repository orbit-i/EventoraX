import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from 'crypto'
import prisma from "../prisma/client"
import { sendResetPasswordEmail,sendVerificationEmail } from "../utils/mail";
import { register } from "module";


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

router.post("/register",
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

        const rawToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await tx.emailVerificationToken.create({
          data: { token: rawToken, userId: adminUser.id, expiresAt },
        });

        return { org, adminUser, rawToken };
      });

      await sendVerificationEmail(result.adminUser.email, result.rawToken);

      const { password: _, ...userWithoutPassword } = result.adminUser;

      return res.status(201).json({
        message: "Registration successful. Please check your email to verify your account.",
        organization: result.org,
        admin: userWithoutPassword,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Registration failed" });
    }
  }
);
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Invalid verification link" });
  }

  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return res.status(400).json({ error: "Invalid or expired verification link" });
  }

  if (verificationToken.expiresAt < new Date()) {
    return res.status(400).json({ error: "Verification link has expired" });
  }

  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { emailVerified: true },
  });

  await prisma.emailVerificationToken.delete({
    where: { id: verificationToken.id },
  });

  res.status(200).json({ message: "Email verified successfully" });
});

router.post("/login", 
    async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (!user.emailVerified) {
    return res.status(403).json({ error: "Please verify your email before logging in" });
  }

  const token = jwt.sign(
    { userId: user.id, organizationId: user.organizationId, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return res.status(200).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.post('/forgot-password',
    async(req,res)=>{
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(200).json({ message: "If that email exists, a reset link has been sent" });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.passwordResetToken.create({
            data: { token, userId: user.id, expiresAt },
        });
        await sendResetPasswordEmail(user.email, token);
        return res.status(200).json({ message: "If that email exists, a reset link has been sent" });
    });

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      if (resetToken) await prisma.passwordResetToken.delete({ where: { token } });
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});






export default router;