import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.createMany({
    data: [
      {
        name: "Starter",
        price: 0,
        maxSeats: null, // not shown on this tier, adjust if you have a seat limit
        features: {
          maxAttendees: 50,
          maxEventsAtOnce: 1,
          certificates: "basic",
          support: "email",
          customBranding: false,
          qrTicketing: false,
          apiAccess: false,
          whiteLabel: false,
        },
      },
      {
        name: "Pro",
        price: 29,
        features: {
          maxAttendees: null, // unlimited
          maxEvents: 10,
          certificates: "custom",
          qrTicketing: true,
          support: "priority",
          customBranding: true,
          apiAccess: false,
          whiteLabel: false,
        },
      },
      {
        name: "Enterprise",
        price: 99,
        features: {
          maxAttendees: null,
          maxEvents: null, // unlimited
          whiteLabel: true,
          apiAccess: "full",
          support: "dedicated",
          ssoIntegration: true,
          customDomains: true,
          slaGuarantee: true,
        },
      },
    ],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });