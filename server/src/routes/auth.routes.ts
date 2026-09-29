import { Router } from "express";
import {
  register,
  login,
  me,
  verifyActivation,
  completeActivation,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);
router.post("/activate/verify", verifyActivation);
router.post("/activate/complete", completeActivation);

export default router;