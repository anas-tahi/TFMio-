import { Router } from "express";
import { authenticate, requireCoordinator } from "../middleware/auth.js";
import {
  getPendingGrades,
  extendGradingDeadline,
  closeGradeWithReceived,
} from "../controllers/pendingGrades.controller.js";

const router = Router();

router.get("/", authenticate, requireCoordinator, getPendingGrades);
router.patch("/:workId/extend", authenticate, requireCoordinator, extendGradingDeadline);
router.post("/:workId/close", authenticate, requireCoordinator, closeGradeWithReceived);

export default router;