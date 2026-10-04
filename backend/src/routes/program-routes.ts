import { Router } from "express";
import { orgScoped, canWrite } from "../middleware/orgChain";
import { imageUpload } from "../utils/upload";
import * as program from "../controllers/program-controller";

export const speakersRouter = Router();
speakersRouter.use(...orgScoped);
speakersRouter.get("/", program.listSpeakers);
speakersRouter.post("/", canWrite, program.createSpeaker);
speakersRouter.get("/:id", program.getSpeaker);
speakersRouter.patch("/:id", canWrite, program.updateSpeaker);
speakersRouter.delete("/:id", canWrite, program.deleteSpeaker);
speakersRouter.post("/:id/photo", canWrite, imageUpload.single("file"), program.uploadSpeakerPhoto);

export const sponsorsRouter = Router();
sponsorsRouter.use(...orgScoped);
sponsorsRouter.get("/", program.listSponsors);
sponsorsRouter.post("/", canWrite, program.createSponsor);
sponsorsRouter.get("/:id", program.getSponsor);
sponsorsRouter.patch("/:id", canWrite, program.updateSponsor);
sponsorsRouter.delete("/:id", canWrite, program.deleteSponsor);
sponsorsRouter.post("/:id/logo", canWrite, imageUpload.single("file"), program.uploadSponsorLogo);

export const sessionsRouter = Router();
sessionsRouter.use(...orgScoped);
sessionsRouter.get("/", program.listSessions);
sessionsRouter.post("/", canWrite, program.createSession);
sessionsRouter.get("/:id", program.getSession);
sessionsRouter.patch("/:id", canWrite, program.updateSession);
sessionsRouter.delete("/:id", canWrite, program.deleteSession);

export const reorderRouter = Router();
reorderRouter.use(...orgScoped);
reorderRouter.post("/", canWrite, program.reorder);