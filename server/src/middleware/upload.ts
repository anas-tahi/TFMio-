import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = path.resolve("uploads/documents");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

function fileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("Solo se permiten archivos PDF"));
  }
  cb(null, true);
}

export const uploadDocument = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});