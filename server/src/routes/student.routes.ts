import { Router } from "express";
import { authenticate, requireStudent } from "../middleware/auth.js";
import { updateProfile } from "../controllers/student.controller.js";

const router = Router();

router.put("/profile", authenticate, requireStudent, updateProfile);

export default router;