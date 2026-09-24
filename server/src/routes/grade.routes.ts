import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getMyRoleForWork,
  getRubricForGrading,
  submitGrade,
  getGradesForWork,
} from "../controllers/grade.controller.js";

const router = Router();

router.get("/:workId/my-role", authenticate, getMyRoleForWork);
router.get("/:workId/rubric/:role", authenticate, getRubricForGrading);
router.post("/:workId", authenticate, submitGrade);
router.get("/:workId", authenticate, getGradesForWork);

export default router;