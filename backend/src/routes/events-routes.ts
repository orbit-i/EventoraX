import { Router } from "express";
import { orgScoped, canWrite } from "../middleware/orgChain";
import * as events from "../controllers/events-controller";

export const eventsRouter = Router();
eventsRouter.use(...orgScoped);
eventsRouter.get("/", events.listEvents);
eventsRouter.get("/stats", events.getEventsOverview); // before "/:id"
eventsRouter.post("/", canWrite, events.createEvent);
eventsRouter.get("/:id", events.getEvent);
eventsRouter.get("/:id/stats", events.getEventStats);
eventsRouter.patch("/:id", canWrite, events.updateEvent);
eventsRouter.delete("/:id", canWrite, events.deleteEvent);
eventsRouter.post("/:id/duplicate", canWrite, events.duplicateEvent);
eventsRouter.post("/:id/restore", canWrite, events.restoreEvent);

export const categoriesRouter = Router();
categoriesRouter.use(...orgScoped);
categoriesRouter.get("/", events.listCategories);
categoriesRouter.post("/", canWrite, events.createCategory);
categoriesRouter.patch("/:id", canWrite, events.updateCategory);
categoriesRouter.delete("/:id", canWrite, events.deleteCategory);