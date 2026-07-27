import { Router } from "express";
import { authenticate, requireStudent, requireTutor } from "../middleware/auth.js";
import { createInterest, getMyInterests, decideInterest } from "../controllers/interest.controller.js";

const router = Router();

router.post("/", authenticate, requireStudent, createInterest);
router.get("/mine", authenticate, requireTutor, getMyInterests);
router.patch("/:id/decision", authenticate, requireTutor, decideInterest);

export default router;