import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getDegrees } from "../controllers/degree.controller.js";

const router = Router();

router.get("/", authenticate, getDegrees);

export default router;