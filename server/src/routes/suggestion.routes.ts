import { Router } from "express";
import { authenticate, requireStudent, requireRole } from "../middleware/auth.js";
import { UserRole } from "../types/index.js";
import { suggestTutors } from "../controllers/suggestion.controller.js";
import { suggestSimilarTopics } from "../controllers/similarTopic.controller.js";

const router = Router();

router.post("/tutors", authenticate, requireStudent, suggestTutors);
router.post(
  "/similar-topics",
  authenticate,
  requireRole(UserRole.STUDENT, UserRole.TUTOR),
  suggestSimilarTopics
);

export default router;