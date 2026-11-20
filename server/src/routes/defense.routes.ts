import { Router } from "express";
import { authenticate, requireCoordinator } from "../middleware/auth.js";
import {
  getDefenseReadyMatches,
  getJuryPool,
  getJurySuggestion,
  scheduleDefense,
} from "../controllers/defense.controller.js";

const router = Router();

router.get("/ready", authenticate, requireCoordinator, getDefenseReadyMatches);
router.get("/jury-pool", authenticate, requireCoordinator, getJuryPool);
router.get("/:workId/jury-suggestion", authenticate, requireCoordinator, getJurySuggestion);
router.patch("/:id/schedule", authenticate, requireCoordinator, scheduleDefense);

export default router;