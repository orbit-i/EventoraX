import { Router } from "express";
import { orgScoped, canWrite } from "../middleware/orgChain";
import { imageUpload } from "../utils/upload";
import { saveUpload } from "../utils/storage";
import { ok, fail } from "../utils/http";
import { logActivity } from "../utils/activity";

const KIND_FOLDERS: Record<string, string> = {
  speaker: "speakers",
  sponsor: "sponsors",
  logo: "branding",
  signature: "branding",
};

export const uploadsRouter = Router();
uploadsRouter.use(...orgScoped);

// POST /api/v1/uploads/image?kind=speaker|sponsor|logo|signature   (multipart, field name: file)
// Uploads first and returns the URL, so a form can show the image before the record is saved.
uploadsRouter.post("/image", canWrite, imageUpload.single("file"), async (req, res) => {
  const kind = typeof req.query.kind === "string" ? req.query.kind : "";
  const folder = KIND_FOLDERS[kind];
  if (!folder) {
    return fail(res, 400, "VALIDATION_ERROR", "kind must be speaker, sponsor, logo or signature");
  }
  if ((kind === "logo" || kind === "signature") && req.user!.role !== "admin") {
    return fail(res, 403, "FORBIDDEN", "Only admins can change the organization's branding");
  }
  if (!req.file) {
    return fail(res, 400, "NO_FILE", "No file uploaded (form field name must be: file)");
  }

  const url = await saveUpload(`orgs/${req.org!.id}/${folder}`, req.file.buffer, req.file.mimetype);
  await logActivity(req, { action: "upload.image", metadata: { kind, url } });
  return ok(res, { url }, 201);
});