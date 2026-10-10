import "dotenv/config";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import prisma from "./client";

async function seedPlans() {
  const plans = [
    {
      name: "Pro",
      price: 20000, // PKR per year
      maxAdmins: 3,
      maxManagers: 7,
      sortOrder: 1,
      features: {
        unlimitedEvents: true,
        unlimitedAttendees: true,
        certificateTemplates: 50,
        qrTicketing: true,
        bulkCertificates: true,
        idCardTemplates: 4,
        analytics: true,
        emailAutomation: true,
        auditLogs: true,
        restApi: false,
        customDomain: false,
        whiteLabel: false,
        prioritySupport: false,
      },
    },
    {
      name: "Enterprise",
      price: 25000, // PKR per year
      maxAdmins: null, // unlimited
      maxManagers: null, // unlimited
      sortOrder: 2,
      features: {
        unlimitedEvents: true,
        unlimitedAttendees: true,
        certificateTemplates: 50,
        qrTicketing: true,
        bulkCertificates: true,
        idCardTemplates: 4,
        analytics: true,
        emailAutomation: true,
        auditLogs: true,
        restApi: true,
        customDomain: true,
        whiteLabel: true,
        prioritySupport: true,
      },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }
  console.log("✔ Plans: Pro, Enterprise");
}

async function seedSuperAdmin() {
  const email = process.env.SEED_SUPERADMIN_EMAIL;
  const password = process.env.SEED_SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("⚠ SEED_SUPERADMIN_EMAIL / SEED_SUPERADMIN_PASSWORD not set — skipping superadmin");
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: {}, // never overwrite an existing account
    create: {
      name: "Super Admin",
      email,
      password: hashed,
      role: "superAdmin",
      emailVerified: true,
    },
  });
  console.log(`✔ Superadmin: ${email}`);
}

async function seedSettings() {
  const defaults: Record<string, Prisma.InputJsonValue> = {
    "platform.name": "EventoraX",
    "trial.days": 1,
    "maintenance.enabled": false,
    "contact.email": "",
    "contact.whatsapp": "",
    "contact.hours": "Mon–Fri, 9:00 am – 6:00 pm (PKT)",
    "payments.accounts": { jazzcash: "", easypaisa: "", bankIban: "" },
    "uploads.maxMb": 5,
    "certificates.defaultTemplate": "classic-01",
  };

  for (const [key, value] of Object.entries(defaults)) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: {}, // keep values an admin already changed
      create: { key, value },
    });
  }
  console.log("✔ System settings");
}

async function main() {
  await seedPlans();
  await seedSuperAdmin();
  await seedSettings();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });