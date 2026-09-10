import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getMessages, sendMessage, getMyChats } from "../controllers/message.controller.js";

const router = Router();

router.get("/", authenticate, getMyChats);
router.get("/:workId", authenticate, getMessages);
router.post("/:workId", authenticate, sendMessage);

export default router;