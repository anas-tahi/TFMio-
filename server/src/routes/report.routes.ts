import { Router } from "express";
import { authenticate, requireCoordinator } from "../middleware/auth.js";
import { generateAssignmentReport } from "../controllers/report.controller.js";

const router = Router();

router.get("/assignments", authenticate, requireCoordinator, generateAssignmentReport);

export default router;