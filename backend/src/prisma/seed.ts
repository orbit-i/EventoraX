import prisma from "./client";


async function main() {
  await prisma.plan.createMany({
    data: [
      {
        name: "Starter",
        price: 0,
        maxSeats: null, 
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
        price: 70,
        features: {
          maxAttendees: null, // unlimited
          maxEvents: 20,
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