import multer from "multer";

/** Error with an HTTP status, turned into a 400 response by the error handler. */
export class UploadError extends Error {
  status = 400;
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Accepts one image up to 2 MB, kept in memory (req.file.buffer). */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new UploadError("Only PNG, JPEG or WEBP images are allowed"));
    }
    cb(null, true);
  },
});