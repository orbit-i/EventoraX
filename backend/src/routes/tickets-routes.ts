import { Router } from "express";
import { orgScoped, canWrite } from "../middleware/orgChain";
import {
  listTickets,
  ticketStats,
  downloadTicket,
  emailOneTicket,
  emailManyTickets,
  downloadTicketsZip,
  checkIn,
  undoCheckIn,
} from "../controllers/tickets-controller";

export const ticketsRouter = Router();
ticketsRouter.use(...orgScoped);

// Fixed paths first, then /:id
ticketsRouter.get("/", listTickets);
ticketsRouter.get("/stats", ticketStats);
ticketsRouter.get("/zip", downloadTicketsZip);
ticketsRouter.post("/email", canWrite, emailManyTickets);
ticketsRouter.post("/check-in", canWrite, checkIn);
ticketsRouter.get("/:id/pdf", downloadTicket);
ticketsRouter.post("/:id/email", canWrite, emailOneTicket);
ticketsRouter.post("/:id/undo-check-in", canWrite, undoCheckIn);
