import { Router } from "express";
import { orgScoped, canWrite } from "../middleware/orgChain";
import { csvUpload } from "../utils/upload";
import * as regs from "../controllers/registrations-controller";

export const registrationsRouter = Router();
registrationsRouter.use(...orgScoped);

// Fixed paths first, so they aren't mistaken for an :id
registrationsRouter.get("/", regs.listRegistrations);
registrationsRouter.get("/export", regs.exportRegistrations); // viewers may export (read-only)
registrationsRouter.post("/", canWrite, regs.createRegistration);
registrationsRouter.post("/csv-import/parse", canWrite, csvUpload.single("file"), regs.parseCsvImport);
registrationsRouter.post("/csv-import/confirm", canWrite, regs.confirmCsvImport);
registrationsRouter.post("/bulk", canWrite, regs.bulkAction);
registrationsRouter.post("/email", canWrite, regs.emailRegistrations);

registrationsRouter.get("/:id", regs.getRegistration);
registrationsRouter.patch("/:id", canWrite, regs.updateRegistration);
registrationsRouter.patch("/:id/status", canWrite, regs.setRegistrationStatus);
registrationsRouter.patch("/:id/attendance", canWrite, regs.setRegistrationStatus); // older name, still works
registrationsRouter.delete("/:id", canWrite, regs.deleteRegistration);