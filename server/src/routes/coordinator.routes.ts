import { Router } from "express";
import { authenticate, requireCoordinator } from "../middleware/auth.js";
import { getPendingMatches, decideMatch } from "../controllers/coordinator.controller.js";

const router = Router();

router.get("/matches", authenticate, requireCoordinator, getPendingMatches);
router.patch("/matches/:id/decision", authenticate, requireCoordinator, decideMatch);

export default router;