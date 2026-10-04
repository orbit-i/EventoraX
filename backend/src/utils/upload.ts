import multer from "multer";

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only PNG or JPEG files are allowed"));
  }
  cb(null, true);
}

export const logoUpload = multer({
  storage: multer.memoryStorage(), // file lands in req.file.buffer instead of disk
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});