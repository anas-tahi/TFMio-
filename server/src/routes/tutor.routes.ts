import { Router } from "express";
import { authenticate, requireTutor } from "../middleware/auth.js";
import { getTutorProfile, updateTutorProfile } from "../controllers/tutor.controller.js";

const router = Router();

router.get("/profile", authenticate, requireTutor, getTutorProfile);
router.put("/profile", authenticate, requireTutor, updateTutorProfile);

export default router;