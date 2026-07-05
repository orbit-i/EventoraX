import { EventMode, EventStatus, RegistrationStatus, RegisteredVia, RegistrationCategory, SponsorTier } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const TENANTS = ["tenant_alpha_univ", "tenant_beta_corp"];

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function seedEventForTenant(tenantId: string, index: number) {
  const event = await prisma.event.create({
    data: {
      tenantId,
      title: `${tenantId === TENANTS[0] ? "TechFest" : "GrowthSummit"} 202${index}`,
      mode: [EventMode.ONLINE, EventMode.OFFLINE, EventMode.HYBRID][index % 3],
      startDateTime: daysFromNow(10 + index * 5),
      endDateTime: daysFromNow(10 + index * 5 + 1),
      location: index % 2 === 0 ? "Main Auditorium" : null,
      description: "Seeded sample event for local development.",
      topic: "Technology & Innovation",
      maxAttendees: 200 + index * 50,
      ticketPrice: index === 0 ? 0 : 15.0,
      registrationOpen: true,
      meetingLink: index % 3 === 0 ? "https://meet.example.com/room" : null,
      status: [EventStatus.PUBLISHED, EventStatus.DRAFT, EventStatus.ONGOING][index % 3],
    },
  });

  // Speakers
  const speaker1 = await prisma.speaker.create({
    data: {
      tenantId,
      eventId: event.id,
      firstName: "Aisha",
      lastName: "Khan",
      title: "Senior Engineer",
      company: "Orbit Labs",
      sessionTopic: "Scaling Multi-Tenant SaaS",
      bio: "10+ years building developer platforms.",
      displayOrder: 0,
    },
  });

  const speaker2 = await prisma.speaker.create({
    data: {
      tenantId,
      eventId: event.id,
      firstName: "Bilal",
      lastName: "Ahmed",
      title: "Product Lead",
      company: "NimbusWorks",
      sessionTopic: "Designing for Scale",
      displayOrder: 1,
    },
  });

  // Sponsors
  await prisma.sponsor.createMany({
    data: [
      { tenantId, eventId: event.id, name: "Acme Corp", tier: SponsorTier.PLATINUM, displayOrder: 0 },
      { tenantId, eventId: event.id, name: "Beta Tools", tier: SponsorTier.GOLD, displayOrder: 1 },
      { tenantId, eventId: event.id, name: "Casey Co", tier: SponsorTier.SILVER, displayOrder: 2 },
    ],
  });

  // Sessions
  await prisma.session.createMany({
    data: [
      {
        tenantId,
        eventId: event.id,
        speakerId: speaker1.id,
        title: "Opening Keynote",
        startTime: daysFromNow(10 + index * 5),
        endTime: daysFromNow(10 + index * 5),
        location: "Main Hall",
        displayOrder: 0,
      },
      {
        tenantId,
        eventId: event.id,
        speakerId: speaker2.id,
        title: "Product Deep Dive",
        startTime: daysFromNow(10 + index * 5),
        endTime: daysFromNow(10 + index * 5),
        location: "Room B",
        displayOrder: 1,
      },
    ],
  });

  // Registrations
  await prisma.registration.createMany({
    data: [
      {
        tenantId,
        eventId: event.id,
        refNo: `${tenantId.slice(0, 4).toUpperCase()}-${event.id.slice(-4)}-001`,
        name: "Sara Malik",
        email: "sara.malik@example.com",
        department: "Computer Science",
        rollNo: "CS-101",
        category: RegistrationCategory.STUDENT,
        registeredVia: RegisteredVia.WEB,
        status: RegistrationStatus.CONFIRMED,
      },
      {
        tenantId,
        eventId: event.id,
        refNo: `${tenantId.slice(0, 4).toUpperCase()}-${event.id.slice(-4)}-002`,
        name: "Hamza Iqbal",
        email: "hamza.iqbal@example.com",
        category: RegistrationCategory.PROFESSIONAL,
        registeredVia: RegisteredVia.ADMIN,
        status: RegistrationStatus.PENDING,
      },
      {
        tenantId,
        eventId: event.id,
        refNo: `${tenantId.slice(0, 4).toUpperCase()}-${event.id.slice(-4)}-003`,
        name: "Fatima Noor",
        email: "fatima.noor@example.com",
        category: RegistrationCategory.FACULTY,
        registeredVia: RegisteredVia.CSV_IMPORT,
        status: RegistrationStatus.ATTENDED,
      },
    ],
  });
}

async function main() {
  console.log("Seeding database...");

  for (const tenantId of TENANTS) {
    for (let i = 0; i < 3; i++) {
      await seedEventForTenant(tenantId, i);
    }
  }

  console.log("Seed complete: 2 tenants, 3 events each, with speakers/sponsors/sessions/registrations.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
