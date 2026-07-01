import { authRouter } from "./auth-router";
import { orgRouter } from "./org-router";
import { eventRouter } from "./event-router";
import { registrationRouter } from "./registration-router";
import { certificateRouter } from "./certificate-router";
import { ticketRouter } from "./ticket-router";
import { speakerRouter } from "./speaker-router";
import { sponsorRouter } from "./sponsor-router";
import { scheduleRouter } from "./schedule-router";
import { analyticsRouter } from "./analytics-router";
import { teamRouter } from "./team-router";
import { superadminRouter } from "./superadmin-router";
import { settingsRouter } from "./settings-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  org: orgRouter,
  event: eventRouter,
  registration: registrationRouter,
  certificate: certificateRouter,
  ticket: ticketRouter,
  speaker: speakerRouter,
  sponsor: sponsorRouter,
  schedule: scheduleRouter,
  analytics: analyticsRouter,
  team: teamRouter,
  superadmin: superadminRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
