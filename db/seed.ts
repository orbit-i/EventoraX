import "dotenv/config";
import { getDb } from "../api/queries/connection";
import { plans, systemSettings, emailTemplates } from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Seed plans
  const existingPlans = await db.select().from(plans);
  if (existingPlans.length === 0) {
    await db.insert(plans).values([
      {
        name: "Pro",
        slug: "pro",
        price: "20000",
        billingPeriod: "yearly",
        currency: "PKR",
        maxAdmins: 3,
        maxManagers: 7,
        maxEvents: 0,
        maxAttendees: 0,
        trialDays: 1,
        isActive: true,
        isVisible: true,
      },
      {
        name: "Enterprise",
        slug: "enterprise",
        price: "25000",
        billingPeriod: "yearly",
        currency: "PKR",
        maxAdmins: 0,
        maxManagers: 0,
        maxEvents: 0,
        maxAttendees: 0,
        trialDays: 1,
        isActive: true,
        isVisible: true,
      },
    ]);
    console.log("Plans seeded");
  }

  // Seed system settings
  const existingSettings = await db.select().from(systemSettings);
  if (existingSettings.length === 0) {
    await db.insert(systemSettings).values([
      { key: "platform_name", value: "EventoraX", category: "general" },
      { key: "platform_tagline", value: "Complete Event Management Platform", category: "general" },
      { key: "contact_email", value: "support@eventorax.com", category: "contact" },
      { key: "contact_whatsapp", value: "+92-300-1234567", category: "contact" },
      { key: "trial_period_days", value: "1", category: "billing" },
      { key: "maintenance_mode", value: "false", category: "system" },
      { key: "payment_jazzcash", value: "0321-1234567", category: "payment" },
      { key: "payment_easypaisa", value: "0321-1234567", category: "payment" },
      { key: "payment_bank_iban", value: "PK00ABCD1234567890", category: "payment" },
      { key: "seo_title", value: "EventoraX - Event Management Platform", category: "seo" },
      { key: "seo_description", value: "Manage events, issue certificates, QR ticketing, and more.", category: "seo" },
    ]);
    console.log("System settings seeded");
  }

  // Seed email templates
  const existingTemplates = await db.select().from(emailTemplates);
  if (existingTemplates.length === 0) {
    await db.insert(emailTemplates).values([
      {
        name: "Welcome Email",
        slug: "welcome",
        subject: "Welcome to EventoraX!",
        bodyHtml: "<h1>Welcome to EventoraX!</h1><p>Thank you for joining us.</p>",
        bodyText: "Welcome to EventoraX! Thank you for joining us.",
        isSystem: true,
        isActive: true,
      },
      {
        name: "Registration Confirmation",
        slug: "registration_confirm",
        subject: "Event Registration Confirmed",
        bodyHtml: "<h1>Registration Confirmed</h1><p>You have successfully registered for the event.</p>",
        bodyText: "Registration Confirmed. You have successfully registered for the event.",
        isSystem: true,
        isActive: true,
      },
      {
        name: "Certificate Issued",
        slug: "certificate_issued",
        subject: "Your Certificate is Ready!",
        bodyHtml: "<h1>Congratulations!</h1><p>Your certificate has been issued. Verify code: {{verifyCode}}</p>",
        bodyText: "Congratulations! Your certificate has been issued.",
        isSystem: true,
        isActive: true,
      },
      {
        name: "Renewal Reminder",
        slug: "renewal_reminder",
        subject: "Subscription Renewal Reminder",
        bodyHtml: "<h1>Renewal Reminder</h1><p>Your subscription expires soon. Please renew to continue.</p>",
        bodyText: "Your subscription expires soon. Please renew to continue.",
        isSystem: true,
        isActive: true,
      },
    ]);
    console.log("Email templates seeded");
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
