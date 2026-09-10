import { Router } from "express";
import { authenticate, requireCoordinator } from "../middleware/auth.js";
import { getDegrees, setCalendar, getMyCalendar } from "../controllers/degree.controller.js";

const router = Router();

router.get("/", authenticate, getDegrees);
router.get("/calendar/mine", authenticate, requireCoordinator, getMyCalendar);
router.patch("/calendar/mine", authenticate, requireCoordinator, setCalendar);

export default router;