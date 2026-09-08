import { Router } from "express";
import { authenticate, requireStudent, requireTutor } from "../middleware/auth.js";
import {
  createProposal,
  getMyProposals,
  getReceivedProposals,
  updateProposal,
  decideProposal,
} from "../controllers/proposal.controller.js";

const router = Router();

router.post("/", authenticate, requireStudent, createProposal);
router.get("/mine", authenticate, requireStudent, getMyProposals);
router.get("/received", authenticate, requireTutor, getReceivedProposals);
router.patch("/:id", authenticate, requireStudent, updateProposal);
router.patch("/:id/decision", authenticate, requireTutor, decideProposal);

export default router;