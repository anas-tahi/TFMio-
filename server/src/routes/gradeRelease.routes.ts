import { Router } from "express";
import { authenticate, requireCoordinator } from "../middleware/auth.js";
import { getGradesToRelease, publishGrade } from "../controllers/gradeRelease.controller.js";

const router = Router();

router.get("/", authenticate, requireCoordinator, getGradesToRelease);
router.patch("/:workId/publish", authenticate, requireCoordinator, publishGrade);

export default router;