import { Router } from "express";
import { orgScoped } from "../middleware/orgChain";
import { getIdCardOptions, listIdCardPeople, idCardStats, previewIdCards, downloadIdCards } from "../controllers/idcards-controller";

// Printing cards only reads attendee data, so every role (viewers too) may do it.
export const idCardsRouter = Router();
idCardsRouter.use(...orgScoped);

idCardsRouter.get("/", listIdCardPeople);
idCardsRouter.get("/options", getIdCardOptions);
idCardsRouter.get("/stats", idCardStats);
idCardsRouter.get("/preview", previewIdCards);
idCardsRouter.get("/pdf", downloadIdCards);
