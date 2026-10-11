import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import { getSetting } from "./settings";

/** Error with an HTTP status, turned into a 400 response by the error handler. */
export class UploadError extends Error {
  status = 400;
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Accepts one image (hard cap 20 MB; the real limit is checked with checkImageSize), kept in memory (req.file.buffer). */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new UploadError("Only PNG, JPEG or WEBP images are allowed"));
    }
    cb(null, true);
  },
});

/** Accepts one .csv file up to 2 MB, kept in memory (req.file.buffer). */
export const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".csv")) {
      return cb(new UploadError("Only .csv files are supported"));
    }
    cb(null, true);
  },
});
/** The platform's image size limit (System settings → File uploads). Returns an error message, or null if the file is fine. */
export async function checkImageSize(file: { size: number }): Promise<string | null> {
  const mb = Math.min(20, Math.max(1, Number(await getSetting<number>("uploads.maxMb", 2)) || 2));
  return file.size > mb * 1024 * 1024 ? `Images can be at most ${mb} MB` : null;
}

/** Route guard placed after imageUpload.single(): rejects images over the platform limit. */
export async function imageSizeGuard(req: Request, res: Response, next: NextFunction) {
  const tooBig = req.file ? await checkImageSize(req.file) : null;
  if (tooBig) return res.status(400).json({ data: null, error: { code: "FILE_TOO_LARGE", message: tooBig } });
  next();
}
