import { Router } from "express";
import { authenticate, requireTutor, requireCoordinator } from "../middleware/auth.js";
import { getTutorHistory, getCoordinatorHistory } from "../controllers/history.controller.js";

const router = Router();

router.get("/tutor", authenticate, requireTutor, getTutorHistory);
router.get("/coordinator", authenticate, requireCoordinator, getCoordinatorHistory);

export default router;