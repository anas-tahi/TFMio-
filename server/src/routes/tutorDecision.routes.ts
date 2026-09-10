import { Router } from "express";
import { authenticate, requireTutor } from "../middleware/auth.js";
import { getPendingFinalDecisions, decideFinal } from "../controllers/tutorDecision.controller.js";

const router = Router();

router.get("/", authenticate, requireTutor, getPendingFinalDecisions);
router.patch("/:id/decision", authenticate, requireTutor, decideFinal);

export default router;