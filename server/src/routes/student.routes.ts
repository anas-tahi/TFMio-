import { Router } from "express";
import { authenticate, requireStudent } from "../middleware/auth.js";
import { updateProfile, getAvailableTutors } from "../controllers/student.controller.js";

const router = Router();

router.put("/profile", authenticate, requireStudent, updateProfile);
router.get("/tutors", authenticate, requireStudent, getAvailableTutors);

export default router;