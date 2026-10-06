import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getMyWorks } from "../controllers/work.controller.js";

const router = Router();

router.get("/mine", authenticate, getMyWorks);

export default router;