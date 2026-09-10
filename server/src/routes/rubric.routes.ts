import { Router } from "express";
import { authenticate, requireCoordinator } from "../middleware/auth.js";
import { getMyRubrics, setRubric } from "../controllers/rubric.controller.js";

const router = Router();

router.get("/mine", authenticate, requireCoordinator, getMyRubrics);
router.put("/", authenticate, requireCoordinator, setRubric);

export default router;