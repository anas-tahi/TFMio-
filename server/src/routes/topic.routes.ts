import { Router } from "express";
import { authenticate, requireTutor } from "../middleware/auth.js";
import {
  createTopic,
  publishTopic,
  getMyTopics,
  getTopicById,
} from "../controllers/topic.controller.js";

const router = Router();

router.post("/", authenticate, requireTutor, createTopic);
router.post("/:id/publish", authenticate, requireTutor, publishTopic);
router.get("/mine", authenticate, requireTutor, getMyTopics);
router.get("/:id", authenticate, getTopicById);

export default router;