import { Router } from "express";
import { authenticate, requireStudent, requireTutor } from "../middleware/auth.js";
import { uploadDocument } from "../middleware/upload.js";
import {
  submitDocument,
  getDocumentsForWork,
  reviewDocument,
  downloadDocument,
} from "../controllers/document.controller.js";

const router = Router();

router.post("/:workId", authenticate, requireStudent, uploadDocument.single("file"), submitDocument);
router.get("/:workId", authenticate, getDocumentsForWork);
router.get("/file/:id", authenticate, downloadDocument);
router.patch("/:id/review", authenticate, requireTutor, reviewDocument);

export default router;