import { Request, Response } from "express";
import prisma from "../../prisma/client";
import { ok, fail, q } from "../../utils/http";
import { logActivity } from "../../utils/activity";
import { toCsv } from "../../utils/csv";
import { monthStart, fillMonths } from "../../utils/months";
import { ReportKit, monthLabel, newReport } from "../../pdf/report";
import { toBuffer } from "../../pdf/assets";

async function monthly(table: "organizations" | "events" | "registrations" | "certificates") {
  const since = monthStart(11);
  // Table / column names are fixed strings chosen here, never user input.
  const rows =
    table === "organizations"
      ? await prisma.$queryRaw<{ month: string; count: bigint }[]>`SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month, COUNT(*) AS count FROM organizations WHERE createdAt >= ${since} GROUP BY month`
      : table === "events"
        ? await prisma.$queryRaw<{ month: string; count: bigint }[]>`SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month, COUNT(*) AS count FROM events WHERE createdAt >= ${since} GROUP BY month`
        : table === "registrations"
          ? await prisma.$queryRaw<{ month: string; count: bigint }[]>`SELECT DATE_FORMAT(registrationDate, '%Y-%m') AS month, COUNT(*) AS count FROM registrations WHERE registrationDate >= ${since} AND status <> 'CANCELLED' GROUP BY month`
          : await prisma.$queryRaw<{ month: string; count: bigint }[]>`SELECT DATE_FORMAT(issuedAt, '%Y-%m') AS month, COUNT(*) AS count FROM certificates WHERE issuedAt >= ${since} GROUP BY month`;
  return fillMonths(rows, 12);
}

/** Everything the platform Analytics page and its PDF / CSV exports show. */
async function platformAnalytics() {
  const [orgs, events, registrations, certificates, planGroups, plans, regByOrg, eventsByOrg, topEventsRaw, totals] = await Promise.all([
    monthly("organizations"),
    monthly("events"),
    monthly("registrations"),
    monthly("certificates"),
    prisma.organization.groupBy({ by: ["planId", "status"], _count: { _all: true } }),
    prisma.plan.findMany({ select: { id: true, name: true } }),
    prisma.registration.groupBy({ by: ["organizationId"], where: { status: { not: "CANCELLED" } }, _count: { _all: true }, orderBy: { _count: { organizationId: "desc" } }, take: 10 }),
    prisma.event.groupBy({ by: ["organizationId"], where: { status: { not: "ARCHIVED" } }, _count: { _all: true } }),
    prisma.event.findMany({
      orderBy: { registrations: { _count: "desc" } },
      take: 10,
      select: { id: true, title: true, startDateTime: true, status: true, organization: { select: { id: true, name: true } }, _count: { select: { registrations: true } } },
    }),
    Promise.all([
      prisma.organization.count(),
      prisma.event.count({ where: { status: { not: "ARCHIVED" } } }),
      prisma.registration.count({ where: { status: { not: "CANCELLED" } } }),
      prisma.certificate.count({ where: { status: "ISSUED" } }),
    ]),
  ]);

  const planName = new Map(plans.map((p) => [p.id, p.name]));
  const byPlan = new Map<string, { plan: string; total: number; active: number; trial: number; expired: number; suspended: number }>();
  for (const g of planGroups) {
    const name = g.planId ? planName.get(g.planId) ?? "Deleted plan" : "No plan";
    const row = byPlan.get(name) ?? { plan: name, total: 0, active: 0, trial: 0, expired: 0, suspended: 0 };
    row.total += g._count._all;
    row[g.status] += g._count._all;
    byPlan.set(name, row);
  }

  const orgIds = regByOrg.map((r) => r.organizationId);
  const orgRows = orgIds.length ? await prisma.organization.findMany({ where: { id: { in: orgIds } }, select: { id: true, name: true, status: true, plan: { select: { name: true } } } }) : [];
  const orgById = new Map(orgRows.map((o) => [o.id, o]));
  const eventCount = new Map(eventsByOrg.map((e) => [e.organizationId, e._count._all]));

  return {
    totals: { organizations: totals[0], events: totals[1], registrations: totals[2], certificates: totals[3] },
    monthly: orgs.map((m, i) => ({ month: m.month, organizations: m.count, events: events[i]!.count, registrations: registrations[i]!.count, certificates: certificates[i]!.count })),
    planDistribution: [...byPlan.values()].sort((a, b) => b.total - a.total),
    topOrganizations: regByOrg
      .map((r) => {
        const o = orgById.get(r.organizationId);
        return o ? { id: o.id, name: o.name, status: o.status, plan: o.plan?.name ?? null, registrations: r._count._all, events: eventCount.get(o.id) ?? 0 } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null),
    topEvents: topEventsRaw.map(({ _count, ...e }) => ({ ...e, registrations: _count.registrations })),
  };
}

// GET /api/v1/superadmin/analytics
export async function getPlatformAnalytics(_req: Request, res: Response) {
  return ok(res, await platformAnalytics());
}

// GET /api/v1/superadmin/analytics/report   (PDF)
export async function platformAnalyticsReport(req: Request, res: Response) {
  const data = await platformAnalytics();
  const doc = newReport("EventoraX platform report", "EventoraX");
  doc.addPage();
  const kit = new ReportKit(doc, "#7c3aed");
  kit.header({ title: "Platform report", subtitle: "All organizations", orgName: "EventoraX", logo: null, generatedBy: req.user!.name });
  kit.kpis([
    { label: "Organizations", value: data.totals.organizations },
    { label: "Events", value: data.totals.events, hint: "not archived" },
    { label: "Registrations", value: data.totals.registrations, hint: "cancelled excluded" },
    { label: "Certificates", value: data.totals.certificates, hint: "valid" },
  ]);
  const label = (m: string, i: number) => monthLabel(m, i === 0 || m.endsWith("-01"));
  kit.section("New organizations per month", "Last 12 months");
  kit.barChart(data.monthly.map((m, i) => ({ label: label(m.month, i), value: m.organizations })), { height: 90 });
  kit.section("Registrations per month");
  kit.barChart(data.monthly.map((m, i) => ({ label: label(m.month, i), value: m.registrations })), { color: "#2a78d6", height: 90 });
  kit.columns(
    (k) => {
      k.section("Events created per month");
      k.barChart(data.monthly.map((m, i) => ({ label: label(m.month, i).slice(0, 3), value: m.events })), { color: "#eda100", height: 70 });
    },
    (k) => {
      k.section("Certificates issued per month");
      k.barChart(data.monthly.map((m, i) => ({ label: label(m.month, i).slice(0, 3), value: m.certificates })), { color: "#1baf7a", height: 70 });
    }
  );
  kit.section("Plan distribution");
  kit.table(
    [
      { header: "Plan", width: 3 },
      { header: "Organizations", width: 1.6, align: "right" },
      { header: "Active", width: 1, align: "right" },
      { header: "Trial", width: 1, align: "right" },
      { header: "Expired", width: 1, align: "right" },
      { header: "Suspended", width: 1.2, align: "right" },
    ],
    data.planDistribution.map((p) => [p.plan, p.total, p.active, p.trial, p.expired, p.suspended])
  );
  kit.section("Top 10 organizations", "By registrations (cancelled excluded)");
  kit.table(
    [
      { header: "Organization", width: 4 },
      { header: "Plan", width: 1.4 },
      { header: "Events", width: 1, align: "right" },
      { header: "Registrations", width: 1.5, align: "right" },
    ],
    data.topOrganizations.map((o) => [o.name, o.plan ?? "—", o.events, o.registrations])
  );
  kit.section("Top 10 events", "By registrations");
  kit.table(
    [
      { header: "Event", width: 3.5 },
      { header: "Organization", width: 2.5 },
      { header: "Date", width: 1.4 },
      { header: "Registrations", width: 1.4, align: "right" },
    ],
    data.topEvents.map((e) => [e.title, e.organization.name, e.startDateTime.toISOString().slice(0, 10), e.registrations])
  );
  kit.footer("EventoraX · Platform report · Confidential");
  const pdf = await toBuffer(doc);
  await logActivity(req, { action: "platform.analytics.report" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="platform-report-${new Date().toISOString().slice(0, 10)}.pdf"`);
  return res.send(pdf);
}

// GET /api/v1/superadmin/analytics/export?dataset=monthly|plans|organizations|events   (CSV)
export async function platformAnalyticsCsv(req: Request, res: Response) {
  const dataset = q(req.query.dataset) ?? "monthly";
  const data = await platformAnalytics();
  let csv: string;
  if (dataset === "monthly") {
    csv = toCsv(
      ["Month", "New organizations", "Events created", "Registrations", "Certificates issued"],
      data.monthly.map((m) => [m.month, String(m.organizations), String(m.events), String(m.registrations), String(m.certificates)])
    );
  } else if (dataset === "plans") {
    csv = toCsv(["Plan", "Organizations", "Active", "Trial", "Expired", "Suspended"], data.planDistribution.map((p) => [p.plan, p.total, p.active, p.trial, p.expired, p.suspended].map(String)));
  } else if (dataset === "organizations") {
    csv = toCsv(["Organization", "Plan", "Status", "Events", "Registrations"], data.topOrganizations.map((o) => [o.name, o.plan ?? "", o.status, String(o.events), String(o.registrations)]));
  } else if (dataset === "events") {
    csv = toCsv(["Event", "Organization", "Date", "Status", "Registrations"], data.topEvents.map((e) => [e.title, e.organization.name, e.startDateTime.toISOString().slice(0, 10), e.status, String(e.registrations)]));
  } else {
    return fail(res, 400, "VALIDATION_ERROR", "Unknown dataset");
  }
  await logActivity(req, { action: "platform.analytics.csv", metadata: { dataset } });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="platform-${dataset}-${new Date().toISOString().slice(0, 10)}.csv"`);
  return res.send(csv);
}
