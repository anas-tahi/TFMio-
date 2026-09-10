import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getRubricForGrading,
  submitGrade,
  getGradesForWork,
} from "../controllers/grade.controller.js";

const router = Router();

router.get("/:workId/rubric/:role", authenticate, getRubricForGrading);
router.post("/:workId", authenticate, submitGrade);
router.get("/:workId", authenticate, getGradesForWork);

export default router;