import { Router } from "express";
import { authenticate, requireStudent } from "../middleware/auth.js";
import { getRecommendations } from "../controllers/recommendation.controller.js";

const router = Router();

router.get("/", authenticate, requireStudent, getRecommendations);

export default router;