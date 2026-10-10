/**
 * Demo organization for testing every EventoraX feature.
 *
 *   npm run seed:demo -- --yes
 *
 * ⚠ Deletes EVERY organization (and its users, events, registrations, certificates, tickets,
 * payments, activity, uploads) first. Plans, system settings and the superadmin are kept.
 * Never sends emails. Refuses to run in production.
 */
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcrypt";
import { Prisma, type RegisteredVia, type RegistrationStatus, type Role } from "@prisma/client";
import prisma from "./client";
import { getScopedPrisma } from "./scopedClient";
import { newQrCode, newRefNo, newTicketNo } from "../utils/codes";
import { hashToken, randomToken } from "../utils/tokens";
import { UPLOAD_ROOT, PRIVATE_ROOT } from "../utils/storage";
import { issueCertificate } from "../services/certificates";

const DEMO_PASSWORD = "Demo@12345";
const MAIL = (tag: string) => `willkariim+${tag}@gmail.com`; // every demo address lands in one real inbox

// ─────────────────────────── helpers ───────────────────────────

/** Repeatable "random" numbers, so every run builds the same demo. */
let seed = 20261011;
function rand() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)]!;
const between = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

const DAY = 24 * 60 * 60 * 1000;
/** A Pakistan-time moment: days from today at hh:mm PKT. */
function pkt(days: number, hour: number, minute = 0) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days, hour - 5, minute));
}
const ago = (ms: number) => new Date(Date.now() - ms);
const minutesAfter = (d: Date, min: number) => new Date(d.getTime() + min * 60 * 1000);

// ─────────────────────────── people ───────────────────────────

const FIRST = ["Ayesha", "Ali", "Fatima", "Hamza", "Zainab", "Usman", "Maryam", "Bilal", "Hira", "Ahmed", "Sana", "Hassan", "Iqra", "Saad", "Mahnoor", "Omar", "Noor", "Danish", "Amna", "Fahad", "Laiba", "Talha", "Areeba", "Shahzaib", "Eman", "Haris", "Mehwish", "Arslan", "Rabia", "Faizan", "Kinza", "Junaid", "Sidra", "Moiz", "Anaya", "Rayyan", "Alishba", "Taimoor", "Hafsa", "Waleed"] as const;
const LAST = ["Khan", "Malik", "Ahmed", "Raza", "Hussain", "Siddiqui", "Qureshi", "Butt", "Chaudhry", "Sheikh", "Javed", "Abbasi", "Mirza", "Iqbal", "Shah", "Akhtar", "Farooq", "Rana", "Nawaz", "Zaidi"] as const;
const DEPTS = [
  { name: "Computer Science", code: "CS" },
  { name: "Software Engineering", code: "SE" },
  { name: "Data Science", code: "DS" },
  { name: "Electrical Engineering", code: "EE" },
  { name: "Business Administration", code: "BBA" },
  { name: "Artificial Intelligence", code: "AI" },
] as const;

interface Person {
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  rollNo: string | null;
}

function makePeople(count: number): Person[] {
  const used = new Set<string>();
  const out: Person[] = [];
  while (out.length < count) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const key = `${first}.${last}`.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    const dept = pick(DEPTS);
    const student = rand() < 0.8;
    out.push({
      name: `${first} ${last}`,
      email: MAIL(key),
      phone: rand() < 0.85 ? `+92 3${between(0, 4)}${between(0, 9)} ${between(1000000, 9999999)}` : null,
      department: student ? dept.name : rand() < 0.5 ? dept.name : null,
      rollNo: student ? `MU-${between(20, 24)}-${dept.code}-${String(between(1, 160)).padStart(3, "0")}` : null,
    });
  }
  return out;
}

function via(): RegisteredVia {
  const r = rand();
  return r < 0.5 ? "WEB" : r < 0.72 ? "CSV_IMPORT" : r < 0.94 ? "ADMIN" : "API";
}

// ─────────────────────────── wipe ───────────────────────────

async function wipe() {
  const orgs = await prisma.organization.findMany({ select: { id: true } });
  // Cascades remove users, events, registrations, tickets, certificates, payments, activity…
  await prisma.organization.deleteMany({});
  await prisma.contactMessage.deleteMany({});
  await prisma.activityLog.deleteMany({ where: { organizationId: null, userId: { not: null } } });
  await fs.rm(path.join(UPLOAD_ROOT, "orgs"), { recursive: true, force: true });
  await fs.rm(path.join(PRIVATE_ROOT, "orgs"), { recursive: true, force: true });
  console.log(`✔ Removed ${orgs.length} organization(s) and their files`);
}

// ─────────────────────────── main ───────────────────────────

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to run the demo seed in production.");
  if (!process.argv.includes("--yes")) {
    console.log("This deletes ALL organizations and their data, then builds the demo.\nRun again with:  npm run seed:demo -- --yes");
    return;
  }

  const pro = await prisma.plan.findUnique({ where: { name: "Pro" } });
  if (!pro) throw new Error('Plan "Pro" not found — run "npx prisma db seed" first.');

  await wipe();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ── Organization ──
  const createdAt = ago(330 * DAY);
  const org = await prisma.organization.create({
    data: {
      name: "Margalla University Computer Society",
      slug: "margalla-cs",
      email: MAIL("society"),
      phone: "+92 51 8443210",
      primaryColor: "#7c3aed",
      accentColor: "#f59e0b",
      signatoryName: "Dr. Sana Malik",
      signatoryTitle: "Head of Department, Computer Science",
      notificationPrefs: { newRegistration: true, attendance: true, certificate: false },
      status: "active",
      subscriptionEndsAt: new Date(Date.now() + 340 * DAY),
      planId: pro.id,
      createdAt,
    },
  });
  const db = getScopedPrisma(org.id);

  // ── Team ──
  const team: { key: string; name: string; email: string; role: Role; verified: boolean; lastLogin: Date | null; joined: Date }[] = [
    { key: "admin", name: "Will Karim", email: "willkariim@gmail.com", role: "admin", verified: true, lastLogin: ago(2 * 60 * 60 * 1000), joined: createdAt },
    { key: "hira", name: "Hira Javed", email: MAIL("hira"), role: "admin", verified: true, lastLogin: ago(DAY), joined: ago(300 * DAY) },
    { key: "usman", name: "Usman Tariq", email: MAIL("usman"), role: "manager", verified: true, lastLogin: ago(3 * 60 * 60 * 1000), joined: ago(280 * DAY) },
    { key: "ayesha", name: "Ayesha Siddiqui", email: MAIL("ayesha"), role: "manager", verified: true, lastLogin: ago(4 * DAY), joined: ago(150 * DAY) },
    { key: "bilal", name: "Bilal Ahmed", email: MAIL("bilal"), role: "viewer", verified: false, lastLogin: null, joined: ago(20 * DAY) },
  ];
  const users: Record<string, { id: string; name: string }> = {};
  for (const m of team) {
    const u = await prisma.user.create({
      data: {
        name: m.name,
        email: m.email,
        password: passwordHash,
        phone: `+92 300 ${between(1000000, 9999999)}`,
        role: m.role,
        organizationId: org.id,
        emailVerified: m.verified,
        lastLoginAt: m.lastLogin,
        createdAt: m.joined,
      },
    });
    users[m.key] = { id: u.id, name: u.name };
  }
  await prisma.invitation.create({
    data: {
      email: MAIL("zain"),
      role: "manager",
      token: hashToken(randomToken()),
      organizationId: org.id,
      invitedById: users.admin!.id,
      expiresAt: new Date(Date.now() + 5 * DAY),
      createdAt: ago(2 * DAY),
    },
  });
  console.log(`✔ Team: ${team.length} members + 1 pending invite`);

  // ── Billing history ──
  await prisma.payment.create({
    data: {
      organizationId: org.id,
      planId: pro.id,
      amount: pro.price,
      method: "BANK_TRANSFER",
      status: "REJECTED",
      referenceNo: "FT-0000123",
      notes: "Transferred from the department account.",
      createdAt: ago(29 * DAY),
    },
  });
  await prisma.payment.create({
    data: {
      organizationId: org.id,
      planId: pro.id,
      amount: pro.price,
      method: "JAZZCASH",
      status: "CONFIRMED",
      referenceNo: "03471829364",
      periodStart: ago(25 * DAY),
      periodEnd: new Date(Date.now() + 340 * DAY),
      confirmedAt: ago(25 * DAY),
      createdAt: ago(26 * DAY),
    },
  });

  // ── Events ──
  const people = makePeople(70);
  const activity: Prisma.ActivityLogCreateManyInput[] = [];
  const log = (userKey: string | null, action: string, at: Date, extra: Partial<Prisma.ActivityLogCreateManyInput> = {}) =>
    activity.push({ organizationId: org.id, userId: userKey ? users[userKey]!.id : null, action, createdAt: at, ipAddress: `39.${between(32, 63)}.${between(0, 255)}.${between(1, 254)}`, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141.0", ...extra });

  interface EventPlan {
    title: string;
    organizer: string;
    topic: string;
    description: string;
    mode: "OFFLINE" | "ONLINE" | "HYBRID";
    status: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "ARCHIVED";
    start: Date;
    end: Date;
    location: string | null;
    meetingLink: string | null;
    maxAttendees: number | null;
    ticketPrice: number | null;
    registrationOpen: boolean;
    autoIssueCert: boolean;
    certTemplateId: string | null;
    categories: { label: string; weight: number }[];
    createdDaysAgo: number;
    registrations: number;
    /** share of ATTENDED / ABSENT / CANCELLED (rest REGISTERED) */
    mix: { attended: number; absent: number; cancelled: number };
    certificates?: { count: number; emailed: number; revoke?: string };
    ticketsEmailed: number;
    creator: string;
  }

  const plans: EventPlan[] = [
    {
      title: "Margalla Tech Summit 2026",
      organizer: "Computer Society & ORIC",
      topic: "Cloud, AI and the future of software jobs in Pakistan",
      description:
        "Our flagship annual summit: keynotes from industry leaders, a startup expo and hands-on workshops.\n\nWho it's for: students, graduates and early-career engineers.\nWhat to bring: your student card and a laptop for the workshops.",
      mode: "OFFLINE",
      status: "COMPLETED",
      start: pkt(-21, 9),
      end: pkt(-21, 17),
      location: "Main Auditorium, Margalla University, Sector E-9, Islamabad",
      meetingLink: null,
      maxAttendees: 150,
      ticketPrice: null,
      registrationOpen: false,
      autoIssueCert: false,
      certTemplateId: "elegant-royal",
      categories: [
        { label: "General", weight: 6 },
        { label: "VIP", weight: 1 },
        { label: "Volunteer", weight: 2 },
        { label: "Speaker", weight: 1 },
      ],
      createdDaysAgo: 75,
      registrations: 34,
      mix: { attended: 0.76, absent: 0.15, cancelled: 0.09 },
      certificates: { count: 22, emailed: 18, revoke: "Issued to a duplicate registration" },
      ticketsEmailed: 30,
      creator: "admin",
    },
    {
      title: "Data Science Workshop: Python for Analytics",
      organizer: "Data Science Club",
      topic: "pandas, visualisation and a first ML model",
      description: "A full-day, hands-on workshop. Laptops required — we'll share the setup guide a week before.",
      mode: "OFFLINE",
      status: "COMPLETED",
      start: pkt(-74, 10),
      end: pkt(-74, 16),
      location: "Lab 3, Block C, Margalla University",
      meetingLink: null,
      maxAttendees: 30,
      ticketPrice: 1000,
      registrationOpen: false,
      autoIssueCert: false,
      certTemplateId: "classic-emerald",
      categories: [
        { label: "General", weight: 4 },
        { label: "Student", weight: 5 },
      ],
      createdDaysAgo: 120,
      registrations: 18,
      mix: { attended: 0.83, absent: 0.11, cancelled: 0.06 },
      certificates: { count: 15, emailed: 15 },
      ticketsEmailed: 18,
      creator: "usman",
    },
    {
      title: "AI & Machine Learning Bootcamp",
      organizer: "Computer Society",
      topic: "From linear regression to transformers",
      description: "A one-day intensive, in person and online. Bring a laptop with Python 3.11+ installed.",
      mode: "HYBRID",
      status: "ONGOING",
      start: new Date(Date.now() - 2 * 60 * 60 * 1000),
      end: new Date(Date.now() + 5 * 60 * 60 * 1000),
      location: "Seminar Hall B, Margalla University",
      meetingLink: "https://meet.google.com/abc-defg-hij",
      maxAttendees: 40,
      ticketPrice: 1500,
      registrationOpen: true,
      autoIssueCert: true,
      certTemplateId: "modern-brand",
      categories: [
        { label: "General", weight: 3 },
        { label: "Student", weight: 5 },
        { label: "Professional", weight: 2 },
      ],
      createdDaysAgo: 40,
      registrations: 26,
      mix: { attended: 0.42, absent: 0, cancelled: 0.04 },
      ticketsEmailed: 24,
      creator: "ayesha",
    },
    {
      title: "Startup Pitch Night",
      organizer: "Entrepreneurship Society",
      topic: "Student founders pitch to investors",
      description: "Ten student startups, five minutes each, live feedback from investors. Networking dinner after the pitches.",
      mode: "OFFLINE",
      status: "PUBLISHED",
      start: pkt(18, 18),
      end: pkt(18, 21, 30),
      location: "National Incubation Center, Blue Area, Islamabad",
      meetingLink: null,
      maxAttendees: 25,
      ticketPrice: 500,
      registrationOpen: true,
      autoIssueCert: false,
      certTemplateId: "bold-navy",
      categories: [
        { label: "General", weight: 5 },
        { label: "Founder", weight: 2 },
        { label: "Investor", weight: 1 },
      ],
      createdDaysAgo: 30,
      registrations: 22,
      mix: { attended: 0, absent: 0, cancelled: 0.05 },
      ticketsEmailed: 10,
      creator: "usman",
    },
    {
      title: "Cybersecurity Essentials Webinar",
      organizer: "Computer Society",
      topic: "Phishing, passwords and staying safe online",
      description: "A 90-minute live webinar with Q&A. The recording is shared with everyone who registers.",
      mode: "ONLINE",
      status: "PUBLISHED",
      start: pkt(9, 19),
      end: pkt(9, 20, 30),
      location: null,
      meetingLink: "https://zoom.us/j/9876543210",
      maxAttendees: null,
      ticketPrice: null,
      registrationOpen: true,
      autoIssueCert: true,
      certTemplateId: null,
      categories: [{ label: "General", weight: 1 }],
      createdDaysAgo: 12,
      registrations: 17,
      mix: { attended: 0, absent: 0, cancelled: 0 },
      ticketsEmailed: 0,
      creator: "ayesha",
    },
    {
      title: "Alumni Meetup 2025",
      organizer: "Alumni Relations",
      topic: "Reconnect with graduates",
      description: "Evening tea with our alumni working across Pakistan and abroad.",
      mode: "OFFLINE",
      status: "ARCHIVED",
      start: pkt(-210, 17),
      end: pkt(-210, 20),
      location: "University Lawn",
      meetingLink: null,
      maxAttendees: null,
      ticketPrice: null,
      registrationOpen: false,
      autoIssueCert: false,
      certTemplateId: null,
      categories: [{ label: "General", weight: 1 }],
      createdDaysAgo: 240,
      registrations: 9,
      mix: { attended: 0.78, absent: 0.22, cancelled: 0 },
      ticketsEmailed: 9,
      creator: "hira",
    },
    {
      title: "Winter Hackathon 2026",
      organizer: "Computer Society",
      topic: "36 hours, teams of 3–4, real problems from local NGOs",
      description: "Draft — dates and prizes to be confirmed with sponsors.",
      mode: "OFFLINE",
      status: "DRAFT",
      start: pkt(60, 9),
      end: pkt(61, 21),
      location: "Innovation Lab, Margalla University",
      meetingLink: null,
      maxAttendees: 120,
      ticketPrice: null,
      registrationOpen: false,
      autoIssueCert: true,
      certTemplateId: "geometric-brand",
      categories: [
        { label: "General", weight: 1 },
        { label: "Mentor", weight: 1 },
      ],
      createdDaysAgo: 3,
      registrations: 0,
      mix: { attended: 0, absent: 0, cancelled: 0 },
      ticketsEmailed: 0,
      creator: "admin",
    },
  ];

  const scanners = ["admin", "usman", "ayesha"];
  const createdEvents: { id: string; plan: EventPlan }[] = [];

  for (const p of plans) {
    const eventCreated = ago(p.createdDaysAgo * DAY);
    const event = await prisma.event.create({
      data: {
        organizationId: org.id,
        title: p.title,
        organizer: p.organizer,
        topic: p.topic,
        description: p.description,
        mode: p.mode,
        status: p.status,
        startDateTime: p.start,
        endDateTime: p.end,
        location: p.location,
        meetingLink: p.meetingLink,
        maxAttendees: p.maxAttendees,
        ticketPrice: p.ticketPrice,
        registrationOpen: p.registrationOpen,
        autoIssueCert: p.autoIssueCert,
        certTemplateId: p.certTemplateId,
        createdAt: eventCreated,
        categories: { create: p.categories.map((c) => ({ organizationId: org.id, label: c.label })) },
      },
      include: { categories: true },
    });
    createdEvents.push({ id: event.id, plan: p });
    log(p.creator, "event.create", eventCreated, { entityType: "Event", entityId: event.id, metadata: { title: p.title } });
    if (p.status === "PUBLISHED" || p.status === "COMPLETED" || p.status === "ONGOING") log(p.creator, "event.update", minutesAfter(eventCreated, 90), { entityType: "Event", entityId: event.id });
    if (p.status === "ARCHIVED") log("hira", "event.archive", ago(30 * DAY), { entityType: "Event", entityId: event.id });

    // Weighted category picker
    const bag = p.categories.flatMap((c) => Array(c.weight).fill(c.label) as string[]);
    const catId = (label: string) => event.categories.find((c) => c.label === label)!.id;

    // Registrations spread between creation and start (or now, if it hasn't started)
    const attendees = [...people].sort(() => rand() - 0.5).slice(0, p.registrations);
    const regEnd = Math.min(p.start.getTime(), Date.now()) - 60 * 60 * 1000;
    const regStart = eventCreated.getTime() + 60 * 60 * 1000;
    let csvBatch = 0;
    const regIds: { id: string; status: RegistrationStatus; name: string; email: string; category: string }[] = [];

    for (const [i, person] of attendees.entries()) {
      const r = rand();
      const status: RegistrationStatus =
        r < p.mix.attended ? "ATTENDED" : r < p.mix.attended + p.mix.absent ? "ABSENT" : r < p.mix.attended + p.mix.absent + p.mix.cancelled ? "CANCELLED" : "REGISTERED";
      const category = i === 0 && bag.includes("VIP") ? "VIP" : pick(bag);
      const registeredVia = via();
      if (registeredVia === "CSV_IMPORT") csvBatch++;
      const when = new Date(regStart + rand() * Math.max(1, regEnd - regStart));
      const ticketType = category;
      const used = status === "ATTENDED";
      const usedAt = used ? new Date(Math.min(Date.now() - 5 * 60 * 1000, p.start.getTime() + between(-40, 90) * 60 * 1000)) : null;

      const reg = await prisma.registration.create({
        data: {
          organizationId: org.id,
          eventId: event.id,
          categoryId: catId(category),
          refNo: newRefNo(),
          name: person.name,
          email: person.email,
          phone: person.phone,
          department: person.department,
          rollNo: person.rollNo,
          registeredVia,
          status,
          registrationDate: when,
          createdAt: when,
          ticket: {
            create: {
              organizationId: org.id,
              eventId: event.id,
              ticketNo: newTicketNo(),
              qrCode: newQrCode(),
              type: ticketType,
              isUsed: used,
              usedAt,
              usedById: used ? users[pick(scanners)]!.id : null,
              emailedAt: i < p.ticketsEmailed && status !== "CANCELLED" ? minutesAfter(when, 2) : null,
              createdAt: when,
            },
          },
        },
      });
      regIds.push({ id: reg.id, status, name: person.name, email: person.email, category });
      if (registeredVia === "ADMIN") log(pick(["usman", "ayesha", "admin"]), "registration.create", when, { entityType: "Registration", entityId: reg.id, metadata: { email: person.email } });
      if (used && i % 4 === 0) log(pick(scanners), "ticket.checkin", usedAt!, { entityType: "Ticket", metadata: { name: person.name } });
    }
    if (csvBatch > 0) log(p.creator, "registration.csv_import", minutesAfter(eventCreated, 60 * 24 * 3), { entityType: "Event", entityId: event.id, metadata: { inserted: csvBatch } });

    // Certificates (real PDFs, backdated to after the event)
    if (p.certificates) {
      const eventForCert = { id: event.id, title: event.title, startDateTime: event.startDateTime, location: event.location, mode: event.mode, certTemplateId: event.certTemplateId };
      const attended = regIds.filter((r) => r.status === "ATTENDED").slice(0, p.certificates.count);
      const issuedAt = new Date(p.end.getTime() + 2 * DAY);
      const certIds: string[] = [];
      for (const r of attended) {
        const cert = await issueCertificate(db, org, eventForCert, { id: r.id, name: r.name, email: r.email, category: { label: r.category } }, {
          type: "PARTICIPATION",
          templateKey: p.certTemplateId ?? "classic-royal",
          issuedAt,
        });
        certIds.push(cert.id);
      }
      for (const [i, id] of certIds.entries()) {
        await prisma.certificate.update({
          where: { id },
          data: { emailedAt: i < p.certificates.emailed ? minutesAfter(issuedAt, 5 + i) : null, downloadCount: between(0, 4) },
        });
      }
      if (p.certificates.revoke && certIds.length > 0) {
        const id = certIds[certIds.length - 1]!;
        await prisma.certificate.update({ where: { id }, data: { status: "REVOKED", revokedAt: minutesAfter(issuedAt, 60 * 24), revokeReason: p.certificates.revoke } });
        log("admin", "certificate.revoke", minutesAfter(issuedAt, 60 * 24), { entityType: "Certificate", entityId: id, metadata: { name: attended[attended.length - 1]!.name, reason: p.certificates.revoke } });
      }
      log(p.creator, "certificate.bulk", issuedAt, { entityType: "Event", entityId: event.id, metadata: { title: p.title, issued: certIds.length, type: "PARTICIPATION" } });
    }
  }
  console.log(`✔ Events: ${plans.length} with registrations, tickets and certificates`);

  // ── Speakers, sponsors, schedule ──
  const program: Record<string, { speakers: [string, string, string, string, string][]; sponsors: [string, "PLATINUM" | "GOLD" | "SILVER" | "BRONZE", string][]; sessions: [string, number, number, string, number | null][] }> = {
    "Margalla Tech Summit 2026": {
      speakers: [
        ["Kamran", "Siddiqui", "CTO", "Nexa Cloud", "Building cloud products for Pakistan"],
        ["Mahira", "Aslam", "Principal ML Engineer", "Indus AI Labs", "LLMs in Urdu: what actually works"],
        ["Faisal", "Rehman", "Founder & CEO", "Saffron Pay", "From campus project to funded startup"],
        ["Dr. Nadia", "Haider", "Associate Professor", "Margalla University", "Research careers in computing"],
        ["Omer", "Latif", "Engineering Manager", "Kohsar Telecom", "Hiring in tech: what we look for"],
      ],
      sponsors: [
        ["Nexa Cloud", "PLATINUM", "https://nexacloud.example.pk"],
        ["Indus AI Labs", "GOLD", "https://indusai.example.pk"],
        ["Saffron Pay", "SILVER", "https://saffronpay.example.pk"],
        ["Ravi Software House", "BRONZE", "https://ravisoft.example.pk"],
      ],
      sessions: [
        ["Registration & breakfast", 0, 45, "Main Lobby", null],
        ["Keynote: Building cloud products for Pakistan", 45, 45, "Main Auditorium", 0],
        ["LLMs in Urdu: what actually works", 100, 50, "Main Auditorium", 1],
        ["Panel: Hiring in tech", 160, 60, "Main Auditorium", 4],
        ["Workshop: Your first startup pitch", 290, 75, "Seminar Hall A", 2],
        ["Research careers in computing", 375, 45, "Seminar Hall B", 3],
      ],
    },
    "AI & Machine Learning Bootcamp": {
      speakers: [
        ["Mahira", "Aslam", "Principal ML Engineer", "Indus AI Labs", "Transformers from scratch"],
        ["Zeeshan", "Haider", "Data Scientist", "Pine Valley Bank", "ML in production"],
        ["Dr. Rizwan", "Ali", "Assistant Professor", "Margalla University", "Maths you need for ML"],
      ],
      sponsors: [
        ["Indus AI Labs", "GOLD", "https://indusai.example.pk"],
        ["Pine Valley Bank", "SILVER", "https://pinevalley.example.pk"],
      ],
      sessions: [
        ["Maths you need for ML", 0, 60, "Seminar Hall B", 2],
        ["Hands-on: regression & classification", 70, 90, "Lab 3", 2],
        ["Lunch break", 160, 45, "Cafeteria", null],
        ["Transformers from scratch", 205, 80, "Seminar Hall B", 0],
        ["ML in production at a bank", 300, 60, "Seminar Hall B", 1],
      ],
    },
    "Startup Pitch Night": {
      speakers: [
        ["Faisal", "Rehman", "Founder & CEO", "Saffron Pay", "Judge"],
        ["Sadia", "Mir", "Partner", "Kohsar Ventures", "Judge"],
      ],
      sponsors: [
        ["Kohsar Ventures", "PLATINUM", "https://kohsarvc.example.pk"],
        ["Saffron Pay", "GOLD", "https://saffronpay.example.pk"],
        ["Nexa Cloud", "BRONZE", "https://nexacloud.example.pk"],
      ],
      sessions: [
        ["Welcome & rules", 0, 15, "Hall 1", null],
        ["Pitches: round 1", 15, 60, "Hall 1", 1],
        ["Pitches: round 2", 85, 50, "Hall 1", 0],
        ["Results & networking dinner", 140, 70, "Terrace", null],
      ],
    },
    "Cybersecurity Essentials Webinar": {
      speakers: [["Ahsan", "Qureshi", "Security Lead", "Kohsar Telecom", "Staying safe online"]],
      sponsors: [],
      sessions: [
        ["Phishing: real examples from Pakistan", 0, 40, "Online", 0],
        ["Passwords, 2FA and Q&A", 40, 50, "Online", 0],
      ],
    },
  };

  let speakerCount = 0;
  let sessionCount = 0;
  for (const { id: eventId, plan } of createdEvents) {
    const prog = program[plan.title];
    if (!prog) continue;
    const speakerIds: string[] = [];
    for (const [i, [firstName, lastName, title, company, topic]] of prog.speakers.entries()) {
      const s = await prisma.speaker.create({
        data: {
          organizationId: org.id,
          eventId,
          firstName,
          lastName,
          title,
          company,
          sessionTopic: topic,
          bio: `${firstName} ${lastName} is ${title} at ${company}, with over ${between(6, 18)} years of experience. They speak regularly at universities across Pakistan.`,
          linkedin: `https://www.linkedin.com/in/${firstName.toLowerCase().replace(/[^a-z]/g, "")}-${lastName.toLowerCase()}`,
          // On upcoming events the last speaker is still hidden (not confirmed yet) — shows the "Hidden" state.
          displayPublic: !(plan.status === "PUBLISHED" && i === prog.speakers.length - 1 && prog.speakers.length > 1),
          displayOrder: i,
        },
      });
      speakerIds.push(s.id);
      speakerCount++;
    }
    for (const [i, [name, tier, website]] of prog.sponsors.entries()) {
      await prisma.sponsor.create({ data: { organizationId: org.id, eventId, name, tier, website, displayPublic: true, displayOrder: i } });
    }
    for (const [i, [title, offset, length, location, speaker]] of prog.sessions.entries()) {
      const startTime = minutesAfter(plan.start, offset);
      await prisma.session.create({
        data: {
          organizationId: org.id,
          eventId,
          title,
          startTime,
          endTime: minutesAfter(startTime, length),
          location,
          speakerId: speaker === null ? null : speakerIds[speaker] ?? null,
          displayPublic: true,
          displayOrder: i,
        },
      });
      sessionCount++;
    }
  }
  console.log(`✔ Program: ${speakerCount} speakers, sponsors, ${sessionCount} sessions`);

  // ── Activity: logins, team, billing, support ──
  for (let d = 60; d >= 0; d -= between(1, 4)) log(pick(["admin", "usman", "ayesha", "hira"]), "auth.login", ago(d * DAY + between(0, 8) * 60 * 60 * 1000));
  log("admin", "team.invite", ago(300 * DAY), { entityType: "Invitation", metadata: { email: MAIL("hira"), role: "admin" } });
  log("hira", "team.invite.accept", ago(300 * DAY - 3 * 60 * 60 * 1000));
  log("admin", "team.invite", ago(2 * DAY), { entityType: "Invitation", metadata: { email: MAIL("zain"), role: "manager" } });
  log("hira", "team.role.update", ago(60 * DAY), { entityType: "User", entityId: users.ayesha!.id, metadata: { name: "Ayesha Siddiqui", from: "viewer", to: "manager" } });
  log("admin", "org.settings.update", ago(100 * DAY), { entityType: "Organization", entityId: org.id, metadata: { fields: ["primaryColor", "accentColor"] } });
  log("admin", "billing.payment.submit", ago(29 * DAY), { entityType: "Payment", metadata: { plan: "Pro", method: "BANK_TRANSFER" } });
  log("admin", "billing.payment.submit", ago(26 * DAY), { entityType: "Payment", metadata: { plan: "Pro", method: "JAZZCASH" } });
  log("usman", "support.request", ago(8 * DAY), { entityType: "ContactMessage" });
  await prisma.activityLog.createMany({ data: activity });

  await prisma.contactMessage.create({
    data: {
      organizationId: org.id,
      name: "Usman Tariq",
      email: MAIL("usman"),
      orgName: org.name,
      message: "Subject: CSV import question\n\nCan we import attendees with a Roll No column from Google Forms? Our sheet has extra columns.",
      source: "DASHBOARD",
      createdAt: ago(8 * DAY),
    },
  });
  await prisma.contactMessage.create({
    data: {
      name: "Prof. Imran Shah",
      email: MAIL("imran.shah"),
      orgName: "Potohar Institute of Technology",
      message: "We run around 15 events a semester. Is there an education discount on the Enterprise plan?",
      source: "PUBLIC",
      createdAt: ago(4 * DAY),
    },
  });

  const counts = await Promise.all([
    prisma.registration.count({ where: { organizationId: org.id } }),
    prisma.certificate.count({ where: { organizationId: org.id } }),
    prisma.ticket.count({ where: { organizationId: org.id, isUsed: true } }),
    prisma.activityLog.count({ where: { organizationId: org.id } }),
  ]);
  console.log(`✔ ${counts[0]} registrations · ${counts[1]} certificates · ${counts[2]} check-ins · ${counts[3]} activity entries`);
  console.log(`\nLog in as willkariim@gmail.com / ${DEMO_PASSWORD}  (admin)`);
  console.log(`Other logins (same password): ${MAIL("hira")} (admin), ${MAIL("usman")} (manager), ${MAIL("ayesha")} (manager), ${MAIL("bilal")} (viewer)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
